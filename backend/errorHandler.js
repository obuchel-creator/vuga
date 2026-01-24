// Centralized error handler for Express
module.exports = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error.' });
};
