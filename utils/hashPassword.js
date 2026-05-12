const argon2 = require('argon2');

function withPepper(password) {
  const pepper = process.env.PASSWORD_PEPPER;
  return pepper ? `${password}\0${pepper}` : password;
}

exports.hashPassword = async (password) => {
  return argon2.hash(withPepper(password), {
    type: argon2.argon2id,
  });
};

exports.verifyPassword = async (hash, password) => {
  return argon2.verify(hash, withPepper(password));
};
