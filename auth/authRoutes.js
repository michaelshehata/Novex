// Handles auth routes like login and registration. Also provides a route to get the CSRF token for forms.

const express = require('express');
const router = express.Router();

const authController = require('./authController');
const mfaController = require('../middleware/mfaController');
const requireAuth = require('./authMiddleware');

router.get('/csrf-token', (req, res) => {
	res.json({ csrfToken: req.csrfToken() });
});

router.post('/login', authController.login);
router.post('/register', authController.register);

router.post('/mfa/setup', requireAuth, mfaController.beginTotpSetup);
router.post('/mfa/confirm', requireAuth, mfaController.confirmTotpSetup);
router.post('/mfa/disable', requireAuth, mfaController.disableTotp);

module.exports = router;