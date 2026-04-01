-- rollouts.sql: Table for staged rollout percentages
CREATE TABLE IF NOT EXISTS rollouts (
  version VARCHAR(32) PRIMARY KEY,
  percentage INT NOT NULL
);