const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all system and member audit logs
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(logged_at, '%Y-%m-%d %H:%i:%s') AS timestamp,
             COALESCE(username, 'System') AS user,
             action,
             description AS details
      FROM audit_log
      ORDER BY logged_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
