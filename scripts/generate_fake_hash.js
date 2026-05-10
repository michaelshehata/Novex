/**
 * Makes a fake Argon2id hash for FAKE_HASH (same pepper rules as real hashes used)
 * Run: npm run generate-fake-hash
 */

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { hashPassword } = require('../utils/hashing');

async function main() {
  const dummy = '__novex_fake_user_password_never_used__';
  const hash = await hashPassword(dummy);
  console.log('Add this line to your .env file:\n');
  console.log(`FAKE_HASH=${hash}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
