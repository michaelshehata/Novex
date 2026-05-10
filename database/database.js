const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../.env') });


if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL missing');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;