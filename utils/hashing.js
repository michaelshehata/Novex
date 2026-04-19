const argon2 = require('argon2');

exports.hashPassword = async (password) => {
  return await argon2.hash(password, {
    type: argon2.argon2id
  });
};

exports.verifyPassword = async (hash, password) => {
  return await argon2.verify(hash, password);
};