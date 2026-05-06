const sanitizeHtml = require('sanitize-html');

const stripAllHtml = (value) =>
  sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  });

module.exports = function xssSanitizer(req, res, next) {
  if (req.body.title) {
    req.body.title = stripAllHtml(req.body.title);
  }

  if (req.body.content) {
    req.body.content = stripAllHtml(req.body.content);
  }

  next();
};
