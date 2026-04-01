// rollout.js - Manage staged rollouts for app versions
const db = require('./db');

// POST /rollout
// { version, percentage }
exports.setRollout = (req, res) => {
  const { version, percentage } = req.body;
  if (!version || typeof percentage !== 'number') {
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.query(
    'INSERT INTO rollouts (version, percentage) VALUES (?, ?) ON DUPLICATE KEY UPDATE percentage = VALUES(percentage)',
    [version, percentage],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error', details: err });
      return res.json({ success: true });
    }
  );
};

// GET /rollout-status?version=xxx&userId=yyy
exports.getRolloutStatus = (req, res) => {
  const { version, userId } = req.query;
  if (!version || !userId) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.query('SELECT percentage FROM rollouts WHERE version = ?', [version], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    if (!results.length) return res.json({ rollout: false });
    const percentage = results[0].percentage;
    // Simple deterministic targeting: hash userId, mod 100
    const hash = Math.abs(hashCode(userId)) % 100;
    return res.json({ rollout: hash < percentage });
  });
};

// Simple hash function for user targeting
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
