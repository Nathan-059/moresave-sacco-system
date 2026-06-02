const express = require('express');
const router = express.Router();
const db = require('../db');

// Get pending loans
router.get('/pending', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT l.loan_number, m.full_name, m.member_number, l.loan_amount, l.repayment_period, 
             l.monthly_payment, l.purpose, l.application_date 
      FROM loans l 
      JOIN members m ON l.member_id = m.member_id 
      WHERE l.status = 'pending' 
      ORDER BY l.application_date ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get full loan details for review (savings history, next of kin, collateral, loan history)
router.get('/:loanNumber/review', async (req, res) => {
  const { loanNumber } = req.params;
  try {
    // Loan + member info
    const [loanRows] = await db.execute(`
      SELECT l.*, m.full_name, m.member_number, m.phone_number, m.email,
             m.address, m.occupation, m.joining_date, m.membership_status,
             m.national_id, m.gender,
             a.current_balance AS savings_balance, a.account_number
      FROM loans l
      JOIN members m ON l.member_id = m.member_id
      LEFT JOIN accounts a ON m.member_id = a.member_id
      WHERE l.loan_number = ?
    `, [loanNumber]);

    if (loanRows.length === 0) return res.status(404).json({ message: 'Loan not found' });
    const loan = loanRows[0];

    // Savings transaction history (last 12)
    const [savingsHistory] = await db.execute(`
      SELECT t.transaction_type, t.amount, t.balance_after, t.description, t.transaction_date
      FROM transactions t
      JOIN accounts a ON t.account_id = a.account_id
      WHERE a.member_id = ?
      ORDER BY t.transaction_date DESC
      LIMIT 12
    `, [loan.member_id]);

    // Monthly savings snapshots (last 6 months)
    const [savingsSnapshots] = await db.execute(`
      SELECT snap_year, snap_month, balance
      FROM monthly_savings_snapshot
      WHERE member_id = ?
      ORDER BY snap_year DESC, snap_month DESC
      LIMIT 6
    `, [loan.member_id]);

    // Next of kin
    const [nextOfKin] = await db.execute(`
      SELECT full_name, relationship, phone_number, national_id, address
      FROM next_of_kin
      WHERE member_id = ?
    `, [loan.member_id]);

    // Collateral for this loan
    const [collateral] = await db.execute(`
      SELECT collateral_type, description, estimated_value, document_ref, status
      FROM collateral
      WHERE loan_id = ?
    `, [loan.loan_id]);

    // Past loan history
    const [loanHistory] = await db.execute(`
      SELECT loan_number, loan_amount, repayment_period, status, application_date, approval_date
      FROM loans
      WHERE member_id = ? AND loan_number != ?
      ORDER BY application_date DESC
      LIMIT 5
    `, [loan.member_id, loanNumber]);

    res.json({ loan, savingsHistory, savingsSnapshots, nextOfKin, collateral, loanHistory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get approved/disbursed loans
router.get('/approved', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT l.loan_number, m.full_name, l.loan_amount, l.monthly_payment, 
             l.maturity_date, l.status 
      FROM loans l 
      JOIN members m ON l.member_id = m.member_id 
      WHERE l.status IN ('approved','disbursed') 
      ORDER BY l.approval_date DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Loan eligibility check
router.get('/eligibility/:memberNumber', async (req, res) => {
  const { memberNumber } = req.params;
  try {
    // Member info + savings balance + joining date
    const [memberRows] = await db.execute(`
      SELECT m.member_id, m.full_name, m.joining_date, m.membership_status,
             COALESCE(a.current_balance, 0) AS savings_balance
      FROM members m
      LEFT JOIN accounts a ON m.member_id = a.member_id
      WHERE m.member_number = ?
    `, [memberNumber]);

    if (memberRows.length === 0) return res.status(404).json({ eligible: false, message: 'Member not found' });
    const member = memberRows[0];

    // How many months has the member been saving (months since joining)
    const [snapRows] = await db.execute(`
      SELECT COUNT(DISTINCT CONCAT(snap_year, '-', snap_month)) AS saving_months
      FROM monthly_savings_snapshot
      WHERE member_id = ? AND balance > 0
    `, [member.member_id]);
    const savingMonths = snapRows[0].saving_months || 0;

    // Years as member
    const joiningDate = new Date(member.joining_date);
    const now = new Date();
    const membershipMonths = (now.getFullYear() - joiningDate.getFullYear()) * 12 + (now.getMonth() - joiningDate.getMonth());
    const membershipYears = membershipMonths / 12;

    // Active loan check
    const [activeLoan] = await db.execute(
      `SELECT COUNT(*) as total FROM loans WHERE member_id = ? AND status IN ('pending','approved','disbursed')`,
      [member.member_id]
    );

    const checks = {
      isActive:         { pass: member.membership_status === 'active',  label: 'Active membership',                  detail: `Status: ${member.membership_status}` },
      minBalance:       { pass: member.savings_balance >= 200000,        label: 'Minimum savings of UGX 200,000',     detail: `Current balance: UGX ${Number(member.savings_balance).toLocaleString()}` },
      savingDuration:   { pass: savingMonths >= 2,                       label: 'Saved for at least 2 months',        detail: `Months with savings: ${savingMonths}` },
      membershipAge:    { pass: membershipYears >= 1,                    label: 'Member for at least 1 year',         detail: `Membership duration: ${Math.floor(membershipMonths)} months` },
      noActiveLoan:     { pass: activeLoan[0].total === 0,               label: 'No existing active loan',            detail: activeLoan[0].total > 0 ? 'Has an active/pending loan' : 'No active loans' },
    };

    const eligible = Object.values(checks).every(c => c.pass);

    res.json({
      eligible,
      memberNumber,
      fullName: member.full_name,
      savingsBalance: member.savings_balance,
      savingMonths,
      membershipMonths,
      checks
    });
  } catch (error) {
    res.status(500).json({ eligible: false, message: error.message });
  }
});

router.post('/apply', async (req, res) => {
  const { memberNumber, loanAmount, repaymentPeriod, purpose, collateralType, collateralDescription, collateralValue, collateralDocRef } = req.body;
  const INTEREST_RATE = 0.02;

  try {
    // Get member + savings info
    const [members] = await db.execute(`
      SELECT m.member_id, m.joining_date, m.membership_status,
             COALESCE(a.current_balance, 0) AS savings_balance
      FROM members m
      LEFT JOIN accounts a ON m.member_id = a.member_id
      WHERE m.member_number = ?
    `, [memberNumber]);
    if (members.length === 0) return res.status(404).json({ message: 'Member not found' });
    const member = members[0];

    // Eligibility checks
    if (member.membership_status !== 'active')
      return res.status(400).json({ success: false, message: 'Member account is not active.' });

    if (member.savings_balance < 200000)
      return res.status(400).json({ success: false, message: `Insufficient savings. Minimum UGX 200,000 required. Current balance: UGX ${Number(member.savings_balance).toLocaleString()}.` });

    const joiningDate = new Date(member.joining_date);
    const now = new Date();
    const membershipMonths = (now.getFullYear() - joiningDate.getFullYear()) * 12 + (now.getMonth() - joiningDate.getMonth());
    if (membershipMonths < 12)
      return res.status(400).json({ success: false, message: `Must be a member for at least 1 year. Current duration: ${membershipMonths} month(s).` });

    const [snapRows] = await db.execute(
      `SELECT COUNT(DISTINCT CONCAT(snap_year, '-', snap_month)) AS saving_months FROM monthly_savings_snapshot WHERE member_id = ? AND balance > 0`,
      [member.member_id]
    );
    const savingMonths = snapRows[0].saving_months || 0;
    if (savingMonths < 2)
      return res.status(400).json({ success: false, message: `Must have saved for at least 2 months. Recorded saving months: ${savingMonths}.` });

    if (!collateralType || !collateralDescription || !collateralValue)
      return res.status(400).json({ success: false, message: 'Collateral security is required. Please provide collateral type, description, and estimated value.' });

    // Check for active loan
    const [active] = await db.execute(
      "SELECT COUNT(*) as total FROM loans WHERE member_id = ? AND status IN ('pending','approved','disbursed')",
      [member.member_id]
    );
    if (active[0].total > 0) return res.status(400).json({ message: 'Member already has an active loan' });

    // Calculations
    const totalInterest = loanAmount * INTEREST_RATE * repaymentPeriod;
    const totalPayable = Number(loanAmount) + totalInterest;
    const monthlyPayment = totalPayable / repaymentPeriod;

    // Generate loan number
    const [countRows] = await db.execute("SELECT COUNT(*) as total FROM loans");
    const loanNumber = "LN" + String(countRows[0].total + 1).padStart(5, '0');

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `INSERT INTO loans (loan_number, member_id, loan_amount, interest_rate, repayment_period, monthly_payment, total_payable, purpose, application_date, outstanding_balance, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, 'pending')`,
        [loanNumber, member.member_id, loanAmount, INTEREST_RATE * 100, repaymentPeriod, monthlyPayment, totalPayable, purpose, totalPayable]
      );

      const [loanRows] = await conn.execute("SELECT loan_id FROM loans WHERE loan_number = ?", [loanNumber]);
      const loanId = loanRows[0].loan_id;

      await conn.execute(
        `INSERT INTO collateral (loan_id, member_id, collateral_type, description, estimated_value, document_ref, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [loanId, member.member_id, collateralType, collateralDescription, collateralValue, collateralDocRef || null]
      );

      await db.logAudit(null, memberNumber, 'LOAN_APPLICATION_SUBMIT', 'loans', loanNumber, `Member ${memberNumber} applied for a loan of UGX ${Number(loanAmount).toLocaleString()} for ${repaymentPeriod} months. Purpose: ${purpose}. Collateral: ${collateralType}`);

      await conn.commit();
      res.json({ success: true, loanNumber, message: 'Loan application submitted' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve loan
router.post('/:loanNumber/approve', async (req, res) => {
  const { loanNumber } = req.params;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [loans] = await conn.execute(
      "SELECT * FROM loans WHERE loan_number = ? AND status = 'pending'",
      [loanNumber]
    );
    if (loans.length === 0) throw new Error('Loan not found or already processed');

    const loan = loans[0];
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + loan.repayment_period);

    await conn.execute(
      `UPDATE loans SET status = 'disbursed', approval_date = CURDATE(), disbursement_date = CURDATE(), maturity_date = ? 
       WHERE loan_number = ?`,
      [maturityDate.toISOString().split('T')[0], loanNumber]
    );

    // Generate repayment schedule
    const principalPerMonth = loan.loan_amount / loan.repayment_period;
    const interestPerMonth = loan.loan_amount * (loan.interest_rate / 100);
    let remainingBalance = loan.total_payable;

    for (let i = 1; i <= loan.repayment_period; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      remainingBalance -= loan.monthly_payment;
      if (remainingBalance < 0) remainingBalance = 0;

      await conn.execute(
        `INSERT INTO loan_repayments (loan_id, due_date, amount_due, principal_portion, interest_portion, remaining_balance, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [loan.loan_id, dueDate.toISOString().split('T')[0], loan.monthly_payment, principalPerMonth, interestPerMonth, remainingBalance]
      );
    }

    // Log the staff's loan approval
    await db.logAudit(null, 'staff', 'LOAN_APPROVE_DISBURSE', 'loans', loanNumber, `Staff approved and disbursed loan ${loanNumber} of UGX ${Number(loan.loan_amount).toLocaleString()} for member ID ${loan.member_id}`);

    await conn.commit();
    res.json({ success: true, message: 'Loan approved and schedule generated' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

// Reject loan
router.post('/:loanNumber/reject', async (req, res) => {
  const { loanNumber } = req.params;
  try {
    const [result] = await db.execute(
      "UPDATE loans SET status = 'rejected' WHERE loan_number = ? AND status = 'pending'",
      [loanNumber]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found or already processed' });
    }

    // Log the staff's loan rejection
    await db.logAudit(null, 'staff', 'LOAN_REJECT', 'loans', loanNumber, `Staff rejected loan application ${loanNumber}`);

    res.json({ success: true, message: 'Loan application rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
