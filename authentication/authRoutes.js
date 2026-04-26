// Handles authentication routes like login and registration. Also provides a route to get the CSRF token for forms.

const express = require('express');
const router = express.Router(); 

const authController = require('./authController');

router.get('/csrf-token', (req, res) => {
	res.json({ csrfToken: req.csrfToken() });
});

router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;