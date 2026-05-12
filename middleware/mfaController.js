const { authenticator } = require('otplib');
const QRCode = require('qrcode');

const pool = require('../database/database');
const { encrypt } = require('../utils/encryptDB');
const { verifyPassword } = require('../utils/hashPassword');

const TOTP_OPTIONS = {
  strategy: 'totp',
  epochTolerance: 60,
};

exports.beginTotpSetup = async (req, res) => {
  try {

    const secret = authenticator.generateSecret();

    req.session.pendingTotpSecret = secret;

    const userResult = await pool.query(
      'SELECT username FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      return res.sendStatus(403);
    }

    const username = userResult.rows[0].username;

    const issuer = process.env.APP_NAME || 'Novex';

    const otpauth_url = authenticator.keyuri(
      username,
      issuer,
      secret
    );

    const qrCodeDataURL =
      await QRCode.toDataURL(otpauth_url);

    res.json({
      qrCode: qrCodeDataURL,
      secret_base32: secret,
    });

  }

  catch (err) {

    console.error(err);

    res.sendStatus(500);
  }
};



exports.confirmTotpSetup = async (req, res) => {

  const code =
    req.body.totpCode || req.body.totp_code;

  const pending =
    req.session.pendingTotpSecret;

  if (!pending || typeof code !== 'string') {

    return res
      .status(400)
      .send('Invalid request');
  }

  const normalized =
    code.trim().replace(/\s+/g, '');

  const check = authenticator.verify({
    secret: pending,
    token: normalized,
  });

  // FIXED HERE
  if (!check) {

    return res
      .status(400)
      .send('Invalid code');
  }

  try {

    const enc = encrypt(pending);

    await pool.query(
      'UPDATE users SET totp_secret = $2, totp_enabled = TRUE WHERE id = $1',
      [req.session.userId, enc]
    );

    delete req.session.pendingTotpSecret;

    res.sendStatus(204);

  }

  catch (err) {

    console.error(err);

    res.sendStatus(500);
  }
};



exports.disableTotp = async (req, res) => {

  const password =
    req.body.password || req.body.password_input;

  if (!password || typeof password !== 'string') {

    return res
      .status(400)
      .send('Password required');
  }

  try {

    const r = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (r.rows.length === 0) {
      return res.sendStatus(403);
    }

    const ok = await verifyPassword(
      r.rows[0].password,
      password
    );

    if (!ok) {

      return res
        .status(401)
        .send('Invalid password');
    }

    await pool.query(
      'UPDATE users SET totp_secret = NULL, totp_enabled = FALSE WHERE id = $1',
      [req.session.userId]
    );

    delete req.session.pendingTotpSecret;

    res.sendStatus(204);

  }

  catch (err) {

    console.error(err);

    res.sendStatus(500);
  }
};