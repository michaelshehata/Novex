
const pool = require('../app/database/database');

pool
  .query('SELECT NOW() AS now, current_database() AS database')
  .then((res) => {
    console.log('Database connection OK:', res.rows[0]);
    return pool.end();
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
