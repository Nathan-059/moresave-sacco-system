// ============================================================
// MORESAVE SACCO - Backend Entry Point
// This is the main Node.js/Express server that handles all
// API requests from the React frontend.
// Run with: node index.js (from the server/ directory)
// ============================================================

// Import the Express web framework for building the API
const express = require('express');

// Import CORS middleware to allow the React frontend (port 5173)
// to communicate with this backend (port 5000)
const cors = require('cors');

// Load environment variables from .env file (DB credentials, PesaPal keys etc.)
require('dotenv').config();

// Import the database connection pool (configured in db.js)
const db = require('./db');

// Create the Express application instance
const app = express();

// Use PORT from environment variable or fall back to 5000 for local development
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes — allows the frontend to call our API
app.use(cors());

// Parse incoming JSON request bodies (needed for POST/PUT requests)
app.use(express.json());

// Serve uploaded files (member photos, receipts, documents) as static files
// e.g. /uploads/members/photo.jpg will be accessible in the browser
app.use('/uploads', express.static('uploads'));

// ── Health Check Route ──────────────────────────────────────
// A simple GET endpoint to verify the server is running
// Used by deployment platforms to check if the service is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Moresave SACCO API is running' });
});

// ── Authentication Route ────────────────────────────────────
// POST /api/auth/login
// Accepts username + password, returns user info + role if valid
app.post('/api/auth/login', async (req, res) => {
  // Destructure username and password from the request body
  const { username, password } = req.body;

  // Validate that both fields are provided
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    // Query the database — join users with members to get full details
    // Password is stored as plain text hash (should be bcrypt in production)
    const [rows] = await db.execute(
      `SELECT u.user_id, u.username, u.role, u.is_active, 
       m.member_number, m.full_name, m.membership_status 
       FROM users u 
       LEFT JOIN members m ON m.user_id = u.user_id 
       WHERE u.username = ? AND u.password_hash = ?`,
      [username, password]
    );

    // If no matching user found, return 401 Unauthorized
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Incorrect username or password' });
    }

    const user = rows[0];

    // Check if the account is active (admins can deactivate accounts)
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Record the login timestamp in the database
    await db.execute('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

    // Write a LOGIN entry to the audit log for security tracking
    await db.logAudit(user.user_id, user.username, 'LOGIN', 'users', user.user_id, 'User logged in from SACCO application');

    // Return success with the user's details
    // The frontend stores this in localStorage to track the session
    res.json({
      success: true,
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role,              // 'admin', 'manager', 'cashier', 'loan_officer', or 'member'
        memberNumber: user.member_number,
        fullName: user.full_name,
        status: user.membership_status // 'pending', 'active', 'inactive', etc.
      }
    });
  } catch (error) {
    // Log the error server-side and return a generic error to the client
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Database error: ' + error.message });
  }
});

// ── Route Registration ──────────────────────────────────────
// Each module handles a specific area of the system
// The path prefix (e.g. /api/members) is prepended to all routes in the file

app.use('/api/members',  require('./routes/members'));   // Member registration, approval, management
app.use('/api/loans',    require('./routes/loans'));     // Loan applications, approvals, repayments
app.use('/api/savings',  require('./routes/savings'));   // Deposits, withdrawals, pending requests
app.use('/api/reports',  require('./routes/reports'));   // Financial reports and summaries
app.use('/api/portal',   require('./routes/portal'));    // Member self-service portal (profile, dividends)
app.use('/api/pesapal',  require('./routes/pesapal'));   // PesaPal mobile money payment integration
app.use('/api/audit',    require('./routes/audit'));     // Audit log — tracks all system actions
app.use('/api/settings', require('./routes/settings')); // SACCO system settings (interest rates, fees)
app.use('/api/support',  require('./routes/support'));   // Member support/helpdesk chat tickets

// ── Start the Server ────────────────────────────────────────
// Listen on the configured port and log a confirmation message
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
