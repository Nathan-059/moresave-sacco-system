const express = require('express');
const router = express.Router();
const db = require('../db');

// Get profile info by username
router.get('/profile/:username', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT m.full_name, m.member_number, a.account_number, a.current_balance,
             m.phone_number, m.email, m.address, m.occupation, m.date_of_birth,
             m.gender, m.joining_date, m.membership_status, m.national_id,
             u.is_active
      FROM members m
      JOIN accounts a ON m.member_id = a.member_id
      JOIN users u ON m.user_id = u.user_id
      WHERE u.username = ?
    `, [req.params.username]);

    if (rows.length === 0) return res.status(404).json({ message: 'Profile not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get member loans
router.get('/loans/:username', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT l.loan_number, l.loan_amount, l.monthly_payment, l.outstanding_balance,
             l.total_payable, l.interest_rate, l.repayment_period, l.purpose,
             l.status, l.application_date, l.approval_date, l.maturity_date
      FROM loans l
      JOIN members m ON l.member_id = m.member_id
      JOIN users u ON m.user_id = u.user_id
      WHERE u.username = ?
      ORDER BY l.application_date DESC
    `, [req.params.username]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get next of kin for logged-in member
router.get('/next-of-kin/:username', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT nk.full_name, nk.relationship, nk.phone_number, nk.national_id, nk.address
      FROM next_of_kin nk
      JOIN members m ON nk.member_id = m.member_id
      JOIN users u ON m.user_id = u.user_id
      WHERE u.username = ?
    `, [req.params.username]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent transactions for member dashboard
router.get('/recent-transactions/:username', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT t.transaction_type, t.amount, t.balance_after, t.description, t.transaction_date
      FROM transactions t
      JOIN accounts a ON t.account_id = a.account_id
      JOIN members m ON a.member_id = m.member_id
      JOIN users u ON m.user_id = u.user_id
      WHERE u.username = ?
      ORDER BY t.transaction_date DESC
      LIMIT 5
    `, [req.params.username]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile
router.put('/profile/:username', async (req, res) => {
  const { phone, email, address, occupation } = req.body;
  try {
    await db.execute(`
      UPDATE members m 
      JOIN users u ON m.user_id = u.user_id 
      SET m.phone_number = ?, m.email = ?, m.address = ?, m.occupation = ? 
      WHERE u.username = ?
    `, [phone, email, address, occupation, req.params.username]);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change password
router.put('/change-password/:username', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [users] = await db.execute('SELECT user_id, password_hash FROM users WHERE username = ?', [req.params.username]);
    
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    if (users[0].password_hash !== currentPassword) return res.status(401).json({ success: false, message: 'Incorrect current password' });

    await db.execute('UPDATE users SET password_hash = ? WHERE username = ?', [newPassword, req.params.username]);
    
    await db.logAudit(users[0].user_id, req.params.username, 'PASSWORD_CHANGE', 'users', users[0].user_id, 'User changed their password via member portal');

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
