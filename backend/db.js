// db.js - Exports the MySQL connection for use in admin and other modules
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Set your MySQL root password
  database: 'vuga',
  charset: 'utf8mb4' // Fixes encoding issues
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

module.exports = db;
