'use strict';

const test = require('node:test');
const assert = require('node:assert');

process.env.ENCRYPTION_KEY =
    process.env.ENCRYPTION_KEY || 'unit_test_encryption_key_long_enough';
process.env.PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || '';

const { encrypt, decrypt } = require('../utils/encryptDB');
const { hashPassword, verifyPassword } = require('../utils/hashPassword');

test('Encryption/Decryption round-trip should successfully encode and decode email-shaped text', () => {
  console.log('=== Testing Encryption/Decryption Round-trip ===');
  const plain = 'participant1@example.local';
  console.log('Original plaintext:', plain);

  const ciphertext = encrypt(plain);
  console.log('Encrypted ciphertext:', ciphertext);

  assert.notStrictEqual(ciphertext, plain, 'Ciphertext should not be identical to plaintext');
  assert.match(ciphertext, /^[0-9a-f]+:[0-9a-f]+$/, 'Ciphertext should follow expected format (hex:hex)');

  const decrypted = decrypt(ciphertext);
  console.log('Decrypted text:', decrypted);

  assert.strictEqual(decrypted, plain, 'Decrypted text should match original plaintext');
  console.log('Encryption/Decryption test PASSED');
});

test('Password hashing should generate valid hash and correctly verify matching/incorrect passwords', async () => {
  console.log('\n=== Testing Password Hashing and Verification ===');
  const password = 'UnitTest1a';
  console.log('Original password:', password);

  const hash = await hashPassword(password);
  console.log('Generated hash:', hash);
  console.log('Hash length:', hash.length);

  assert.ok(typeof hash === 'string' && hash.length > 30, 'Hash should be a string longer than 30 characters');

  const verifyCorrect = await verifyPassword(hash, password);
  console.log('Verification of correct password:', verifyCorrect);
  assert.strictEqual(verifyCorrect, true, 'Should successfully verify correct password');

  const verifyWrong = await verifyPassword(hash, 'wrong-password');
  console.log('Verification of wrong password:', verifyWrong);
  assert.strictEqual(verifyWrong, false, 'Should reject incorrect password');

  console.log('Password hashing/verification test PASSED');
});
