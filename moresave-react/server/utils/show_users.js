const mysql = require('mysql2/promise');
require('dotenv').config();

async function showUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'SACCO'
  });

  try {
    const [rows] = await connection.execute(`
      SELECT u.username, u.role, m.full_name, m.member_number
      FROM users u
      LEFT JOIN members m ON u.user_id = m.user_id
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

showUsers();
