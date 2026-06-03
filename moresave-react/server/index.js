const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Moresave SACCO API is running' });
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

    // Update last login
    await db.execute('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    // Log this action to audit log
    await db.logAudit(user.user_id, user.username, 'LOGIN', 'users', user.user_id, `User logged in from SACCO application`);

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
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
});

// Register Routes
app.use('/api/members', require('./routes/members'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/savings', require('./routes/savings'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/portal', require('./routes/portal'));
app.use('/api/pesapal', require('./routes/pesapal'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/support', require('./routes/support'));
app.use('/api/debug', require('./routes/debug'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
