const crypto = require('crypto');


const algorithm = 'aes-256-cbc';
const key = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest();
const iv = Buffer.alloc(16, 0);

exports.encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
};

exports.decrypt = (encrypted) => {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
};