const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterRequestsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'SACCO'
  });

  console.log('Connected to database.');

  try {
    console.log('Altering transaction_requests table...');
    // We run individual alter statements so that IF NOT EXISTS is simulated safely in older MySQL versions
    try {
      await connection.execute(`ALTER TABLE transaction_requests ADD COLUMN tracking_id VARCHAR(100) NULL`);
      console.log('Added tracking_id column.');
    } catch (e) {
      console.log('tracking_id column might already exist:', e.message);
    }

    try {
      await connection.execute(`ALTER TABLE transaction_requests ADD COLUMN merchant_reference VARCHAR(100) NULL`);
      console.log('Added merchant_reference column.');
    } catch (e) {
      console.log('merchant_reference column might already exist:', e.message);
    }

    console.log('Table alteration finished.');
  } catch (err) {
    console.error('Error altering table:', err.message);
  } finally {
    await connection.end();
  }
}

alterRequestsTable();
