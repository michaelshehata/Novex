const pool = require('../database/database');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log(res.rows);
  }
  pool.end();
});