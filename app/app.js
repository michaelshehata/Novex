require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');


// Database
const pool = require('../database/database');


// Routes
const authRoutes = require('../authentication/authRoutes');
const postRoutes = require('../routes/postRoutes');

// Middleware
const loginLimiter = require('../middleware/rateLimiter');
const registerLimiter = loginLimiter.registerLimiter;
const csrfProtection = require('../middleware/csrfProtection');

const app = express();
const port = 3000;

// Helmet security headers + CSP
// Allows cdnjs cloud flare to load font awesome from their cdn
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
        fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'data:'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// Utilities
const { decrypt } = require('../utils/encrypt_db');


// Session setup
if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET not set');
}

if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 8) {
    throw new Error('ENCRYPTION_KEY must be set to a sufficiently long secret');
}

if (!process.env.FAKE_HASH || String(process.env.FAKE_HASH).length < 10) {
    // Keep login timing and responses consistent for non-existent usernames.
    throw new Error('FAKE_HASH must be set (run: npm run generate-fake-hash)');
}

app.use(session({
    name: 'sid',
    secret: process.env.SESSION_SECRET,
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


app.use(cookieParser());

// Core middleware (body parsers before CSRF so tokens in JSON bodies are visible)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));


// Security middleware
app.use('/auth/login', loginLimiter);
app.use('/auth/register', registerLimiter);
app.use('/auth', csrfProtection);
app.use('/posts', csrfProtection);


// Routes
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);


app.get('/api/session', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ loggedIn: false, userId: null, username: null });
    }

    try {
        const result = await pool.query(
            'SELECT id, username, email, totp_enabled FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return req.session.destroy(() => {
                res.clearCookie('sid', {
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production',
                });
                res.json({ loggedIn: false, userId: null, username: null });
            });
        }

        const user = result.rows[0];

        res.json({
            loggedIn: true,
            userId: user.id,
            username: user.username,
            email: decrypt(user.email),
            totpEnabled: Boolean(user.totp_enabled),
        });

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});


app.post('/logout', csrfProtection, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }

        res.clearCookie('sid', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
        res.sendStatus(204);
    });
});


// Basic routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login.html'));
});

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.sendStatus(403);
    }

    console.error(err);
    res.sendStatus(500);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});