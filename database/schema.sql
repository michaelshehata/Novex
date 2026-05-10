-- USERS TABLE

CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  username VARCHAR(20) NOT NULL UNIQUE
    CHECK (length(username) >= 3),

  email TEXT NOT NULL UNIQUE,

  password TEXT NOT NULL
    CHECK (length(password) > 0),

  -- MFA
  totp_secret TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  -- Account lockout
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  lock_until TIMESTAMPTZ
);



-- POSTS TABLE

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  user_id INTEGER NOT NULL,

  title VARCHAR(200) NOT NULL,

  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);



-- INDEXES

CREATE INDEX IF NOT EXISTS idx_posts_user_id
ON posts(user_id);

CREATE INDEX IF NOT EXISTS idx_users_username
ON users(username);