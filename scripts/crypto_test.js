'use strict';

const test = require('node:test');
const assert = require('node:assert');

process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'unit_test_encryption_key_long_enough';
process.env.PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || '';


const { encrypt, decrypt } = require('../utils/encrypt_db');
const { hashPassword, verifyPassword } = require('../utils/hashing');

test('encrypt / decrypt round-trip for email-shaped text', () => {
  const plain = 'participant1@example.local';
  const ciphertext = encrypt(plain);
  assert.notStrictEqual(ciphertext, plain);
  assert.match(ciphertext, /^[0-9a-f]+:[0-9a-f]+$/);
  assert.strictEqual(decrypt(ciphertext), plain);
});



test('Argon2id hash verifies same password; rejects wrong password', async () => {
  const password = 'UnitTest1a';
  const hash = await hashPassword(password);
  assert.ok(typeof hash === 'string' && hash.length > 30);
  assert.strictEqual(await verifyPassword(hash, password), true);
  assert.strictEqual(await verifyPassword(hash, 'wrong-password'), false);
});
