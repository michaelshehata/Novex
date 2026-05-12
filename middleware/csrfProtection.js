const csrf = require('csurf');
const express = require('express');

// If you want to keep your current approach but avoid the vulnerable dependency:
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
