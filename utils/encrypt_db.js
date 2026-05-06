const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

function getKey() {
  if (!process.env.ENCRYPTION_KEY || String(process.env.ENCRYPTION_KEY).length < 8) {
    throw new Error('ENCRYPTION_KEY must be set to a sufficiently long secret');
  }
  return crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest();
}

const legacyZeroIv = Buffer.alloc(16, 0);

exports.encrypt = (text) => {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const enc = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  return `${iv.toString('hex')}:${enc}`;
};

exports.decrypt = (encrypted) => {
  const key = getKey();
  if (typeof encrypted !== 'string') {
    throw new Error('Invalid ciphertext');
  }
  const colon = encrypted.indexOf(':');
  if (colon <= 0) {
    const decipher = crypto.createDecipheriv(algorithm, key, legacyZeroIv);
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  }
  const ivHex = encrypted.slice(0, colon);
  const payload = encrypted.slice(colon + 1);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return decipher.update(payload, 'hex', 'utf8') + decipher.final('utf8');
};
