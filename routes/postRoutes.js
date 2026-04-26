const express = require('express');
const router = express.Router();

const pool = require('../database/database');
const requireAuth = require('../authentication/authMiddleware');
const xssSanitizer = require('../middleware/xssSanitizer');

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

// DELETE post (protected + ownership check)
router.delete('/:id', requireAuth, async (req, res) => {
    const postId = req.params.id;

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