const express = require('express');
const router = express.Router();

const pool = require('../database/database');
const requireAuth = require('../authentication/authMiddleware');
const xssSanitizer = require('../middleware/xssSanitizer');

function parsePostId(raw) {
    const n = Number.parseInt(raw, 10);
    return Number.isInteger(n) && String(n) === String(raw) ? n : null;
}

router.get('/search', async (req, res) => {
    const q = req.query.q;

    if (typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).send('Missing or empty q');
    }

    const term = `%${q.trim()}%`;

    try {
        const result = await pool.query(
            `SELECT * FROM posts
             WHERE title ILIKE $1 OR content ILIKE $1
             ORDER BY id DESC`,
            [term]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// GET all posts
router.get('/', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM posts ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// CREATE post (protected)
router.post('/', requireAuth, xssSanitizer, async (req, res) => {
    const { title, content } = req.body;

    if (typeof title !== 'string' || title.length === 0 || title.length > 200) {
        return res.status(400).send('Invalid title');
    }

    if (typeof content !== 'string' || content.length === 0 || content.length > 1000) {
        return res.status(400).send('Invalid content');
    }

    try {
        await pool.query(
            "INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3)",
            [title, content, req.session.userId]
        );

        res.status(201).send("Post created");
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// UPDATE post (protected + ownership check)
router.put('/:id', requireAuth, xssSanitizer, async (req, res) => {
    const postId = parsePostId(req.params.id);

    if (postId === null) {
        return res.status(400).send('Invalid post id');
    }

    const { title, content } = req.body;

    if (typeof title !== 'string' || title.length === 0 || title.length > 200) {
        return res.status(400).send('Invalid title');
    }

    if (typeof content !== 'string' || content.length === 0 || content.length > 1000) {
        return res.status(400).send('Invalid content');
    }

    try {
        const result = await pool.query(
            `UPDATE posts SET title = $1, content = $2 WHERE id = $3 AND user_id = $4`,
            [title, content, postId, req.session.userId]
        );

        if (result.rowCount === 0) {
            return res.status(403).send('Not allowed');
        }

        res.send('Post updated');
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// DELETE post (protected + ownership check)
router.delete('/:id', requireAuth, async (req, res) => {
    const postId = parsePostId(req.params.id);

    if (postId === null) {
        return res.status(400).send('Invalid post id');
    }

    try {
        const result = await pool.query(
            "DELETE FROM posts WHERE id = $1 AND user_id = $2",
            [postId, req.session.userId]
        );

        if (result.rowCount === 0) {
            return res.status(403).send("Not allowed");
        }

        res.send("Post deleted");
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;