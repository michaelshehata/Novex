-- Run once in your PostgreSQL database (e.g. psql, pgAdmin, or VS Code SQL extension).
-- Matches what the Node app expects: users.id, users.username, users.password (Argon2 string).

CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE CHECK (length(username) >= 3),
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL CHECK (length(password) > 0),
  totp_secret TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_user_id ON posts(user_id);