require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const pool = require('../database/database');


// Routes
const authRoutes = require('../authentication/authRoutes');

// Middleware
const rateLimiter = require('../middleware/rateLimiter');
const csrfProtection = require('../middleware/csrfProtection');

const app = express();
const port = 3000;


// Session setup
const sessionSecret = process.env.SESSION_SECRET 

if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET key not set');
}

app.use(session({
    name: 'sid', 
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true, // session expires after request inactivity not time
    cookie: {
        httpOnly: true, // prevents client side JS from accessing the cookie (xss prevention)
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
app.use(csrfProtection);


// Routes
app.use('/auth', authRoutes);


app.get('/api/session', async (req, res) => {
    if (!req.session.userId) {
        return res.json({ loggedIn: false, userId: null, username: null });
    }

    try {
        const result = await pool.query(
            'SELECT id, username FROM users WHERE id = $1',
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return req.session.destroy(() => {
                res.clearCookie('connect.sid', {
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: false,
                });
                res.json({ loggedIn: false, userId: null, username: null });
            });
        }

        const user = result.rows[0];
        res.json({
            loggedIn: true,
            userId: user.id,
            username: user.username,
        });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});



app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.sendStatus(500);
        }

        res.clearCookie('connect.sid', {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
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