require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const path = require('path');

const app = express();
const port = 3000;


// Database
const pool = require('../database/database');


// Utilities
const { decrypt } = require('../utils/encrypt_db');


// Routes
const authRoutes = require('../authentication/authRoutes');
const postRoutes = require('../routes/postRoutes');


// Middleware
const loginLimiter = require('../middleware/rateLimiter');
const registerLimiter = loginLimiter.registerLimiter;
const csrfProtection = require('../middleware/csrfProtection');


// Helmet security headers + CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);


// Environment validation
if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET not set');
}

if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 8) {
    throw new Error('ENCRYPTION_KEY must be set to a sufficiently long secret');
}


// Session setup
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


// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Static files
app.use(express.static(path.join(__dirname, 'public')));



// Rate limiting
app.use('/auth/login', loginLimiter);
app.use('/auth/register', registerLimiter);



// CSRF protection
app.use(csrfProtection);



// CSRF token endpoint
app.get('/auth/csrf-token', (req, res) => {

    res.json({
        csrfToken: req.csrfToken()
    });
});



// API routes
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);



// Session endpoint
app.get('/api/session', async (req, res) => {

    if (!req.session.userId) {

        return res.json({
            loggedIn: false,
            userId: null,
            username: null
        });
    }

    try {

        const result = await pool.query(
            `
            SELECT id, username, email, totp_enabled
            FROM users
            WHERE id = $1
            `,
            [req.session.userId]
        );

        if (result.rows.length === 0) {

            return req.session.destroy(() => {

                res.clearCookie('sid', {
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production',
                });

                res.json({
                    loggedIn: false,
                    userId: null,
                    username: null
                });
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

    }

    catch (err) {

        console.error(err);

        res.sendStatus(500);
    }
});



// Logout
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



// Route protection middleware
function requireAuth(req, res, next) {

    if (!req.session.userId) {

        return res.redirect('/login');
    }

    next();
}



// HTML routing
const htmlDir = path.join(__dirname, 'public/html');

function serveHtml(filename) {

    return (req, res) => {

        res.sendFile(
            path.join(htmlDir, filename)
        );
    };
}



// Public pages
app.get(['/', '/index.html'], serveHtml('index.html'));

app.get(
    ['/login', '/login.html'],
    serveHtml('login.html')
);

app.get(
    ['/register', '/register.html'],
    serveHtml('register.html')
);

app.get(
    ['/posts-page', '/posts.html'],
    serveHtml('posts.html')
);



// Protected pages
app.get(
    ['/dashboard', '/dashboard.html'],
    requireAuth,
    serveHtml('dashboard.html')
);

app.get(
    ['/create_post', '/create_post.html'],
    requireAuth,
    serveHtml('create_post.html')
);

app.get(
    ['/my_posts', '/my_posts.html'],
    requireAuth,
    serveHtml('my_posts.html')
);

app.get(
    ['/settings', '/settings.html'],
    requireAuth,
    serveHtml('settings.html')
);



// CSRF error handling
app.use((err, req, res, next) => {

    if (err.code === 'EBADCSRFTOKEN') {

        return res.status(403).send('Forbidden');
    }

    console.error(err);

    res.sendStatus(500);
});



// 404 handler
app.use((req, res) => {

    res.status(404).send('Page not found');
});



app.listen(port, () => {

    console.log(`Server running on http://localhost:${port}`);
});