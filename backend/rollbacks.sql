-- rollbacks.sql: Table for rollbacks
CREATE TABLE IF NOT EXISTS rollbacks (
  version VARCHAR(32) PRIMARY KEY,
  rollbackTo VARCHAR(32) NOT NULL
);