// Bind host maintenance and libpq tools to the same server/database without exposing credentials.
const { execFileSync } = require('node:child_process');
const { URL } = require('node:url');
const { Pool } = require(
  require('node:path').join(process.env.OPS_APP_DIR, 'backend/node_modules/pg'),
);
const query =
  'SELECT json_build_array(current_database(),inet_server_addr()::text,inet_server_port())::text AS identity';
async function main() {
  const url = new URL(process.env.DATABASE_URL);
  if (
    process.argv[2] === 'isolated' &&
    (process.env.OPS_PROFILE !== 'test' ||
      process.env.OPS_ISOLATED !== 'yes' ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      !/^\/whistle_test_[a-z0-9_]+$/.test(url.pathname) ||
      url.search ||
      url.hash)
  )
    throw new Error();
  const pool = new Pool({ connectionString: url.toString() });
  try {
    const nodeIdentity = JSON.parse((await pool.query(query)).rows[0].identity);
    const libpqIdentity = JSON.parse(
      execFileSync('psql', ['-XAtv', 'ON_ERROR_STOP=1', '-c', query], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim(),
    );
    if (
      nodeIdentity[0] !== process.env.OPS_DB_NAME ||
      JSON.stringify(nodeIdentity) !== JSON.stringify(libpqIdentity)
    )
      throw new Error();
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  console.error('Operator and backup database targets must match the selected safe profile.');
  process.exitCode = 1;
});
