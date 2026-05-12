const { authenticator } = require('otplib');

const pool = require('../database/database');
const { encrypt, decrypt } = require('../utils/encryptDB');
const { hashPassword, verifyPassword } = require('../utils/hashPassword');

const TOTP_OPTIONS = {
  strategy: 'totp',
  window: 1,
};


// Login user
exports.login = async (req, res) => {

  const username =
    (req.body.username || req.body.username_input || '')
      .trim()
      .toLowerCase();

  const password =
    req.body.password || req.body.password_input || '';

  const totpCode =
    req.body.totpCode || req.body.totp_code || '';

  try {

    const result = await pool.query(

      `SELECT id, username, password, totp_secret, totp_enabled,
              failed_login_attempts, lock_until
       FROM users
       WHERE username = $1`,

      [username]
    );

    const user = result.rows[0];

    const LOCKOUT_THRESHOLD = 5;
    const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes


    const recordFailedAttempt = async (u) => {
      const lockExpired = u.lock_until && new Date() >= new Date(u.lock_until);
      const base = lockExpired ? 0 : u.failed_login_attempts;
      const newCount = base + 1;
      const lockUntil = newCount >= LOCKOUT_THRESHOLD
        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
        : null;

      await pool.query(
        `UPDATE users SET failed_login_attempts = $1, lock_until = $2 WHERE id = $3`,
        [newCount, lockUntil, u.id]
      );
    };

    const fakeHash =
      process.env.FAKE_HASH;

    const passwordToCheck =
      user ? user.password : fakeHash;

    // Always run hash check first to keep response time the same regardless of if accounts exists (stops timing attacks)

    const valid =
      await verifyPassword(
        passwordToCheck,
        password
      );

    // Checks lockout after timing safe hash (avoids early return stopping timing attacks))

    if (user && user.lock_until && new Date() < new Date(user.lock_until)) {
      return res
        .status(401)
        .send('Account temporarily locked due to too many failed attempts. Please try again later.');
        
    }

    if (!user || !valid) {
      if (user) await recordFailedAttempt(user);
      return res
        .status(401)
        .send('Invalid username or password');
    }

    // MFA check if enabled
    if (user.totp_enabled) {

      let totpOk = false;

      if (
        typeof totpCode === 'string' &&
        user.totp_secret
      ) {

        try {

          const secret =
            decrypt(user.totp_secret);

          totpOk =
            authenticator.verify({

              secret,

              token:
                totpCode
                  .trim()
                  .replace(/\s+/g, '')
            });

        }

        catch (_) {

          totpOk = false;
        }
      }

      // Generic auth failure avoids enumeration
      if (!totpOk) {
        await recordFailedAttempt(user);
        return res
          .status(401)
          .send('Invalid username or password');
      }
    }

    // Successful login and clears any failed attempts
    await pool.query(
      `UPDATE users SET failed_login_attempts = 0, lock_until = NULL WHERE id = $1`,
      [user.id]
    );

    // Regenerate session to prevent fixation
    req.session.regenerate((err) => {

      if (err) {

        console.error(err);

        return res.sendStatus(500);
      }

      req.session.userId =
        user.id;

      res.sendStatus(200);
    });

  }

  catch (err) {

    console.error(err);

    res.sendStatus(500);
  }
};



// Register user
exports.register = async (req, res) => {

  const username =
    (req.body.username || req.body.username_input || '')
      .trim()
      .toLowerCase();

  const password =
    req.body.password || req.body.password_input || '';

  const email =
    (req.body.email || '')
      .trim()
      .toLowerCase();

  // Username validation
  if (

    username.length < 3 ||
    username.length > 20 ||
    !/^[a-zA-Z0-9_]+$/.test(username)

  ) {

    return res.status(400).send(
      'Username must be between 3 and 20 characters and contain only letters, numbers, and underscores.'
    );
  }

  // Email validation
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {

    return res
      .status(400)
      .send('Invalid email address');
  }

  // Password validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!passwordRegex.test(password)) {

    return res.status(400).send(
      'Password must be at least 8 characters and include uppercase, lowercase and a number'
    );
  }

  try {

    // Hash password
    const hashed =
      await hashPassword(password);

    // Encrypt email before storage
    const encryptedEmail =
      encrypt(email);

    await pool.query(

      `INSERT INTO users
       (username, email, password)
       VALUES ($1, $2, $3)`,

      [
        username,
        encryptedEmail,
        hashed
      ]
    );

    return res
      .status(201)
      .send('User registered successfully.');

  }

  catch (err) {

    // Duplicate username/email
    if (err.code === '23505') {

      return res
        .status(400)
        .send('Unable to complete registration.');
    }

    console.error(err);

    return res.sendStatus(500);
  }
};