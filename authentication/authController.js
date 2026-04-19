const pool = require('../database/database');
const { hashPassword, verifyPassword } = require('../utils/hashing');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    const user = result.rows[0];

    // hash
    // Must be a well-formed Argon2 string so argon2.verify does not throw when user is missing.
    const fakeHash =
      '$argon2id$v=19$m=65536,t=3,p=4$shTWS1al2/pdjWQt5CyoYQ$ugMNX6llcTEOa2xTr/AyCjnjFU3KKS7fnhhsjfrpzD8';

    const passwordToCheck = user ? user.password : fakeHash;

    const valid = await verifyPassword(passwordToCheck, password);

    if (!user || !valid) {
      return res.status(401).send("Invalid email or password");
    }

    req.session.userId = user.id;

    res.send("Login successful");

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashed = await hashPassword(password);

    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2)",
      [email, hashed]
    );

    res.send("User registered");

  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};