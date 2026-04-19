

const pool = require('../database/database');
const { hashPassword, verifyPassword } = require('../utils/hashing');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  const user = result.rows[0];

  const fakeHash = "$argon2id$v=19$m=65536,t=3,p=4$fakehash";

  const passwordToCheck = user ? user.password : fakeHash;

  const valid = await verifyPassword(passwordToCheck, password);

  if (!user || !valid) {
    return res.status(401).send("Invalid email or password");
  }

  req.session.userId = user.id;

  res.send("Login successful");
};