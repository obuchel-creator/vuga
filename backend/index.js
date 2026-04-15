const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pool = require('./db');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const errorHandler = require('./errorHandler');
const { isNonEmptyString, isValidSeverity, isValidLatLng } = require('./validation');
const { authRequired, requireRole } = require('./middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json());

// --- WebSocket setup (integrated with HTTP server) ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Route Suggestions API
// POST /api/route-suggestions { start: { latitude, longitude }, end: { latitude, longitude } }
app.post('/api/route-suggestions', (req, res) => {
  const { start, end } = req.body;
  if (!start || !end || typeof start.latitude !== 'number' || typeof start.longitude !== 'number' || typeof end.latitude !== 'number' || typeof end.longitude !== 'number') {
    return res.status(400).json({ error: 'Start and end coordinates are required.' });
  }
  const route = {
    start,
    end,
    waypoints: [],
    distance: 5.0,
    duration: 15,
    polyline: '',
    message: 'Route suggestion feature coming soon.'
  };
  res.json({ route });
});

// Set up multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// GET /api/reports - public
app.get('/api/reports', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

// POST /api/reports - auth required
app.post('/api/reports', authRequired, upload.single('photo'), async (req, res) => {
  const { location, description, severity, latitude, longitude } = req.body;
  const photo = req.file ? req.file.filename : null;
  if (!isNonEmptyString(location)) return res.status(400).json({ error: 'Location is required.' });
  if (!isNonEmptyString(description)) return res.status(400).json({ error: 'Description is required.' });
  if (!isValidSeverity(severity)) return res.status(400).json({ error: 'Invalid severity.' });
  const latNum = Number(latitude), lngNum = Number(longitude);
  if (!isValidLatLng(latNum, lngNum)) return res.status(400).json({ error: 'Invalid latitude or longitude.' });
  const userId = req.user.sub;
  try {
    const { rows } = await pool.query(
      'INSERT INTO reports (user_id, location, description, severity, latitude, longitude, photo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, location, description, severity, latNum, lngNum, photo]
    );
    const report = rows[0];
    broadcast({ type: 'report:new', data: report });
    res.json(report);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Failed to add report.' });
  }
});

// POST /api/reports/:id/upvote - auth required
app.post('/api/reports/:id/upvote', authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE reports SET upvotes = upvotes + 1 WHERE id = $1 RETURNING id, upvotes, downvotes',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Report not found.' });
    broadcast({ type: 'report:votesUpdated', data: rows[0] });
    res.json({ success: true, upvotes: rows[0].upvotes, downvotes: rows[0].downvotes });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Failed to upvote.' });
  }
});

// POST /api/reports/:id/downvote - auth required
app.post('/api/reports/:id/downvote', authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'UPDATE reports SET downvotes = downvotes + 1 WHERE id = $1 RETURNING id, upvotes, downvotes',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Report not found.' });
    broadcast({ type: 'report:votesUpdated', data: rows[0] });
    res.json({ success: true, upvotes: rows[0].upvotes, downvotes: rows[0].downvotes });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Failed to downvote.' });
  }
});

// GET /api/reports/:id/comments - public
app.get('/api/reports/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM comments WHERE report_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// POST /api/reports/:id/comments - auth required
app.post('/api/reports/:id/comments', authRequired, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!isNonEmptyString(text)) return res.status(400).json({ error: 'Comment text required.' });
  const userId = req.user.sub;
  try {
    const { rows } = await pool.query(
      'INSERT INTO comments (report_id, user_id, text) VALUES ($1, $2, $3) RETURNING *',
      [id, userId, text]
    );
    const comment = rows[0];
    broadcast({ type: 'comment:new', data: { report_id: id, comment } });
    res.json(comment);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// AUTH: Register (email or phone + password)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, phone } = req.body;
  if ((!isNonEmptyString(email) && !isNonEmptyString(phone)) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'Email or phone and password required.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (email, phone, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, phone, role',
      [email || null, phone || null, hash, 'user']
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('DB error:', err);
    res.status(400).json({ error: 'Email or phone already exists.' });
  }
});

// AUTH: Login (email or phone + password)
app.post('/api/auth/login', async (req, res) => {
  const { email, phone, password } = req.body;
  if ((!isNonEmptyString(email) && !isNonEmptyString(phone)) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'Email or phone and password required.' });
  }
  const field = isNonEmptyString(email) ? 'email' : 'phone';
  const value = email || phone;
  try {
    const { rows } = await pool.query(`SELECT * FROM users WHERE ${field} = $1`, [value]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid credentials.' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials.' });
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, email: user.email, phone: user.phone, role: user.role } });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Failed to login.' });
  }
});

// Serve uploaded photos statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// POST /api/push/register - auth required; upserts push token for authenticated user
app.post('/api/push/register', authRequired, async (req, res) => {
  const { expoPushToken } = req.body;
  if (!expoPushToken) return res.status(400).json({ error: 'Missing expoPushToken' });
  const userId = req.user.sub;
  try {
    await pool.query(
      `INSERT INTO push_tokens (user_id, expo_push_token, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET expo_push_token = EXCLUDED.expo_push_token, updated_at = NOW()`,
      [userId, expoPushToken]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Failed to register push token.' });
  }
});

// POST /api/push/send - admin or moderator only
app.post('/api/push/send', authRequired, requireRole('admin', 'moderator'), async (req, res) => {
  const { message, userIds, role } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  try {
    let tokens = [];
    if (userIds && Array.isArray(userIds) && userIds.length) {
      const { rows } = await pool.query(
        'SELECT expo_push_token FROM push_tokens WHERE user_id = ANY($1)',
        [userIds]
      );
      tokens = rows.map(r => r.expo_push_token);
    } else if (role) {
      const { rows } = await pool.query(
        'SELECT pt.expo_push_token FROM push_tokens pt JOIN users u ON u.id = pt.user_id WHERE u.role = $1',
        [role]
      );
      tokens = rows.map(r => r.expo_push_token);
    }
    await sendPush(tokens, message);
    res.json({ success: true, sent: tokens.length });
  } catch (err) {
    console.error('Push send error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function sendPush(tokens, message) {
  if (!tokens.length) return;
  const fetch = require('node-fetch');
  await Promise.all(tokens.map(token =>
    fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, sound: 'default', body: message })
    })
  ));
}

// POST /api/admin/broadcast - admin only
app.post('/api/admin/broadcast', authRequired, requireRole('admin'), async (req, res) => {
  const { message, targetRole } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  try {
    let tokens = [];
    if (targetRole) {
      const { rows } = await pool.query(
        'SELECT pt.expo_push_token FROM push_tokens pt JOIN users u ON u.id = pt.user_id WHERE u.role = $1',
        [targetRole]
      );
      tokens = rows.map(r => r.expo_push_token);
    } else {
      const { rows } = await pool.query('SELECT expo_push_token FROM push_tokens');
      tokens = rows.map(r => r.expo_push_token);
    }
    await sendPush(tokens, message);
    res.json({ success: true, sent: tokens.length });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- User-to-User Messaging (in-memory, non-realtime chat out of scope) ---
const userMessages = {};
app.post('/api/messages/send', (req, res) => {
  const { from, to, text } = req.body;
  if (!from || !to || !text) return res.status(400).json({ error: 'Missing fields' });
  if (!userMessages[to]) userMessages[to] = [];
  userMessages[to].push({ from, text, timestamp: Date.now() });
  res.json({ success: true });
});
app.get('/api/messages/inbox/:userId', (req, res) => {
  const { userId } = req.params;
  res.json(userMessages[userId] || []);
});

// Admin dashboard routes
const adminRoutes = require('./admin');
app.use('/admin', adminRoutes);

// Centralized error handler (should be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server, wss, broadcast };

