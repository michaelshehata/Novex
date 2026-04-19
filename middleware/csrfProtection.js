const csrf = require('csurf');

// using session based CSRF 
const csrfProtection = csrf({
    cookie: false
});

module.exports = csrfProtection;