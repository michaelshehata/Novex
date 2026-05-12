const csrf = require('csurf');

const csrfProtection = csrf({
    cookie: false,
    value: (req) => {
        return (
            req.body?._csrf ||
            req.headers['x-csrf-token']
        );
    }
});

module.exports = csrfProtection;
