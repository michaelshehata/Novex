const { verifySync } = require('otplib');

const pool = require('../database/database');
const { encrypt, decrypt } = require('../utils/encrypt_db');
const { hashPassword, verifyPassword } = require('../utils/hashing');

const TOTP_OPTIONS = {
  strategy: 'totp',
  epochTolerance: 60,
};

exports.login = async (req, res) => {
  const username = req.body.username || req.body.username_input;
  const password = req.body.password || req.body.password_input;
  const totpCode = req.body.totpCode || req.body.totp_code;

  try {
    const result = await pool.query(
      "SELECT id, username, password, totp_secret, totp_enabled FROM users WHERE username = $1",
      [username]
    );

    const user = result.rows[0];

    // Must be a well-formed Argon2 string so argon2.verify does not throw when user is missing.
    const fakeHash =
      '$argon2id$v=19$m=65536,t=3,p=4$shTWS1al2/pdjWQt5CyoYQ$ugMNX6llcTEOa2xTr/AyCjnjFU3KKS7fnhhsjfrpzD8';

    const passwordToCheck = user ? user.password : fakeHash;

    const valid = await verifyPassword(passwordToCheck, password);

    if (!user || !valid) {
      return res.status(401).send('Invalid username or password');
    }

    if (user.totp_enabled) {
      let totpOk = false;
      if (typeof totpCode === 'string' && user.totp_secret) {
        try {
          const secret = decrypt(user.totp_secret);
          totpOk = verifySync({
            secret,
            token: totpCode.trim().replace(/\s+/g, ''),
            ...TOTP_OPTIONS,
          }).valid;
        } catch (_) {
          totpOk = false;
        }
      }

      // Same generic message avoids leaking whether MFA is enabled.
      if (!totpOk) {
        return res.status(401).send('Invalid username or password');
      }
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }

      req.session.userId = user.id;
      res.sendStatus(200);
    });

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.register = async (req, res) => {
  const username = req.body.username || req.body.username_input;
  const password = req.body.password || req.body.password_input;
  const email = req.body.email || username;

  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    const hashed = await hashPassword(password);

    const encryptedEmail = encrypt(email);

    await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
      [username, encryptedEmail, hashed]
    );

    return res.status(201).send("User registered");

  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).send('Unable to complete registration.');
    }

    console.error(err);
    return res.sendStatus(500);
  }
};