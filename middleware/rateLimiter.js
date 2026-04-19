// To limit the number of requests to the login endpoint

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per window
    message: "Too many login attempts. Try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = loginLimiter;