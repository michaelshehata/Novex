/**
 * Insert or update a user with an Argon2id hash (same as app login)
 */

const argon2 = require('argon2');
const pool = require('../app/database/database');

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  if (!username || !password) {
    console.error('Usage: node scripts/seed-user.js <username> <password>');
    process.exit(1);
  }

  const hash = await argon2.hash(password);
  await pool.query(
    `INSERT INTO users (username, password)
     VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password`,
    [username, hash]
  );
  console.log('User saved:', username);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
