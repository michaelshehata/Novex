// Limits repeated requests per IP on sensitive endpoints

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts. Try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15,
    message: 'Too many registration attempts. Try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = loginLimiter;
module.exports.loginLimiter = loginLimiter;
module.exports.registerLimiter = registerLimiter;