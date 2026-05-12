const express = require('express');
const router = express.Router();

const pool = require('../database/database');
const requireAuth = require('../auth/authMiddleware');
const xssSanitiser = require('../middleware/xssSanitiser');
const parsePostId = require('../utils/parsePostId');

router.get('/search', async (req, res) => {
    const q = req.query.q;

    if (typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).send('Missing or empty q');
    }

    const term = `%${q.trim()}%`;

    try {
        const result = await pool.query(
            `SELECT posts.*, users.username
             FROM posts
             LEFT JOIN users ON posts.user_id = users.id
             WHERE posts.title ILIKE $1 OR posts.content ILIKE $1
             ORDER BY posts.id DESC`,
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
        const result = await pool.query(
            `SELECT posts.*, users.username
             FROM posts
             LEFT JOIN users ON posts.user_id = users.id
             ORDER BY posts.id DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});
 
// GET single post by id (only owners can access))
router.get('/:id', requireAuth, async (req, res) => {
    const postId = parsePostId(req.params.id);

    if (postId === null) {
        return res.status(400).send('Invalid post id');
    }

    try {
        const result = await pool.query(
            'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
            [postId, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Post not found');
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// CREATE post (protected)
router.post('/', requireAuth, xssSanitiser, async (req, res) => {
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
router.put('/:id', requireAuth, xssSanitiser, async (req, res) => {
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
        // Fixed: Added explicit type conversion to ensure data type matching
        const result = await pool.query(
            "DELETE FROM posts WHERE id = $1 AND user_id = $2::integer",
            [postId, req.session.userId]
        );

        if (result.rowCount === 0) {
            return res.status(403).send("Not allowed");
        }

        res.send("Post deleted");
    } catch (err) {
        console.error('DELETE route error:', err);
        res.sendStatus(500);
    }
});

module.exports = router;
