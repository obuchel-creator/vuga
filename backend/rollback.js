// rollback.js - Manage rollbacks for app versions
const db = require('./db');

// POST /rollback
// { version, rollbackTo }
exports.setRollback = (req, res) => {
  const { version, rollbackTo } = req.body;
  if (!version || !rollbackTo) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.query(
    'INSERT INTO rollbacks (version, rollbackTo) VALUES (?, ?) ON DUPLICATE KEY UPDATE rollbackTo = VALUES(rollbackTo)',
    [version, rollbackTo],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB error', details: err });
      return res.json({ success: true });
    }
  );
};

// GET /rollback-status?version=xxx
exports.getRollbackStatus = (req, res) => {
  const { version } = req.query;
  if (!version) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  db.query('SELECT rollbackTo FROM rollbacks WHERE version = ?', [version], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    if (!results.length) return res.json({ rollback: false });
    return res.json({ rollback: results[0].rollbackTo });
  });
};
