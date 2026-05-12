'use strict';

// Set env vars inline — no .env file needed to run these tests
process.env.ENCRYPTION_KEY  = process.env.ENCRYPTION_KEY  || 'unit_test_encryption_key_32chars!!';
process.env.PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || 'unit_test_pepper_value';

const test   = require('node:test');
const assert = require('node:assert/strict');

const { hashPassword, verifyPassword } = require('../utils/hashPassword');
const { encrypt, decrypt }             = require('../utils/encryptDB');
const parsePostId                      = require('../utils/parsePostId');

// Use the same sanitise config as xssSanitiser.js directly — no import needed
const sanitizeHtml = require('sanitize-html');
const stripAllHtml = (value) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });


// ─── Suite 1: Password Hashing ────────────────────────────────────────────────

test('UT-01 hashPassword() output starts with $argon2id$', async () => {
    const hash = await hashPassword('TestPassword1');
    assert.ok(hash.startsWith('$argon2id$'), `Expected $argon2id$ prefix, got: ${hash.slice(0, 20)}`);
});

test('UT-02 Two calls with same password produce different hashes', async () => {
    const h1 = await hashPassword('SamePassword1');
    const h2 = await hashPassword('SamePassword1');
    assert.notEqual(h1, h2, 'Expected different hashes (different salt each time)');
});

test('UT-03 verifyPassword() returns true for correct password', async () => {
    const hash   = await hashPassword('CorrectPass1');
    const result = await verifyPassword(hash, 'CorrectPass1');
    assert.strictEqual(result, true);
});

test('UT-04 verifyPassword() returns false for wrong password', async () => {
    const hash   = await hashPassword('CorrectPass1');
    const result = await verifyPassword(hash, 'WrongPassword1');
    assert.strictEqual(result, false);
});

test('UT-05 Different pepper value produces different hash', async () => {
    const hashA = await hashPassword('PepperTest1');

    const original = process.env.PASSWORD_PEPPER;
    process.env.PASSWORD_PEPPER = 'completely_different_pepper';
    const hashB = await hashPassword('PepperTest1');
    process.env.PASSWORD_PEPPER = original;

    assert.notEqual(hashA, hashB, 'Expected different hashes with different peppers');
});

test('UT-06 verifyPassword() fails if wrong pepper is applied', async () => {
    const hashA = await hashPassword('PepperTest2');

    const original = process.env.PASSWORD_PEPPER;
    process.env.PASSWORD_PEPPER = 'wrong_pepper_for_test';
    const result = await verifyPassword(hashA, 'PepperTest2');
    process.env.PASSWORD_PEPPER = original;

    assert.strictEqual(result, false);
});


// ─── Suite 2: DB Encryption ──────────────────────────────────────────────────

test('UT-07 encrypt() returns a non-empty string', () => {
    const ct = encrypt('user@novex.example');
    assert.ok(typeof ct === 'string' && ct.length > 0);
});

test('UT-08 encrypt/decrypt round-trip gives back original value', () => {
    const plain = 'user@novex.example';
    assert.strictEqual(decrypt(encrypt(plain)), plain);
});

test('UT-09 Same plaintext encrypts to different ciphertext (random IV)', () => {
    const ct1 = encrypt('user@novex.example');
    const ct2 = encrypt('user@novex.example');
    assert.notEqual(ct1, ct2, 'Expected different ciphertext each time (random IV)');
});

test('UT-10 Ciphertext format is iv:payload with 32-char IV hex', () => {
    const ct    = encrypt('user@novex.example');
    const colon = ct.indexOf(':');
    assert.ok(colon > 0, 'Expected colon separator');
    assert.strictEqual(ct.slice(0, colon).length, 32, 'Expected 32-char IV hex');
});

test('UT-11 decrypt() throws on null / number input', () => {
    assert.throws(() => decrypt(null),  /Invalid ciphertext/);
    assert.throws(() => decrypt(12345), /Invalid ciphertext/);
});


// ─── Suite 3: XSS Sanitiser ──────────────────────────────────────────────────

test('UT-12 <script> tag is stripped completely', () => {
    assert.strictEqual(stripAllHtml('Hello<script>alert("xss")</script>'), 'Hello');
});

test('UT-13 <img onerror=...> is stripped', () => {
    assert.strictEqual(stripAllHtml('<img src=x onerror=alert(1)>'), '');
});

test('UT-14 <iframe> is stripped, plain text preserved', () => {
    assert.strictEqual(stripAllHtml('<iframe src="evil.com"></iframe>safe text'), 'safe text');
});

test('UT-15 Clean plain text passes through unchanged', () => {
    const input = 'Just a normal blog post.';
    assert.strictEqual(stripAllHtml(input), input);
});

test('UT-16 Nested tag injection is handled', () => {
    const output = stripAllHtml('<sc<script>ript>alert(1)</sc<script>ript>');
    assert.ok(!output.includes('<script>'), 'Expected no <script> in output');
});


// ─── Suite 4: Post ID Parser ─────────────────────────────────────────────────

test('UT-17 Returns integer 1 for "1"', () => {
    assert.strictEqual(parsePostId('1'), 1);
});

test('UT-18 Returns integer 999 for "999"', () => {
    assert.strictEqual(parsePostId('999'), 999);
});

test('UT-19 Returns null for float "1.5"', () => {
    assert.strictEqual(parsePostId('1.5'), null);
});

test('UT-20 Returns null for SQL injection "1 OR 1=1"', () => {
    assert.strictEqual(parsePostId('1 OR 1=1'), null);
});

test('UT-21 Returns null for empty string', () => {
    assert.strictEqual(parsePostId(''), null);
});

test('UT-22 Returns null for "abc"', () => {
    assert.strictEqual(parsePostId('abc'), null);
});

test('UT-23 Returns null for undefined', () => {
    assert.strictEqual(parsePostId(undefined), null);
});
