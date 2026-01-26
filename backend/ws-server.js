// --- Live analytics for admin dashboard ---
function broadcastAnalytics() {
  // User count (connected clients)
  const userCount = wss.clients.size;
  // Report trends (last 7 days)
  db.query(`SELECT DATE(created_at) as date, COUNT(*) as count FROM reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at)`, (err, trendRows) => {
    if (err) return;
    // Severity breakdown
    db.query('SELECT severity, COUNT(*) as count FROM reports GROUP BY severity', (err2, sevRows) => {
      if (err2) return;
      const analytics = {
        userCount,
        trends: trendRows,
        severity: sevRows
      };
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'analytics', data: analytics }));
        }
      });
    });
  });
}

// Broadcast analytics every 10 seconds
setInterval(broadcastAnalytics, 10000);
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

// --- Real-time chat for user groups/incidents ---
// In-memory chat store (for demo; use DB in production)
const chatRooms = {}; // { roomId: [ { from, text, timestamp } ] }

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    let msg;
    try { msg = JSON.parse(message); } catch { return; }
    // Chat message: { type: 'chat', roomId, from, text }
    if (msg.type === 'chat' && msg.roomId && msg.from && msg.text) {
      if (!chatRooms[msg.roomId]) chatRooms[msg.roomId] = [];
      const chatMsg = { from: msg.from, text: msg.text, timestamp: Date.now() };
      chatRooms[msg.roomId].push(chatMsg);
      // Broadcast to all clients in this room
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'chat', roomId: msg.roomId, message: chatMsg }));
        }
      });
    }
    // Fetch chat history: { type: 'getChat', roomId }
    if (msg.type === 'getChat' && msg.roomId) {
      ws.send(JSON.stringify({ type: 'chatHistory', roomId: msg.roomId, messages: chatRooms[msg.roomId] || [] }));
    }
  });
  // ...existing code...
});

server.listen(5050, () => {
  console.log('WebSocket server running on port 5050');
});
