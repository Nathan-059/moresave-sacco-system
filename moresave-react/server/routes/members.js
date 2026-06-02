const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const notifyMember = require('../utils/emailService');

// Configure multer for file uploads
// On Vercel, use /tmp (only writable dir); locally use uploads/members/
const uploadDir = process.env.VERCEL ? '/tmp/members/' : 'uploads/members/';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get all members
router.get('/', async (req, res) => {
  const { query, status } = req.query;
  try {
    let sql = `
      SELECT m.member_number, m.full_name, m.phone_number, m.email, 
             m.gender, m.national_id, m.address, m.occupation, 
             m.date_of_birth, m.joining_date, m.membership_status,
             COALESCE(a.current_balance, 0) AS balance
      FROM members m
      LEFT JOIN accounts a ON m.member_id = a.member_id
    `;
    
    const params = [];
    const conditions = [];

    if (query) {
      conditions.push(`(m.full_name LIKE ? OR m.member_number LIKE ? OR m.phone_number LIKE ? OR m.national_id LIKE ?)`);
      const q = `%${query}%`;
      params.push(q, q, q, q);
    }

    if (status) {
      conditions.push(`m.membership_status = ?`);
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    sql += ` ORDER BY m.member_number`;

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single member details
router.get('/:memberNumber', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT m.*, a.account_number, a.current_balance,
             (SELECT COUNT(*) FROM loans l WHERE l.member_id = m.member_id) AS total_loans,
             (SELECT COUNT(*) FROM loans l WHERE l.member_id = m.member_id AND l.status IN ('disbursed','approved')) AS active_loans
      FROM members m
      LEFT JOIN accounts a ON m.member_id = a.member_id
      WHERE m.member_number = ?
    `, [req.params.memberNumber]);

    if (rows.length === 0) return res.status(404).json({ message: 'Member not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register new member with files
router.post('/', upload.fields([
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'idScan', maxCount: 1 },
  { name: 'residenceProof', maxCount: 1 },
  { name: 'lcLetter', maxCount: 1 }
]), async (req, res) => {
  const {
    fullName, phone, email, nationalId, address, occupation, dob, gender,
    nextOfKinName, nextOfKinRelationship, nextOfKinPhone, nextOfKinNationalId, nextOfKinAddress,
    refereeMemberNumber, registrationFeeReceipt
  } = req.body;

  const files = req.files;
  const passportPhotoUrl = files['passportPhoto'] ? files['passportPhoto'][0].path : null;
  const idScanUrl = files['idScan'] ? files['idScan'][0].path : null;
  const residenceProofUrl = files['residenceProof'] ? files['residenceProof'][0].path : null;
  const lcLetterUrl = files['lcLetter'] ? files['lcLetter'][0].path : null;

  // Validate required fields
  if (!fullName || !phone || !nationalId || !address || !occupation || !dob) {
    return res.status(400).json({ success: false, message: 'All personal details are required.' });
  }
  if (!nextOfKinName || !nextOfKinRelationship || !nextOfKinPhone) {
    return res.status(400).json({ success: false, message: 'Next of kin name, relationship, and phone are required.' });
  }
  if (!registrationFeeReceipt) {
    return res.status(400).json({ success: false, message: 'Registration fee receipt number is required.' });
  }

  // Validate referee if provided
  if (refereeMemberNumber) {
    const [referee] = await db.execute(
      "SELECT member_id FROM members WHERE member_number = ? AND membership_status = 'active'",
      [refereeMemberNumber]
    );
    if (referee.length === 0) {
      return res.status(400).json({ success: false, message: `Referee member number ${refereeMemberNumber} is not an active SACCO member.` });
    }
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Generate member number
    const [maxRows] = await conn.execute("SELECT MAX(CAST(SUBSTRING(member_number, 4) AS UNSIGNED)) as maxNum FROM members");
    const nextNum = (maxRows[0].maxNum || 0) + 1;
    const memberNumber = "MRS" + String(nextNum).padStart(4, '0');

    // Insert member (status defaults to 'pending')
    const [mResult] = await conn.execute(
      `INSERT INTO members (
        member_number, full_name, date_of_birth, gender, national_id, phone_number, email, address, occupation,
        joining_date, membership_status, registration_fee_paid,
        passport_photo_url, id_scan_url, residence_proof_url, lc_letter_url,
        referee_member_number, registration_fee_receipt_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'pending', FALSE, ?, ?, ?, ?, ?, ?)`,
      [
        memberNumber, fullName, dob, gender, nationalId, phone, email, address, occupation,
        passportPhotoUrl, idScanUrl, residenceProofUrl, lcLetterUrl,
        refereeMemberNumber || null, registrationFeeReceipt
      ]
    );
    const memberId = mResult.insertId;

    // Insert next of kin into next_of_kin table
    await conn.execute(
      `INSERT INTO next_of_kin (member_id, full_name, relationship, phone_number, national_id, address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [memberId, nextOfKinName, nextOfKinRelationship, nextOfKinPhone, nextOfKinNationalId || null, nextOfKinAddress || null]
    );

    // Create user account (inactive until approved)
    const [uResult] = await conn.execute(
      `INSERT INTO users (username, password_hash, role, is_active, created_at)
       VALUES (?, ?, 'member', FALSE, NOW())`,
      [memberNumber, memberNumber]
    );
    const userId = uResult.insertId;

    // Link member to user
    await conn.execute("UPDATE members SET user_id = ? WHERE member_id = ?", [userId, memberId]);

    // Create savings account (inactive until approved)
    const accountNumber = "ACC" + memberNumber;
    await conn.execute(
      `INSERT INTO accounts (account_number, member_id, account_type, opening_date, current_balance, status)
       VALUES (?, ?, 'savings', CURDATE(), 0, 'inactive')`,
      [accountNumber, memberId]
    );

    await db.logAudit(null, fullName, 'MEMBER_REGISTER_SUBMIT', 'members', memberNumber,
      `New member registration submitted for ${fullName} (NIN: ${nationalId})`);

    await conn.commit();

    if (email) notifyMember.registration(email, fullName, memberNumber);

    res.json({ success: true, memberNumber, message: 'Registration submitted successfully. Awaiting approval.' });
  } catch (error) {
    await conn.rollback();
    // Duplicate NIN or phone
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A member with this National ID already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

// Approve member
router.patch('/:memberNumber/approve', async (req, res) => {
  const { memberNumber } = req.params;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [memberRows] = await conn.execute("SELECT member_id, user_id FROM members WHERE member_number = ?", [memberNumber]);
    if (memberRows.length === 0) throw new Error('Member not found');
    const { member_id, user_id } = memberRows[0];

    // Update status and payment flag
    await conn.execute(
      "UPDATE members SET membership_status = 'active', registration_fee_paid = TRUE WHERE member_id = ?",
      [member_id]
    );

    // Activate user
    await conn.execute("UPDATE users SET is_active = TRUE WHERE user_id = ?", [user_id]);

    // Activate account
    await conn.execute("UPDATE accounts SET status = 'active' WHERE member_id = ?", [member_id]);

    // Fetch member details for email & logging
    const [m] = await conn.execute("SELECT full_name, email FROM members WHERE member_number = ?", [memberNumber]);

    // Log the staff's member approval to audit log
    await db.logAudit(null, 'staff', 'MEMBER_APPROVE', 'members', memberNumber, `Staff approved and activated member ${memberNumber} (${m[0] ? m[0].full_name : ''})`);

    await conn.commit();

    // Send notification (async)
    if (m[0] && m[0].email) notifyMember.approval(m[0].email, m[0].full_name, memberNumber);

    res.json({ success: true, message: 'Member approved and activated' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

// Reject member application
router.patch('/:memberNumber/reject', async (req, res) => {
  const { memberNumber } = req.params;
  try {
    const [result] = await db.execute(
      "UPDATE members SET membership_status = 'rejected' WHERE member_number = ? AND membership_status = 'pending'",
      [memberNumber]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Member not found or already processed' });

    await db.logAudit(null, 'staff', 'MEMBER_REJECT', 'members', memberNumber, `Staff rejected member registration for ${memberNumber}`);
    res.json({ success: true, message: 'Member registration rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Inactivate member
router.patch('/:memberNumber/inactivate', async (req, res) => {
  const { memberNumber } = req.params;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [memberRows] = await conn.execute("SELECT member_id, user_id FROM members WHERE member_number = ?", [memberNumber]);
    if (memberRows.length === 0) throw new Error('Member not found');
    const { member_id, user_id } = memberRows[0];

    await conn.execute("UPDATE members SET membership_status = 'inactive' WHERE member_id = ?", [member_id]);
    await conn.execute("UPDATE users SET is_active = FALSE WHERE user_id = ?", [user_id]);
    await conn.execute("UPDATE accounts SET status = 'inactive' WHERE member_id = ?", [member_id]);

    await db.logAudit(null, 'staff', 'MEMBER_INACTIVATE', 'members', memberNumber, `Staff inactivated member ${memberNumber}`);

    await conn.commit();
    res.json({ success: true, message: 'Member account inactivated securely' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

// Reactivate member
router.patch('/:memberNumber/reactivate', async (req, res) => {
  const { memberNumber } = req.params;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [memberRows] = await conn.execute("SELECT member_id, user_id FROM members WHERE member_number = ?", [memberNumber]);
    if (memberRows.length === 0) throw new Error('Member not found');
    const { member_id, user_id } = memberRows[0];

    await conn.execute("UPDATE members SET membership_status = 'active' WHERE member_id = ?", [member_id]);
    await conn.execute("UPDATE users SET is_active = TRUE WHERE user_id = ?", [user_id]);
    await conn.execute("UPDATE accounts SET status = 'active' WHERE member_id = ?", [member_id]);

    await db.logAudit(null, 'staff', 'MEMBER_REACTIVATE', 'members', memberNumber, `Staff reactivated member ${memberNumber}`);

    await conn.commit();
    res.json({ success: true, message: 'Member account reactivated successfully' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    conn.release();
  }
});

module.exports = router;

