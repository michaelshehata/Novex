const express = require('express')
const app = express();
const port = 3000;
const pool = require('./database/database'); // database connection
const argon2 = require('argon2'); // for password hashing
const session = require('express-session'); // for session management
const crypto = require('crypto');


const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET is not set; using ephemeral secret for this runtime only.');
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

var bodyParser = require('body-parser');
const fs = require('fs');

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Landing page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/html/login.html', (err) => {
        if (err){
            console.log(err);
        }
    })
});

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
            return res.json({ loggedIn: false, userId: null, username: null });
        }
        const row = result.rows[0];
        res.json({
            loggedIn: true,
            userId: row.id,
            username: row.username,
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
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true
        });
        res.sendStatus(204);
    });
});

// Single login route using DB (removed old hardcoded logic)
app.post('/', async function(req, res){

    const username = req.body.username_input;
    const password = req.body.password_input;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        // user not found
        if(result.rows.length === 0){
            return res.sendFile(__dirname + '/public/html/login.html');
        }

        const user = result.rows[0];

        // verify password
        const valid = await argon2.verify(user.password, password);

        if(!valid){
            return res.sendFile(__dirname + '/public/html/login.html');
        }

        // store session instead of global variable
        req.session.userId = user.id;

        res.sendFile(__dirname + '/public/html/index.html');

    } catch(err){
        console.error(err);
        res.sendStatus(500);
    }
});

// Make a post POST request
app.post('/makepost', function(req, res) {

    // Read in current posts (still using JSON for now)
    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    let curDate = new Date();
    curDate = curDate.toLocaleString("en-GB");

    let maxId = 0;
    for (let i = 0; i < posts.length; i++) {
        if (posts[i].postId > maxId) {
            maxId = posts[i].postId;
        }
    }

    let newId = 0;

    if(req.body.postId == "") {
        newId = maxId + 1;
    } else {
        newId = req.body.postId;
        let index = posts.findIndex(item => item.postId == newId);
        posts.splice(index, 1);
    }

    // TEMP FIX: use session instead of currentUser (to not break frontend but change later)
    posts.push({
        "username": req.session.userId || "anonymous", 
        "timestamp": curDate, 
        "postId": newId, 
        "title": req.body.title_field, 
        "content": req.body.content_field
    });

    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    res.sendFile(__dirname + "/public/html/my_posts.html");
 });

// Delete a post POST request
app.post('/deletepost', (req, res) => {

    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    let index = posts.findIndex(item => item.postId == req.body.postId);
    posts.splice(index, 1);

    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    res.sendFile(__dirname + "/public/html/my_posts.html");
 });

app.listen(port, () => {
    console.log(`My app listening on port ${port}!`)
});