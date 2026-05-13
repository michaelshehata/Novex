'use strict';

const test = require('node:test');
const assert = require('node:assert');

const pool = require('../database/database');

test('Database should connect and execute a query successfully', async () => {
  const result = await pool.query('SELECT NOW()');

  // Ensure rows are returned
  assert.ok(result.rows.length > 0, 'Query should return at least one row');

  // Ensure each row is an object
  assert.strictEqual(typeof result.rows[0], 'object', 'Rows should be objects');

  console.log('Database connected successfully.');
  console.log(result.rows);
});

test('Database query should return exactly one row for SELECT NOW()', async () => {
  const result = await pool.query('SELECT NOW()');

  // Confirm exactly one row returned for SELECT NOW()
  assert.strictEqual(result.rowCount, 1, 'Expected one row from NOW() query');
});

test('Database should throw an error when attempting to query a closed connection', async () => {
  let errorThrown = false;

  try {
    await pool.end();
    // Attempting to query a closed pool should fail
    const result = await pool.query('SELECT NOW()');
    assert.fail('Expected query to throw on closed connection');
  } catch (err) {
    console.log('Error type:', typeof err);
    console.log('Error message:', err.message || 'No message');


    errorThrown = true;
    // Check that the error message contains the expected text
    assert.ok(err.message && err.message.includes('Cannot use a pool after calling end on the pool'), 'Error should include proper termination message');
  }

  assert.ok(errorThrown, 'Expected error to be thrown when querying a closed pool');
});
