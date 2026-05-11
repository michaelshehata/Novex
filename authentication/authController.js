const { authenticator } = require('otplib');

const pool = require('../database/database');
const { encrypt, decrypt } = require('../utils/encrypt_db');
const { hashPassword, verifyPassword } = require('../utils/hashing');

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

      `SELECT id, username, password, totp_secret, totp_enabled
       FROM users 
       WHERE username = $1`,

      [username]
    );

    const user = result.rows[0];

    const fakeHash =
      process.env.FAKE_HASH;

    const passwordToCheck =
      user ? user.password : fakeHash;

    const valid =
      await verifyPassword(
        passwordToCheck,
        password
      );

    if (!user || !valid) {

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

        return res
          .status(401)
          .send('Invalid username or password');
      }
    }

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