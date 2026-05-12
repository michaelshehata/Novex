function parsePostId(raw) {
    const n = Number.parseInt(raw, 10);
    return Number.isInteger(n) && String(n) === String(raw) ? n : null;
}

module.exports = parsePostId;
