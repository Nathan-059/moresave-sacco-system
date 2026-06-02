const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'SACCO',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.logAudit = async function(userId, username, action, tableName, recordId, description, ipAddress = '127.0.0.1') {
  try {
    await pool.execute(`
      INSERT INTO audit_log (user_id, username, action, table_name, record_id, description, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, username, action, tableName, recordId, description, ipAddress]);
  } catch (err) {
    console.error('Audit Log Error:', err.message);
  }
};

// Automatic database schema migration on startup
(async () => {
  const queries = [
    "ALTER TABLE members ADD COLUMN next_of_kin_name VARCHAR(255)",
    "ALTER TABLE members ADD COLUMN next_of_kin_relationship VARCHAR(100)",
    "ALTER TABLE members ADD COLUMN next_of_kin_phone VARCHAR(20)",
    "ALTER TABLE members ADD COLUMN passport_photo_url VARCHAR(255)",
    "ALTER TABLE members ADD COLUMN id_scan_url VARCHAR(255)",
    "ALTER TABLE members ADD COLUMN residence_proof_url VARCHAR(255)",
    "ALTER TABLE members ADD COLUMN lc_letter_url VARCHAR(255)",
    "ALTER TABLE members ADD COLUMN referee_member_number VARCHAR(50)",
    "ALTER TABLE members ADD COLUMN registration_fee_receipt_number VARCHAR(100)",
    "ALTER TABLE members MODIFY COLUMN membership_status ENUM('pending', 'active', 'inactive', 'suspended', 'rejected') DEFAULT 'pending'",
    `CREATE TABLE IF NOT EXISTS transaction_requests (
      request_id          INT AUTO_INCREMENT PRIMARY KEY,
      account_id          INT NOT NULL,
      request_type        VARCHAR(20) NOT NULL,
      amount              DECIMAL(15,2) NOT NULL,
      payment_method      VARCHAR(50) NOT NULL,
      phone_number        VARCHAR(20) NULL,
      sim_provider        VARCHAR(50) NULL,
      description         VARCHAR(255) NULL,
      status              VARCHAR(20) NOT NULL DEFAULT 'pending',
      tracking_id         VARCHAR(100) NULL,
      merchant_reference  VARCHAR(100) NULL,
      created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actioned_at         DATETIME NULL,
      actioned_by         INT NULL,
      CONSTRAINT fk_request_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
    )`
  ];
  for (const query of queries) {
    try {
      await pool.execute(query);
    } catch (err) {
      if (err.errno !== 1060 && err.code !== 'ER_DUP_FIELDNAME' && !err.message.includes('Multiple primary key')) {
        console.error('Auto Migration Query Error:', err.message);
      }
    }
  }
})();

module.exports = pool;
