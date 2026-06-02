const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SANDBOX_URL = 'https://cybqa.pesapal.com/pesapalv3';
const PRODUCTION_URL = 'https://pay.pesapal.com/v3';

async function diagnose() {
  console.log('--- PESAPAL ENVIRONMENT TEST ---');
  console.log('Consumer Key:', process.env.PESAPAL_CONSUMER_KEY);
  console.log('Consumer Secret length:', process.env.PESAPAL_CONSUMER_SECRET ? process.env.PESAPAL_CONSUMER_SECRET.length : 0);

  // Test 1: Sandbox
  console.log('\n--- TESTING SANDBOX ---');
  try {
    const res = await axios.post(`${SANDBOX_URL}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('✅ SANDBOX SUCCESS!');
    console.log('Response:', res.data);
  } catch (err) {
    console.log('❌ SANDBOX FAILED!');
    console.log('Status:', err.response?.status);
    console.log('Data:', err.response?.data);
  }

  // Test 2: Production
  console.log('\n--- TESTING PRODUCTION ---');
  try {
    const res = await axios.post(`${PRODUCTION_URL}/api/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('✅ PRODUCTION SUCCESS!');
    console.log('Response:', res.data);
  } catch (err) {
    console.log('❌ PRODUCTION FAILED!');
    console.log('Status:', err.response?.status);
    console.log('Data:', err.response?.data);
  }
}

diagnose();
