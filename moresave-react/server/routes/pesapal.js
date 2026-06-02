const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../db');

const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3'; // Production API URL

// Helper to authenticate with PesaPal
async function getAuthToken() {
  try {
    const res = await axios.post(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return res.data.token;
  } catch (error) {
    console.error('PesaPal Auth Token Error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with PesaPal');
  }
}

// Helper to get or register IPN ID
async function getIPNId(token) {
  try {
    const res = await axios.get(`${PESAPAL_BASE_URL}/api/URLSetup/GetIpnList`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    // Check if we already have one registered
    const existing = res.data.find(ipn => ipn.url.includes('localhost') || ipn.url.includes('moresave'));
    if (existing) {
      return existing.ipn_id;
    }

    // Register a new IPN URL using the production domain
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:5000';

    const regRes = await axios.post(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
      url: `${baseUrl}/api/pesapal/ipn`,
      ipn_notification_type: 'GET'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    return regRes.data.ipn_id;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('PesaPal IPN Error:', errorDetails);
    throw new Error(`Failed to get PesaPal IPN ID: ${typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails}`);
  }
}

// Route: Submit Payment Request (Initiate Real Mobile Money Deposit)
router.post('/submit-payment', async (req, res) => {
  const { memberNumber, amount, paymentMethod, phoneNumber, provider, description, usePopup } = req.body;

  try {
    // 1. Find the member and account details
    const [accounts] = await db.execute(`
      SELECT a.account_id, m.full_name, m.email, m.phone_number
      FROM accounts a
      JOIN members m ON a.member_id = m.member_id
      WHERE m.member_number = ?
    `, [memberNumber]);

    if (accounts.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const account = accounts[0];
    const names = account.full_name.split(' ');
    const firstName = names[0] || 'Member';
    const lastName = names[1] || 'Sacco';

    // 2. Authenticate with PesaPal and get IPN ID
    const token = await getAuthToken();
    const ipnId = await getIPNId(token);

    // 3. Prepare unique references
    const merchantReference = 'MRS-TXN-' + Date.now();

    // 4. Determine callback URL — use VERCEL_URL in production
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : `${req.protocol}://${req.get('host')}`;

    const callbackUrl = usePopup 
      ? `${baseUrl}/api/pesapal/popup-callback`
      : `${baseUrl}/member/transactions`;

    // 5. Submit order request to PesaPal with mobile money specific configuration
    const orderPayload = {
      id: merchantReference,
      currency: 'UGX',
      amount: parseFloat(amount),
      description: `Moresave SACCO - ${description || 'Savings Deposit'} (${memberNumber})`,
      callback_url: callbackUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: account.email || 'info@moresavesacco.com',
        phone_number: phoneNumber || account.phone_number || '0772106384',
        first_name: firstName,
        last_name: lastName,
        country_code: 'UG',
        city: 'Kampala',
        state: 'Central',
        postal_code: '00000',
        line_1: 'Moresave SACCO'
      },
      // Force mobile money payment method
      payment_method: 'MOBILEMONEY',
      // Specify the mobile money provider
      payment_account: phoneNumber,
      payment_account_reference: `${provider}_UGANDA`
    };

    console.log('PesaPal Order Payload:', JSON.stringify(orderPayload, null, 2));

    const orderRes = await axios.post(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, orderPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const { order_tracking_id, redirect_url } = orderRes.data;

    // 6. Create a pending request record in transaction_requests
    await db.execute(`
      INSERT INTO transaction_requests (
        account_id, request_type, amount, payment_method, phone_number, sim_provider, description, status, tracking_id, merchant_reference
      ) VALUES (?, 'deposit', ?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [
      account.account_id,
      amount,
      paymentMethod,
      phoneNumber,
      provider,
      `Moresave SACCO - ${description || 'Savings Deposit'}`,
      order_tracking_id,
      merchantReference
    ]);

    // Log the transaction initiation to audit log
    await db.logAudit(null, memberNumber, 'DEPOSIT_INITIATE', 'transaction_requests', order_tracking_id, `Member ${memberNumber} initiated PesaPal deposit of UGX ${Number(amount).toLocaleString()} via Mobile Money to ${phoneNumber}`);

    res.json({
      success: true,
      redirect_url,
      order_tracking_id,
      merchantReference,
      usePopup: !!usePopup,
      message: `Mobile money prompt sent to ${phoneNumber}. Please check your phone and enter your PIN.`
    });

  } catch (error) {
    console.error('Submit Payment Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route: Verify status from PesaPal and Credit Account
router.get('/verify-status/:trackingId', async (req, res) => {
  const { trackingId } = req.params;

  try {
    // 1. Get transaction status from PesaPal
    const token = await getAuthToken();
    const statusRes = await axios.get(`${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const paymentInfo = statusRes.data;
    const status = paymentInfo.payment_status_description?.toUpperCase();

    // 2. Check if payment completed successfully
    if (status === 'COMPLETED') {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Find the pending transaction request
        const [requests] = await conn.execute(`
          SELECT r.*, a.current_balance, m.full_name, m.email
          FROM transaction_requests r
          JOIN accounts a ON r.account_id = a.account_id
          JOIN members m ON a.member_id = m.member_id
          WHERE r.tracking_id = ?
        `, [trackingId]);

        if (requests.length === 0) {
          throw new Error('Transaction request not found');
        }

        const request = requests[0];

        // If it's already approved, just commit and return success (idempotent protection!)
        if (request.status === 'approved') {
          await conn.commit();
          return res.json({ success: true, status: 'COMPLETED', alreadyProcessed: true });
        }

        const amountVal = parseFloat(request.amount);
        const newBalance = parseFloat(request.current_balance) + amountVal;

        // Construct dynamic description showing details of PesaPal confirmation
        const methodDesc = `[PesaPal - ${request.sim_provider || paymentInfo.payment_method || 'MM'}: ${request.phone_number || paymentInfo.payment_account || 'N/A'}] ${request.description} (${paymentInfo.confirmation_code || 'Real Deposit'})`;

        // A. Record in transactions ledger
        await conn.execute(`
          INSERT INTO transactions (account_id, transaction_type, amount, balance_after, description, recorded_by)
          VALUES (?, 'deposit', ?, ?, ?, 1)
        `, [request.account_id, amountVal, newBalance, methodDesc]);

        // B. Update savings balance
        await conn.execute("UPDATE accounts SET current_balance = ? WHERE account_id = ?", [newBalance, request.account_id]);

        // C. Snapshot for dividends
        await conn.execute(`
          INSERT INTO monthly_savings_snapshot (member_id, snap_year, snap_month, balance)
          SELECT member_id, YEAR(NOW()), MONTH(NOW()), ? FROM accounts WHERE account_id = ?
          ON DUPLICATE KEY UPDATE balance = ?
        `, [newBalance, request.account_id, newBalance]);

        // D. Mark the request as approved
        await conn.execute(`
          UPDATE transaction_requests
          SET status = 'approved', actioned_at = NOW(), actioned_by = 1
          WHERE request_id = ?
        `, [request.request_id]);

        // Log the completed transaction to audit log
        await db.logAudit(null, request.full_name, 'DEPOSIT_COMPLETE', 'transactions', trackingId, `Successfully confirmed and credited UGX ${Number(amountVal).toLocaleString()} deposit to Sacco savings account via PesaPal Mobile Money`);

        await conn.commit();
        res.json({ success: true, status: 'COMPLETED', alreadyProcessed: false });

      } catch (err) {
        await conn.rollback();
        console.error('MySQL PesaPal Crediting Transaction Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
      } finally {
        conn.release();
      }
    } else {
      res.json({ success: false, status, message: `PesaPal status is ${status}` });
    }

  } catch (error) {
    console.error('Verify Status Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route: Handle popup callback from PesaPal
router.get('/popup-callback', async (req, res) => {
  const { OrderTrackingId, OrderMerchantReference } = req.query;
  
  try {
    if (OrderTrackingId) {
      // Verify the transaction status
      const verifyRes = await axios.get(`${req.protocol}://${req.get('host')}/api/pesapal/verify-status/${OrderTrackingId}`);
      const verifyData = verifyRes.data;
      
      // Return a simple HTML page that communicates with parent window
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Processing</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              background: white;
              color: #333;
              padding: 30px;
              border-radius: 10px;
              max-width: 400px;
              margin: 0 auto;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .success { color: #27ae60; }
            .error { color: #e74c3c; }
            .loading {
              width: 30px;
              height: 30px;
              border: 3px solid #f3f3f3;
              border-top: 3px solid #667eea;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Processing Payment...</h2>
            <div class="loading"></div>
            <p>Please wait while we confirm your payment.</p>
          </div>
          <script>
            // Send result to parent window
            setTimeout(() => {
              const result = {
                success: ${verifyData.success},
                status: '${verifyData.status || 'UNKNOWN'}',
                trackingId: '${OrderTrackingId}',
                merchantRef: '${OrderMerchantReference || ''}'
              };
              
              if (window.parent && window.parent.postMessage) {
                window.parent.postMessage({
                  type: 'PESAPAL_PAYMENT_RESULT',
                  data: result
                }, '*');
              }
              
              // Also try to close the popup
              setTimeout(() => {
                if (window.close) {
                  window.close();
                }
              }, 2000);
            }, 1000);
          </script>
        </body>
        </html>
      `;
      
      res.send(html);
    } else {
      res.status(400).send('Missing OrderTrackingId parameter');
    }
  } catch (error) {
    console.error('Popup Callback Error:', error);
    res.status(500).send('Error processing payment callback');
  }
});

// Route: Submit Mobile Money Withdrawal Request (Send money to phone)
router.post('/submit-withdrawal', async (req, res) => {
  const { memberNumber, amount, phoneNumber, provider, description } = req.body;

  try {
    // 1. Find the member and account details
    const [accounts] = await db.execute(`
      SELECT a.account_id, a.current_balance, m.full_name, m.email, m.phone_number
      FROM accounts a
      JOIN members m ON a.member_id = m.member_id
      WHERE m.member_number = ?
    `, [memberNumber]);

    if (accounts.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const account = accounts[0];
    const withdrawalAmount = parseFloat(amount);

    // 2. Check if member has sufficient balance
    if (account.current_balance < withdrawalAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. Available: UGX ${Number(account.current_balance).toLocaleString()}, Requested: UGX ${Number(withdrawalAmount).toLocaleString()}` 
      });
    }

    // 3. Authenticate with PesaPal
    const token = await getAuthToken();
    const ipnId = await getIPNId(token);

    const names = account.full_name.split(' ');
    const firstName = names[0] || 'Member';
    const lastName = names[1] || 'Sacco';
    const merchantReference = 'MRS-WTH-' + Date.now();

    // 4. Submit withdrawal/disbursement request to PesaPal
    const disbursementPayload = {
      id: merchantReference,
      currency: 'UGX',
      amount: withdrawalAmount,
      description: `Moresave SACCO Withdrawal - ${description || 'Savings Withdrawal'} (${memberNumber})`,
      callback_url: `${req.protocol}://${req.get('host')}/api/pesapal/withdrawal-callback`,
      notification_id: ipnId,
      recipient: {
        email_address: account.email || 'info@moresavesacco.com',
        phone_number: phoneNumber,
        first_name: firstName,
        last_name: lastName,
        country_code: 'UG',
        city: 'Kampala',
        state: 'Central',
        postal_code: '00000',
        line_1: 'Moresave SACCO Member'
      },
      // Specify mobile money disbursement
      disbursement_method: 'MOBILEMONEY',
      disbursement_account: phoneNumber,
      disbursement_account_reference: `${provider}_UGANDA`
    };

    console.log('PesaPal Disbursement Payload:', JSON.stringify(disbursementPayload, null, 2));

    // Note: PesaPal v3 API might use different endpoint for disbursements
    // This is a conceptual implementation - actual endpoint may vary
    const disbursementRes = await axios.post(`${PESAPAL_BASE_URL}/api/Disbursements/SubmitDisbursementRequest`, disbursementPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const { order_tracking_id, status } = disbursementRes.data;

    // 5. Create a pending withdrawal record
    await db.execute(`
      INSERT INTO transaction_requests (
        account_id, request_type, amount, payment_method, phone_number, sim_provider, description, status, tracking_id, merchant_reference
      ) VALUES (?, 'withdrawal', ?, 'mobile_money', ?, ?, ?, 'pending', ?, ?)
    `, [
      account.account_id,
      withdrawalAmount,
      phoneNumber,
      provider,
      `Moresave SACCO Withdrawal - ${description || 'Savings Withdrawal'}`,
      order_tracking_id,
      merchantReference
    ]);

    // Log the withdrawal initiation
    await db.logAudit(null, memberNumber, 'WITHDRAWAL_INITIATE', 'transaction_requests', order_tracking_id, `Member ${memberNumber} initiated mobile money withdrawal of UGX ${Number(withdrawalAmount).toLocaleString()} to ${phoneNumber}`);

    res.json({
      success: true,
      order_tracking_id,
      merchantReference,
      message: `Withdrawal request submitted. Money will be sent to ${phoneNumber} once processed.`,
      status
    });

  } catch (error) {
    console.error('Submit Withdrawal Error:', error.response?.data || error.message);
    
    // Handle case where PesaPal doesn't support disbursements or different API
    if (error.response?.status === 404 || error.message.includes('404')) {
      // Fallback: Create manual withdrawal request for admin approval
      try {
        const [accounts] = await db.execute(`
          SELECT a.account_id FROM accounts a
          JOIN members m ON a.member_id = m.member_id
          WHERE m.member_number = ?
        `, [memberNumber]);

        if (accounts.length > 0) {
          const merchantReference = 'MRS-WTH-' + Date.now();
          
          await db.execute(`
            INSERT INTO transaction_requests (
              account_id, request_type, amount, payment_method, phone_number, sim_provider, description, status, merchant_reference
            ) VALUES (?, 'withdrawal', ?, 'mobile_money', ?, ?, ?, 'pending', ?)
          `, [
            accounts[0].account_id,
            amount,
            phoneNumber,
            provider,
            `Mobile Money Withdrawal - ${description || 'Savings Withdrawal'}`,
            merchantReference
          ]);

          return res.json({
            success: true,
            merchantReference,
            message: `Withdrawal request submitted for admin approval. Money will be sent to ${phoneNumber} once approved.`,
            requiresApproval: true
          });
        }
      } catch (fallbackError) {
        console.error('Fallback withdrawal error:', fallbackError);
      }
    }
    
    res.status(500).json({ success: false, message: 'Failed to process withdrawal request. Please try again or contact support.' });
  }
});

// Route: Handle withdrawal callback
router.get('/withdrawal-callback', async (req, res) => {
  const { OrderTrackingId, OrderMerchantReference } = req.query;
  
  try {
    if (OrderTrackingId) {
      // Process withdrawal completion
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        // Find the pending withdrawal request
        const [requests] = await conn.execute(`
          SELECT r.*, a.current_balance, m.full_name, m.member_number
          FROM transaction_requests r
          JOIN accounts a ON r.account_id = a.account_id
          JOIN members m ON a.member_id = m.member_id
          WHERE r.tracking_id = ? AND r.request_type = 'withdrawal'
        `, [OrderTrackingId]);

        if (requests.length === 0) {
          throw new Error('Withdrawal request not found');
        }

        const request = requests[0];
        const withdrawalAmount = parseFloat(request.amount);
        const newBalance = parseFloat(request.current_balance) - withdrawalAmount;

        // Record the withdrawal transaction
        await conn.execute(`
          INSERT INTO transactions (account_id, transaction_type, amount, balance_after, description, recorded_by)
          VALUES (?, 'withdrawal', ?, ?, ?, 1)
        `, [request.account_id, withdrawalAmount, newBalance, `[PesaPal Mobile Money Withdrawal to ${request.phone_number}] ${request.description}`]);

        // Update account balance
        await conn.execute("UPDATE accounts SET current_balance = ? WHERE account_id = ?", [newBalance, request.account_id]);

        // Mark request as approved
        await conn.execute(`
          UPDATE transaction_requests
          SET status = 'approved', actioned_at = NOW(), actioned_by = 1
          WHERE tracking_id = ?
        `, [OrderTrackingId]);

        // Log completion
        await db.logAudit(null, request.member_number, 'WITHDRAWAL_COMPLETE', 'transactions', OrderTrackingId, `Successfully sent UGX ${Number(withdrawalAmount).toLocaleString()} to ${request.phone_number} via PesaPal Mobile Money`);

        await conn.commit();
        res.send('Withdrawal processed successfully');

      } catch (err) {
        await conn.rollback();
        console.error('Withdrawal processing error:', err);
        res.status(500).send('Error processing withdrawal');
      } finally {
        conn.release();
      }
    } else {
      res.status(400).send('Missing OrderTrackingId parameter');
    }
  } catch (error) {
    console.error('Withdrawal Callback Error:', error);
    res.status(500).send('Error processing withdrawal callback');
  }
});

module.exports = router;
