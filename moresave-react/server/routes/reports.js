const express = require('express');
const router = express.Router();
const db = require('../db');

// Get summary for dashboard
router.get('/summary', async (req, res) => {
  try {
    const [members] = await db.execute("SELECT COUNT(*) as total FROM members WHERE membership_status = 'active'");
    const [savings] = await db.execute("SELECT COALESCE(SUM(current_balance),0) as total FROM accounts");
    const [loans] = await db.execute("SELECT COALESCE(SUM(outstanding_balance),0) as total FROM loans WHERE status IN ('approved','disbursed')");
    const [pending] = await db.execute("SELECT COUNT(*) as total FROM loans WHERE status = 'pending'");

    res.json({
      totalMembers: members[0].total,
      totalSavings: savings[0].total,
      activeLoans: loans[0].total,
      pendingLoans: pending[0].total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Overdue loans report
router.get('/overdue', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT l.loan_number, m.full_name, lr.due_date, lr.amount_due, 
             ROUND(lr.amount_due * 0.02, 0) AS penalty 
      FROM loan_repayments lr 
      JOIN loans l ON lr.loan_id = l.loan_id 
      JOIN members m ON l.member_id = m.member_id 
      WHERE lr.due_date < CURDATE() AND lr.payment_status = 'pending' 
      ORDER BY lr.due_date ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Savings report
router.get('/savings', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT m.member_number, m.full_name, a.account_number, a.current_balance, a.status
      FROM accounts a
      JOIN members m ON a.member_id = m.member_id
      ORDER BY a.current_balance DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
