-- feature_flags.sql: Table for feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  flag VARCHAR(64) PRIMARY KEY,
  enabled BOOLEAN NOT NULL,
  version VARCHAR(32)
);