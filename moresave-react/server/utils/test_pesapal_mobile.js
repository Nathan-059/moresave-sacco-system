const axios = require('axios');
require('dotenv').config();

const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';

// Test PesaPal authentication and mobile money setup
async function testPesaPalMobileMoney() {
  try {
    console.log('🔐 Testing PesaPal Authentication...');
    
    // 1. Test authentication
    const authRes = await axios.post(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (authRes.data.token) {
      console.log('✅ PesaPal Authentication Successful');
      console.log('Token:', authRes.data.token.substring(0, 20) + '...');
      
      const token = authRes.data.token;
      
      // 2. Test IPN setup
      console.log('\n📡 Testing IPN Setup...');
      const ipnRes = await axios.get(`${PESAPAL_BASE_URL}/api/URLSetup/GetIpnList`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('✅ IPN List Retrieved:', ipnRes.data.length, 'IPNs found');
      
      // 3. Test mobile money order creation
      console.log('\n📱 Testing Mobile Money Order Creation...');
      const testOrder = {
        id: 'TEST-MM-' + Date.now(),
        currency: 'UGX',
        amount: 1000, // Test with 1000 UGX
        description: 'Test Mobile Money Payment - Moresave SACCO',
        callback_url: 'https://moresave-sacco.herokuapp.com/api/pesapal/popup-callback',
        notification_id: ipnRes.data[0]?.ipn_id || 'test-ipn',
        billing_address: {
          email_address: 'test@moresavesacco.com',
          phone_number: '0772123456',
          first_name: 'Test',
          last_name: 'Member',
          country_code: 'UG',
          city: 'Kampala',
          state: 'Central',
          postal_code: '00000',
          line_1: 'Moresave SACCO'
        },
        payment_method: 'MOBILEMONEY',
        payment_account: '0772123456',
        payment_account_reference: 'MTN_UGANDA'
      };

      const orderRes = await axios.post(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, testOrder, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('✅ Mobile Money Order Created Successfully');
      console.log('Order Tracking ID:', orderRes.data.order_tracking_id);
      console.log('Redirect URL:', orderRes.data.redirect_url);
      
      // 4. Test order status check
      console.log('\n🔍 Testing Order Status Check...');
      const statusRes = await axios.get(`${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderRes.data.order_tracking_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('✅ Order Status Retrieved:', statusRes.data.payment_status_description);
      
      console.log('\n🎉 All PesaPal Mobile Money Tests Passed!');
      console.log('\n📋 Test Summary:');
      console.log('- Authentication: ✅ Working');
      console.log('- IPN Setup: ✅ Working');
      console.log('- Mobile Money Orders: ✅ Working');
      console.log('- Status Checking: ✅ Working');
      console.log('\n💡 The system is ready for mobile money payments!');
      
    } else {
      console.log('❌ PesaPal Authentication Failed');
      console.log('Response:', authRes.data);
    }

  } catch (error) {
    console.error('❌ PesaPal Test Failed:');
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔑 Authentication Issue:');
      console.log('- Check PESAPAL_CONSUMER_KEY in .env file');
      console.log('- Check PESAPAL_CONSUMER_SECRET in .env file');
      console.log('- Ensure keys are for production environment');
    } else if (error.response?.status === 400) {
      console.log('\n📝 Request Issue:');
      console.log('- Check request format and required fields');
      console.log('- Verify phone number format (Ugandan numbers)');
    }
  }
}

// Run the test
if (require.main === module) {
  console.log('🚀 Starting PesaPal Mobile Money Integration Test...\n');
  testPesaPalMobileMoney();
}

module.exports = { testPesaPalMobileMoney };