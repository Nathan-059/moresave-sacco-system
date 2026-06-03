const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/config', async (req, res) => {
  try {
    const dbHost     = process.env.DB_HOST     || process.env.MYSQLHOST     || process.env.RAILWAY_TCP_PROXY_DOMAIN || 'localhost';
    const dbPort     = process.env.DB_PORT     || process.env.MYSQLPORT     || process.env.RAILWAY_TCP_PROXY_PORT   || '3306';
    const dbUser     = process.env.DB_USER     || process.env.MYSQLUSER     || 'root';
    const dbName     = process.env.DB_NAME     || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'sacco';
    const hasPassword = !!(process.env.DB_PASSWORD || process.env.MYSQLPASSWORD);

    let connectionOk = false;
    let connectionError = null;
    let tables = [];

    try {
      const [rows] = await db.execute('SELECT 1 as connection_test');
      if (rows && rows.length > 0 && rows[0].connection_test === 1) {
        connectionOk = true;
      }
      
      const [tableRows] = await db.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = ?", [dbName]);
      tables = tableRows.map(row => row.TABLE_NAME || row.table_name);
    } catch (err) {
      connectionError = err.message;
    }

    res.json({
      environment: {
        DB_HOST: process.env.DB_HOST || null,
        MYSQLHOST: process.env.MYSQLHOST || null,
        RAILWAY_TCP_PROXY_DOMAIN: process.env.RAILWAY_TCP_PROXY_DOMAIN || null,
        DB_PORT: process.env.DB_PORT || null,
        MYSQLPORT: process.env.MYSQLPORT || null,
        RAILWAY_TCP_PROXY_PORT: process.env.RAILWAY_TCP_PROXY_PORT || null,
        DB_USER: process.env.DB_USER || null,
        MYSQLUSER: process.env.MYSQLUSER || null,
        DB_NAME: process.env.DB_NAME || null,
        MYSQLDATABASE: process.env.MYSQLDATABASE || null,
        MYSQL_DATABASE: process.env.MYSQL_DATABASE || null,
        hasPassword
      },
      resolved: {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        name: dbName
      },
      connection: {
        ok: connectionOk,
        error: connectionError
      },
      database: {
        tablesCount: tables.length,
        tables
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
