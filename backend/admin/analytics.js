// Simple analytics endpoint for traffic trends
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get report counts by severity
router.get('/report-counts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT severity, COUNT(*) as count FROM reports GROUP BY severity');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get daily report counts (last 7 days)
router.get('/daily-reports', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT DATE(created_at) as date, COUNT(*) as count FROM reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at)`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily reports' });
  }
});

module.exports = router;
