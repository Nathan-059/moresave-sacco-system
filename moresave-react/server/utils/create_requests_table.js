const mysql = require('mysql2/promise');
require('dotenv').config();

async function createRequestsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'SACCO'
  });

  console.log('Connected to database.');

  const query = `
    CREATE TABLE IF NOT EXISTS transaction_requests (
      request_id        INT AUTO_INCREMENT PRIMARY KEY,
      account_id        INT NOT NULL,
      request_type      ENUM('deposit', 'withdrawal') NOT NULL,
      amount            DECIMAL(15,2) NOT NULL,
      payment_method    VARCHAR(50) NOT NULL DEFAULT 'cash',
      phone_number      VARCHAR(20) NULL,
      sim_provider      VARCHAR(20) NULL,
      description       VARCHAR(255) NULL,
      status            ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      requested_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actioned_by       INT NULL,
      actioned_at       DATETIME NULL,
      CONSTRAINT fk_req_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
      CONSTRAINT fk_req_actioner FOREIGN KEY (actioned_by) REFERENCES users(user_id) ON DELETE SET NULL
    )
  `;

  try {
    console.log('Executing: Creating transaction_requests table...');
    await connection.execute(query);
    console.log('transaction_requests table created successfully or already exists!');
  } catch (err) {
    console.error('Error creating table:', err.message);
  } finally {
    await connection.end();
  }
}

createRequestsTable();
