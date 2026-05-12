// Limits repeated requests per IP on sensitive endpoints

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Too many login attempts. Try again later.',
    standardHeaders: true, // return rate limit info 
    legacyHeaders: false, // clean response
});

const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Too many registration attempts. Try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = loginLimiter;
module.exports.loginLimiter = loginLimiter;
module.exports.registerLimiter = registerLimiter;