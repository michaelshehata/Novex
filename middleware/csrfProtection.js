const csrf = require('csurf');

const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    },
    value: (req) => {
        return (
            req.body?._csrf ||
            req.headers['x-csrf-token'] ||
            req.headers['x-xsrf-token']
        );
    }
});

module.exports = csrfProtection;
