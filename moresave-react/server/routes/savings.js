const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const notifyMember = require('../utils/emailService');

// Multer config for receipt uploads
const receiptDir = process.env.VERCEL ? '/tmp/receipts/' : 'uploads/receipts/';
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(receiptDir)) fs.mkdirSync(receiptDir, { recursive: true });
    cb(null, receiptDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'receipt-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadReceipt = multer({ storage: receiptStorage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// Add receipt_url column if it doesn't exist (auto-migration)
(async () => {
  try {
    await db.execute(`ALTER TABLE transaction_requests ADD COLUMN receipt_url VARCHAR(255) NULL`);
  } catch (e) { /* already exists */ }
})();

// Get account info
router.get('/:memberNumber', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT m.full_name, m.phone_number, a.account_id, a.account_number, a.current_balance 
      FROM members m 
      JOIN accounts a ON m.member_id = a.member_id 
      WHERE m.member_number = ?
    `, [req.params.memberNumber]);

    if (rows.length === 0) return res.status(404).json({ message: 'Account not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Record transaction
router.post('/transaction', async (req, res) => {
  const { memberNumber, type, amount, description } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [accounts] = await conn.execute(`
      SELECT a.account_id, a.current_balance 
      FROM accounts a 
      JOIN members m ON a.member_id = m.member_id 
      WHERE m.member_number = ?
    `, [memberNumber]);

    if (accounts.length === 0) throw new Error('Account not found');
    const account = accounts[0];

    if (type === 'withdrawal' && amount > account.current_balance) {
      throw new Error('Insufficient balance');
    }

    const newBalance = type === 'deposit' 
      ? parseFloat(account.current_balance) + parseFloat(amount) 
      : parseFloat(account.current_balance) - parseFloat(amount);

    // Record transaction
    await conn.execute(
      `INSERT INTO transactions (account_id, transaction_type, amount, balance_after, description, recorded_by)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [account.account_id, type, amount, newBalance, description]
    );

    // Update balance
    await conn.execute("UPDATE accounts SET current_balance = ? WHERE account_id = ?", [newBalance, account.account_id]);

    // Snapshot for dividends
    await conn.execute(
      `INSERT INTO monthly_savings_snapshot (member_id, snap_year, snap_month, balance)
       SELECT member_id, YEAR(NOW()), MONTH(NOW()), ? FROM accounts WHERE account_id = ?
       ON DUPLICATE KEY UPDATE balance = ?`,
      [newBalance, account.account_id, newBalance]
    );

    // Log this staff transaction to audit log
    await db.logAudit(1, 'staff', type.toUpperCase(), 'transactions', account.account_id, `Staff recorded ${type} of UGX ${Number(amount).toLocaleString()} for member ${memberNumber}`);

    await conn.commit();

    // Send notification (async)
    const [m] = await conn.execute("SELECT full_name, email FROM members WHERE member_number = ?", [memberNumber]);
    if (m[0] && m[0].email) notifyMember.transaction(m[0].email, m[0].full_name, type, amount, newBalance);

    res.json({ success: true, newBalance, message: 'Transaction recorded successfully' });
  } catch (error) {
    await conn.rollback();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

// Transaction history
router.get('/:accountNumber/history', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT t.transaction_date, t.transaction_type, t.amount, t.balance_after, t.description
      FROM transactions t 
      JOIN accounts a ON t.account_id = a.account_id 
      WHERE a.account_number = ? 
      ORDER BY t.transaction_date DESC 
      LIMIT 50
    `, [req.params.accountNumber]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit a transaction request (Member) - Cash goes to pending, not instant
router.post('/request', uploadReceipt.single('receipt'), async (req, res) => {
  const { memberNumber, type, amount, paymentMethod, phoneNumber, provider, description } = req.body;
  const receiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : null;
  try {
    const [accounts] = await db.execute(`
      SELECT a.account_id 
      FROM accounts a 
      JOIN members m ON a.member_id = m.member_id 
      WHERE m.member_number = ?
    `, [memberNumber]);

    if (accounts.length === 0) return res.status(404).json({ success: false, message: 'Account not found' });
    const accountId = accounts[0].account_id;

    await db.execute(`
      INSERT INTO transaction_requests (account_id, request_type, amount, payment_method, phone_number, sim_provider, description, receipt_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [accountId, type, amount, paymentMethod || 'cash', phoneNumber || null, provider || null, description, receiptUrl]);

    await db.logAudit(null, memberNumber, 'SAVINGS_REQUEST_SUBMIT', 'transaction_requests', accountId, `Member ${memberNumber} submitted ${type} request of UGX ${Number(amount).toLocaleString()} via ${paymentMethod || 'cash'}`);

    res.json({ success: true, message: 'Request submitted and is pending admin approval.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all pending transaction requests (Admin)
router.get('/requests/pending', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.request_id, r.request_type, r.amount, r.payment_method, r.phone_number, r.sim_provider, 
             r.description, r.requested_at, r.receipt_url,
             m.full_name, m.member_number, a.account_number
      FROM transaction_requests r
      JOIN accounts a ON r.account_id = a.account_id
      JOIN members m ON a.member_id = m.member_id
      WHERE r.status = 'pending'
      ORDER BY r.requested_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Action (Approve/Reject) a request (Admin)
router.post('/requests/:id/action', async (req, res) => {
  const { id } = req.params;
  const { action, userId } = req.body; // action: 'approve' or 'reject'
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [requests] = await conn.execute(`
      SELECT r.*, a.current_balance, m.full_name, m.email, m.member_number
      FROM transaction_requests r
      JOIN accounts a ON r.account_id = a.account_id
      JOIN members m ON a.member_id = m.member_id
      WHERE r.request_id = ? AND r.status = 'pending'
    `, [id]);

    if (requests.length === 0) throw new Error('Pending request not found');
    const request = requests[0];

    const actionedStatus = action === 'approve' ? 'approved' : 'rejected';

    if (action === 'approve') {
      const type = request.request_type;
      const amount = parseFloat(request.amount);
      const currentBalance = parseFloat(request.current_balance);

      if (type === 'withdrawal' && amount > currentBalance) {
        throw new Error('Insufficient balance to approve withdrawal');
      }

      const newBalance = type === 'deposit' 
        ? currentBalance + amount 
        : currentBalance - amount;

      // Construct payment details description
      let finalDesc = request.description || '';
      if (request.payment_method === 'mobile_money') {
        finalDesc = `${finalDesc ? finalDesc + ' ' : ''}[Mobile Money - ${request.sim_provider}: ${request.phone_number}]`;
      } else {
        finalDesc = `${finalDesc ? finalDesc + ' ' : ''}[Cash]`;
      }

      // Record transaction
      await conn.execute(
        `INSERT INTO transactions (account_id, transaction_type, amount, balance_after, description, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [request.account_id, type, amount, newBalance, finalDesc, userId || 1]
      );

      // Update balance
      await conn.execute("UPDATE accounts SET current_balance = ? WHERE account_id = ?", [newBalance, request.account_id]);

      // Snapshot for dividends
      await conn.execute(
        `INSERT INTO monthly_savings_snapshot (member_id, snap_year, snap_month, balance)
         SELECT member_id, YEAR(NOW()), MONTH(NOW()), ? FROM accounts WHERE account_id = ?
         ON DUPLICATE KEY UPDATE balance = ?`,
        [newBalance, request.account_id, newBalance]
      );

      // Send email notification (async)
      if (request.email) {
        notifyMember.transaction(request.email, request.full_name, type, amount, newBalance);
      }
    }

    // Update request status
    await conn.execute(`
      UPDATE transaction_requests 
      SET status = ?, actioned_by = ?, actioned_at = NOW() 
      WHERE request_id = ?
    `, [actionedStatus, userId || 1, id]);

    // Fetch details of staff performing the action
    const [staff] = await conn.execute("SELECT username, role FROM users WHERE user_id = ?", [userId || 1]);
    const staffName = staff[0] ? staff[0].username : 'staff';
    const staffRole = staff[0] ? staff[0].role : 'staff';

    // Log the approval action to audit log
    await db.logAudit(
      userId || 1, 
      staffName, 
      `SAVINGS_REQUEST_${action.toUpperCase()}`, 
      'transaction_requests', 
      id, 
      `${staffRole.toUpperCase()} ${staffName} ${action}d ${request.request_type} request of UGX ${Number(request.amount).toLocaleString()} for member ${request.member_number}`
    );

    await conn.commit();
    res.json({ success: true, message: `Request successfully ${actionedStatus}!` });
  } catch (error) {
    await conn.rollback();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

// Get requests made by a member
router.get('/requests/member/:username', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT r.request_id, r.request_type, r.amount, r.payment_method, r.phone_number, r.sim_provider, r.description, r.status, r.requested_at, r.actioned_at
      FROM transaction_requests r
      JOIN accounts a ON r.account_id = a.account_id
      JOIN members m ON a.member_id = m.member_id
      JOIN users u ON m.user_id = u.user_id
      WHERE u.username = ?
      ORDER BY r.requested_at DESC
    `, [req.params.username]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
