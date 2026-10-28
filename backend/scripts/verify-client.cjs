const assert = require('node:assert/strict');
const { PrismaClient } = require('../dist/generated/prisma/client.js');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Construction/import compatibility only: no connection, migration, fixture or seed.
const pool = new Pool();
const client = new PrismaClient({ adapter: new PrismaPg(pool) });
assert.equal(typeof client.$transaction, 'function');
client.$disconnect().then(
  () =>
    console.log('CommonJS PrismaClient / PrismaPg / pg construction PASS (no database connection)'),
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
