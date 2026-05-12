/**
 * Insert or update a user (Argon2id + encrypted email, aligned with the app).
 */

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = require('../database/database');
const { encrypt } = require('../utils/encryptDB');
const { hashPassword } = require('../utils/hashPassword');

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  const emailArg = process.argv[4];

  if (!username || !password) {
    console.error('Usage: node scripts/seed_user.js <username> <password> [email]');
    process.exit(1);
  }

  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 8) {
    console.error('ENCRYPTION_KEY must be set in .env');
    process.exit(1);
  }

  const email = emailArg || `${username}@example.local`;

  try {
    const hashed = await hashPassword(password);
    const encryptedEmail = encrypt(email);

    await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE SET
         password = EXCLUDED.password,
         email = EXCLUDED.email`,
      [username, encryptedEmail, hashed]
    );

    console.log('User saved:', username);
    await pool.end();
  } catch (err) {
    console.error(err);
    await pool.end();
    process.exit(1);
  }
}

main();
