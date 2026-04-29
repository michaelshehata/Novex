const {doubleCsrf} = require('csrf-csrf');

// using session based CSRF 
const csrfProtection = doubleCsrf({
    cookie: false
});

module.exports = csrfProtection;