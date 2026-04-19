const express = require('express')
const pool = require('./database/database'); // database connection
const argon2 = require('argon2'); // for password hashing
const session = require('express-session'); // for session management
const crypto = require('crypto');

// Routes
const authRoutes = require('./authentication/authRoutes');
const postRoutes = require('./routes/postRoutes');

// Middleware
const rateLimiter = require('./middleware/rateLimiter');
const csrfProtection = require('./middleware/csrfProtection');

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
        secure: process.env.NODE_ENV === 'production'
    }
}));


// Core middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));


// Security middleware
// Rate limit login (prevents brute force + enumeration)
app.use('/auth/login', rateLimiter);

// CSRF protection (must come AFTER session)
app.use(csrfProtection);

// Routes
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);


// Basic routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

// Session check (used by frontend)
app.get('/api/session', (req, res) => {
    if (!req.session.userId) {
        return res.json({ loggedIn: false });
    }
    res.json({ loggedIn: true, userId: req.session.userId });
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.sendStatus(500);
        res.clearCookie('connect.sid');
        res.sendStatus(204);
    });
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});