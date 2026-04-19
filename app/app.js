const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

// Routes
const authRoutes = require('../authentication/authRoutes');

// Middleware
const rateLimiter = require('../middleware/rateLimiter');
// const csrfProtection = require('../middleware/csrfProtection'); // TEMP disabled

const app = express();
const port = 3000;


// Session setup
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET not set (dev only)');
}

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
        sameSite: 'lax',
        secure: false // keep false for local testing
    }
}));


// Core middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));


// Security middleware
app.use('/auth/login', rateLimiter);

// app.use(csrfProtection); // enable later


// Routes
app.use('/auth', authRoutes);


// Basic routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});