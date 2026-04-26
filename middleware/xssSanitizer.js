const sanitizeHtml = require('sanitize-html');

module.exports = function xssSanitizer(req, res, next) {
    if (req.body.title) {
        req.body.title = sanitizeHtml(req.body.title, {
            allowedTags: [],
            allowedAttributes: {}
        });
    }

    if (req.body.content) {
        req.body.content = sanitizeHtml(req.body.content, {
            allowedTags: ['b', 'i', 'p', 'a'],
            allowedAttributes: {
                a: ['href']
            }
        });
    }

    next();
};