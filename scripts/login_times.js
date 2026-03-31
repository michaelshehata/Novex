/**
 * Measure HTTP response times for POST / (login form) for account enumeration.

 *   npm run measure-login -- --runs 25 not_a_user x

 */

const DEFAULT_RUNS = 15;
const BASE_URL = process.env.LOGIN_URL || 'http://127.0.0.1:3000/';

function parseArgs() {
  const args = process.argv.slice(2);
  let runs = DEFAULT_RUNS;
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--runs' && args[i + 1]) {
      runs = Math.max(1, parseInt(args[i + 1], 10) || DEFAULT_RUNS);
      i++;
    } else {
      rest.push(args[i]);
    }
  }
  if (rest.length < 2) {
    console.error(
      'Usage: node scripts/login_times.js [--runs N] <username> <password>'
    );
    console.error(`Default URL: ${BASE_URL} (override with LOGIN_URL=...)`);
    process.exit(1);
  }
  return { runs, username: rest[0], password: rest[1] };
}

async function postLogin(username, password) {
  const body = new URLSearchParams({
    username_input: username,
    password_input: password,
  });
  const t0 = performance.now();
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    redirect: 'manual',
  });
  const ms = performance.now() - t0;
  return { ms, status: res.status };
}

function stats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / times.length,
    median,
  };
}

async function main() {
  const { runs, username, password } = parseArgs();
  console.log(`POST ${BASE_URL}`);
  console.log(`Runs: ${runs} | username: ${JSON.stringify(username)}`);
  const times = [];
  const statuses = new Map();
  for (let i = 0; i < runs; i++) {
    const { ms, status } = await postLogin(username, password);
    times.push(ms);
    statuses.set(status, (statuses.get(status) || 0) + 1);
    console.log(`  #${i + 1}: ${ms.toFixed(2)} ms (HTTP ${status})`);
  }
  const s = stats(times);
  console.log('\nSummary (ms):');
  console.log(`  min: ${s.min.toFixed(2)}`);
  console.log(`  max: ${s.max.toFixed(2)}`);
  console.log(`  avg: ${s.avg.toFixed(2)}`);
  console.log(`  median: ${s.median.toFixed(2)}`);
  console.log('  status counts:', Object.fromEntries(statuses));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
