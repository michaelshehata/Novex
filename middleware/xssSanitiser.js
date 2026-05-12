const sanitizeHtml = require('sanitize-html');

const stripAllHtml = (value) =>
    sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
    });

module.exports = function xssSanitizer(req, res, next) {
    // Sanitize specific fields that might contain HTML
    if (req.body.title && typeof req.body.title === 'string') {
        req.body.title = stripAllHtml(req.body.title);
    }

    if (req.body.content && typeof req.body.content === 'string') {
        req.body.content = stripAllHtml(req.body.content);
    }

    // Sanitize other potentially dangerous fields
    if (req.body.description && typeof req.body.description === 'string') {
        req.body.description = stripAllHtml(req.body.description);
    }

    next();
};
