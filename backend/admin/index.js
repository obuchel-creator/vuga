// Simple Express admin dashboard for traffic reports
const express = require('express');
const router = express.Router();
const db = require('../db'); // Assumes db.js exports MySQL connection
const analyticsRoutes = require('./analytics');

// Admin: Get all reports
router.get('/reports', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Admin: Delete a report
router.delete('/reports/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM reports WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Admin: Get all users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.use('/analytics', analyticsRoutes);
module.exports = router;
