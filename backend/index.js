const express = require('express');
const mysql = require('mysql2'); // This line will remain for compatibility
const db = require('./db');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const errorHandler = require('./errorHandler');
const { isNonEmptyString, isValidSeverity, isValidLatLng } = require('./validation');

const app = express();
app.use(cors());
app.use(express.json());

// Route Suggestions API
// POST /api/route-suggestions { start: { latitude, longitude }, end: { latitude, longitude } }
app.post('/api/route-suggestions', (req, res) => {
  const { start, end } = req.body;
  // Basic validation
  if (!start || !end || typeof start.latitude !== 'number' || typeof start.longitude !== 'number' || typeof end.latitude !== 'number' || typeof end.longitude !== 'number') {
    return res.status(400).json({ error: 'Start and end coordinates are required.' });
  }
  // TODO: Integrate with Google Maps Directions API or custom logic
  // For now, return a placeholder route
  const route = {
    start,
    end,
    waypoints: [],
    distance: 5.0, // km (placeholder)
    duration: 15, // min (placeholder)
    polyline: '', // encoded polyline (placeholder)
    message: 'Route suggestion feature coming soon.'
  };
  res.json({ route });
});

// db connection is now handled in db.js

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

// Example endpoint: Get all traffic reports
app.get('/api/reports', (req, res) => {
  db.query('SELECT * FROM reports', (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Failed to fetch reports.' });
    }
    res.json(results);
  });
});

// Example endpoint: Add a new traffic report with lat/lng
app.post('/api/reports', upload.single('photo'), (req, res) => {
  const { location, description, severity, latitude, longitude } = req.body;
  const photo = req.file ? req.file.filename : null;
  // Validation
  if (!isNonEmptyString(location)) return res.status(400).json({ error: 'Location is required.' });
  if (!isNonEmptyString(description)) return res.status(400).json({ error: 'Description is required.' });
  if (!isValidSeverity(severity)) return res.status(400).json({ error: 'Invalid severity.' });
  const latNum = Number(latitude), lngNum = Number(longitude);
  if (!isValidLatLng(latNum, lngNum)) return res.status(400).json({ error: 'Invalid latitude or longitude.' });
  db.query(
    'INSERT INTO reports (location, description, severity, latitude, longitude, photo) VALUES (?, ?, ?, ?, ?, ?)',
    [location, description, severity, latNum, lngNum, photo],
    (err, result) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ error: 'Failed to add report.' });
      }
      res.json({ id: result.insertId, location, description, severity, latitude: latNum, longitude: lngNum, photo });
    }
  );
});


// Upvote a report
app.post('/api/reports/:id/upvote', (req, res) => {
  const { id } = req.params;
  db.query('UPDATE reports SET upvotes = upvotes + 1 WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Failed to upvote.' });
    }
    res.json({ success: true });
  });
});

// Downvote a report
app.post('/api/reports/:id/downvote', (req, res) => {
  const { id } = req.params;
  db.query('UPDATE reports SET downvotes = downvotes + 1 WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Failed to downvote.' });
    }
    res.json({ success: true });
  });
});

// COMMENTS: Get comments for a report
app.get('/api/reports/:id/comments', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM comments WHERE report_id = ? ORDER BY created_at ASC', [id], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Failed to fetch comments.' });
    }
    res.json(results);
  });
});

// COMMENTS: Add a comment to a report
app.post('/api/reports/:id/comments', (req, res) => {
  const { id } = req.params;
  const { text, user_id } = req.body;
  if (!isNonEmptyString(text)) return res.status(400).json({ error: 'Comment text required.' });
  db.query('INSERT INTO comments (report_id, user_id, text) VALUES (?, ?, ?)', [id, user_id || null, text], (err, result) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Failed to add comment.' });
    }
    res.json({ id: result.insertId, report_id: id, user_id: user_id || null, text });
  });
});

// AUTH: Register (support phone)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, phone, role } = req.body;
  if ((!isNonEmptyString(email) && !isNonEmptyString(phone)) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'Email or phone and password required.' });
  }
  const userRole = ['admin', 'moderator', 'user'].includes(role) ? role : 'user';
  try {
    const hash = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (email, phone, password, role) VALUES (?, ?, ?, ?)', [email || null, phone || null, hash, userRole], (err, result) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(400).json({ error: 'Email or phone already exists.' });
      }
      res.json({ user: { id: result.insertId, email, phone, role: userRole } });
    });
  } catch (err) {
    console.error('Hash error:', err);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

// AUTH: Login (support phone)
app.post('/api/auth/login', (req, res) => {
  const { email, phone, password } = req.body;
  if ((!isNonEmptyString(email) && !isNonEmptyString(phone)) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'Email or phone and password required.' });
  }
  const field = isNonEmptyString(email) ? 'email' : 'phone';
  const value = email || phone;
  db.query(`SELECT * FROM users WHERE ${field} = ?`, [value], async (err, results) => {
    if (err || results.length === 0) {
      if (err) console.error('DB error:', err);
      return res.status(400).json({ error: 'Invalid credentials.' });
    }
    const user = results[0];
    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ error: 'Invalid credentials.' });
      res.json({ user: { id: user.id, email: user.email, phone: user.phone, role: user.role } });
    } catch (err) {
      console.error('Hash error:', err);
      res.status(500).json({ error: 'Failed to login.' });
    }
  });
});


// Serve uploaded photos statically

// Push notification targeting
const userPushTokens = {}; // { userId: expoPushToken }

app.post('/api/push/register', (req, res) => {
  const { userId, expoPushToken } = req.body;
  if (!userId || !expoPushToken) return res.status(400).json({ error: 'Missing userId or token' });
  userPushTokens[userId] = expoPushToken;
  res.json({ success: true });
});

app.post('/api/push/send', async (req, res) => {
  const { message, userIds, role } = req.body;
  let targets = [];
  if (userIds && Array.isArray(userIds)) {
    targets = userIds.map(id => userPushTokens[id]).filter(Boolean);
  } else if (role) {
    db.query('SELECT id FROM users WHERE role = ?', [role], (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      targets = results.map(u => userPushTokens[u.id]).filter(Boolean);
      sendPush(targets, message, res);
    });
    return;
  }
  sendPush(targets, message, res);
});

function sendPush(tokens, message, res) {
  if (!tokens.length) return res.json({ success: false, error: 'No tokens' });
  // Use Expo push API
  const fetch = require('node-fetch');
  Promise.all(tokens.map(token =>
    fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, sound: 'default', body: message })
    })
  )).then(() => res.json({ success: true })).catch(e => res.status(500).json({ error: e.message }));
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Admin Broadcasts ---
// POST /api/admin/broadcast { message, targetRole (optional) }
app.post('/api/admin/broadcast', async (req, res) => {
  const { message, targetRole } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  let targets = [];
  if (targetRole) {
    db.query('SELECT id FROM users WHERE role = ?', [targetRole], (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      targets = results.map(u => userPushTokens[u.id]).filter(Boolean);
      sendPush(targets, message, res);
    });
    return;
  }
  // Broadcast to all users
  targets = Object.values(userPushTokens);
  sendPush(targets, message, res);
});

// --- User-to-User Messaging ---
// In-memory message store for demo (replace with DB in prod)
const userMessages = {};
// POST /api/messages/send { from, to, text }
app.post('/api/messages/send', (req, res) => {
  const { from, to, text } = req.body;
  if (!from || !to || !text) return res.status(400).json({ error: 'Missing fields' });
  if (!userMessages[to]) userMessages[to] = [];
  userMessages[to].push({ from, text, timestamp: Date.now() });
  // Optionally send push notification
  if (userPushTokens[to]) {
    sendPush([userPushTokens[to]], `New message from user ${from}: ${text}`);
  }
  res.json({ success: true });
});
// GET /api/messages/inbox/:userId
app.get('/api/messages/inbox/:userId', (req, res) => {
  const { userId } = req.params;
  res.json(userMessages[userId] || []);
});

// Admin dashboard routes
const adminRoutes = require('./admin');
app.use('/admin', adminRoutes);

// Centralized error handler (should be last middleware)
app.use(errorHandler);


const PORT = 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
