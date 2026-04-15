// Simple analytics endpoint for Vuga trends
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get report counts by severity
router.get('/report-counts', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT severity, COUNT(*) as count FROM reports GROUP BY severity');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get daily report counts (last 7 days)
router.get('/daily-reports', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM reports WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY date ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily reports' });
  }
});

module.exports = router;

