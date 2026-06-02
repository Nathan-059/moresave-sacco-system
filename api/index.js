// Vercel Serverless Entry Point
// This wraps the Express app so it works as a Vercel serverless function

const path = require('path');

// Point dotenv at the server .env file
require('dotenv').config({ path: path.join(__dirname, '../moresave-react/server/.env') });

// Flag so routes know they're running on Vercel
process.env.VERCEL = '1';

const express = require('express');
const cors = require('cors');

// Override db.js path resolution by setting working directory context
process.chdir(path.join(__dirname, '../moresave-react/server'));

const db = require('../moresave-react/server/db');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Moresave SACCO API is running on Vercel' });
});

// Auth Route
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT u.user_id, u.username, u.role, u.is_active,
       m.member_number, m.full_name, m.membership_status
       FROM users u
       LEFT JOIN members m ON m.user_id = u.user_id
       WHERE u.username = ? AND u.password_hash = ?`,
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Incorrect username or password' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    await db.execute('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);
    await db.logAudit(user.user_id, user.username, 'LOGIN', 'users', user.user_id, 'User logged in from SACCO application');

    res.json({
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role,
        memberNumber: user.member_number,
        fullName: user.full_name,
        status: user.membership_status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Register all routes
app.use('/api/members',  require('../moresave-react/server/routes/members'));
app.use('/api/loans',    require('../moresave-react/server/routes/loans'));
app.use('/api/savings',  require('../moresave-react/server/routes/savings'));
app.use('/api/reports',  require('../moresave-react/server/routes/reports'));
app.use('/api/portal',   require('../moresave-react/server/routes/portal'));
app.use('/api/pesapal',  require('../moresave-react/server/routes/pesapal'));
app.use('/api/audit',    require('../moresave-react/server/routes/audit'));
app.use('/api/settings', require('../moresave-react/server/routes/settings'));
app.use('/api/support',  require('../moresave-react/server/routes/support'));

// Export as Vercel serverless handler
module.exports = app;
