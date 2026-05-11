const csrf = require('csurf');

module.exports = csrf({
    cookie: false,

    value: (req) => {
        return (
            req.body?._csrf ||
            req.headers['x-csrf-token']
        );
    }
});