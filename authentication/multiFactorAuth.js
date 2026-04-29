'use strict';

var authenticator = require('authenticator');

function generateMFASecret() {
    const formattedKey = authenticator.generateKey();
}

var formattedToken = authenticator.generateToken(formattedKey);


module.exports = {
    multiFactorAuth
}