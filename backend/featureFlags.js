// featureFlags.js - Manage feature flags for users and versions
const db = require('./db');

// POST /feature-flag
// { flag, enabled, version (optional) }
exports.setFeatureFlag = (req, res) => {
  const { flag, enabled, version } = req.body;
  if (!flag || typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.query(
    'INSERT INTO feature_flags (flag, enabled, version) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), version = VALUES(version)',
    [flag, enabled, version || null],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error', details: err });
      return res.json({ success: true });
    }
  );
};

// GET /feature-flag-status?flag=xxx&userId=yyy&version=zzz
exports.getFeatureFlagStatus = (req, res) => {
  const { flag, userId, version } = req.query;
  if (!flag || !userId) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  // For now, enable by flag and version only (can extend to user targeting)
  db.query('SELECT enabled FROM feature_flags WHERE flag = ? AND (version IS NULL OR version = ?)', [flag, version || null], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    if (!results.length) return res.json({ enabled: false });
    return res.json({ enabled: !!results[0].enabled });
  });
};
