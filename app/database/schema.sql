-- Run once in your PostgreSQL database (e.g. psql, pgAdmin, or VS Code SQL extension).
-- Matches what the Node app expects: users.id, users.username, users.password (Argon2 string).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL
);
