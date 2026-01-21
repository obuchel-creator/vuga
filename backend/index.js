const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Set your MySQL root password
  database: 'kampala_traffic'
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
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

// Example endpoint: Get all traffic reports
app.get('/api/reports', (req, res) => {
  db.query('SELECT * FROM reports', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Example endpoint: Add a new traffic report with lat/lng
app.post('/api/reports', upload.single('photo'), (req, res) => {
  const { location, description, severity, latitude, longitude } = req.body;
  const photo = req.file ? req.file.filename : null;
  db.query(
    'INSERT INTO reports (location, description, severity, latitude, longitude, photo) VALUES (?, ?, ?, ?, ?, ?)',
    [location, description, severity, latitude, longitude, photo],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: result.insertId, location, description, severity, latitude, longitude, photo });
    }
  );
});

// Upvote a report
app.post('/api/reports/:id/upvote', (req, res) => {
  const { id } = req.params;
  db.query('UPDATE reports SET upvotes = upvotes + 1 WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

// Downvote a report
app.post('/api/reports/:id/downvote', (req, res) => {
  const { id } = req.params;
  db.query('UPDATE reports SET downvotes = downvotes + 1 WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

// AUTH: Register (support phone)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, phone } = req.body;
  if ((!email && !phone) || !password) return res.status(400).json({ error: 'Email or phone and password required' });
  const hash = await bcrypt.hash(password, 10);
  db.query('INSERT INTO users (email, phone, password) VALUES (?, ?, ?)', [email || null, phone || null, hash], (err, result) => {
    if (err) return res.status(400).json({ error: 'Email or phone already exists' });
    res.json({ user: { id: result.insertId, email, phone } });
  });
});

// AUTH: Login (support phone)
app.post('/api/auth/login', (req, res) => {
  const { email, phone, password } = req.body;
  if ((!email && !phone) || !password) return res.status(400).json({ error: 'Email or phone and password required' });
  const field = email ? 'email' : 'phone';
  const value = email || phone;
  db.query(`SELECT * FROM users WHERE ${field} = ?`, [value], async (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    res.json({ user: { id: user.id, email: user.email, phone: user.phone } });
  });
});

// Serve uploaded photos statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
