/**
 * Makes a fake Argon2id hash for FAKE_HASH (same pepper rules as real hashes used)
 * Run: npm run generate-fake-hash
 */

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { hashPassword } = require('../utils/hashing');

/**
 * Produce a deterministic fake Argon2id password hash for a fixed dummy password and print a `FAKE_HASH=<hash>` line to add to the project's .env file.
 *
 * The function computes the hash using the project's password-hashing rules and writes a short instruction and the resulting `FAKE_HASH` value to stdout.
 */
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
