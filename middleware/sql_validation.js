async function sanitizeSQL(query) {
  if (typeof query !== "string") {
    throw new Error("Query must be a string. Try again.");
  }
}

module.exports = {
  sanitizeSQL,
};
