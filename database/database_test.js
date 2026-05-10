const pool = require('./database');

async function testDB() {
  try {

    // Simple test query
    const result = await pool.query(
      'SELECT NOW()'
    );

    console.log('Database connected successfully.');
    console.log(result.rows);

  } catch (err) {
    console.error('Database connection failed:');
    console.error(err);

  } finally {
    await pool.end();
  }
}

testDB();