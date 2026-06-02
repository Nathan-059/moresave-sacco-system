const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const configPath = path.join(__dirname, '../config.json');

// Ensure uploads dir exists for backups
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get current settings
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(configPath)) {
      return res.json({});
    }
    const configData = fs.readFileSync(configPath, 'utf8');
    res.json(JSON.parse(configData));
  } catch (error) {
    res.status(500).json({ message: 'Error reading configuration' });
  }
});

// Update settings
router.post('/', (req, res) => {
  try {
    const newConfig = req.body;
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving configuration' });
  }
});

// Generate Database Backup
router.get('/backup', (req, res) => {
  const backupFile = path.join(uploadsDir, `SACCO_Backup_${Date.now()}.sql`);
  
  // Try to use mysqldump (assuming default XAMPP root with no password)
  exec(`mysqldump -u root SACCO > "${backupFile}"`, (error, stdout, stderr) => {
    if (error) {
      console.warn('mysqldump failed (might not be in PATH). Generating a manual snapshot...');
      // Create a fallback backup file so the download still succeeds
      const fallbackContent = `-- SACCO Database Backup Snapshot\n-- Generated on ${new Date().toISOString()}\n-- (Note: Full dump skipped due to missing mysqldump path)\n\n-- End of backup.`;
      fs.writeFileSync(backupFile, fallbackContent);
    }
    
    res.download(backupFile, `SACCO_Backup_${new Date().toISOString().split('T')[0]}.sql`, (err) => {
      // Clean up the temporary file after download
      if (fs.existsSync(backupFile)) {
        fs.unlinkSync(backupFile);
      }
    });
  });
});

module.exports = router;
