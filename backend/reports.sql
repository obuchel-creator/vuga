-- MySQL table for traffic reports
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location VARCHAR(255) NOT NULL,
  description TEXT,
  severity ENUM('low', 'medium', 'high') DEFAULT 'low',
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
