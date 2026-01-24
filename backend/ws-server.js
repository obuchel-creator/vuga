// Simple WebSocket server for real-time traffic updates
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql2');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'kampala_traffic'
});

db.connect();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Optionally handle client messages
  });
  // Send initial reports
  db.query('SELECT * FROM reports', (err, results) => {
    if (!err) ws.send(JSON.stringify({ type: 'reports', data: results }));
  });
});

// Broadcast new reports every 10 seconds
setInterval(() => {
  db.query('SELECT * FROM reports', (err, results) => {
    if (!err) {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'reports', data: results }));
        }
      });
    }
  });
}, 10000);

server.listen(5050, () => {
  console.log('WebSocket server running on port 5050');
});
