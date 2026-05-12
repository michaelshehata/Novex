// Checks if a session exists and user id is stored, if not blocks access 

module.exports = function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};


// for report:
// session security + access control