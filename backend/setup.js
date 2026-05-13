/**
 * AssetZentri — one-shot database setup
 * Run: npm run setup
 *
 * What it does:
 *  1. Reads DATABASE_URL from .env
 *  2. Drops and recreates all tables (schema.sql)
 *  3. Inserts all seed data (seed.sql)
 *  4. Re-hashes user passwords to match the demo credentials:
 *       alex@northwave-tech.com  →  "partner"
 *       ops@vistrive.com         →  "admin"
 */

require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set in .env');
  console.error('Copy .env.example to .env and fill in your PostgreSQL connection string.');
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected.\n');

    // ── 1. Schema ─────────────────────────────────────────────────────────────
    console.log('Creating tables...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Tables created.\n');

    // ── 2. Seed (only if the database is empty) ───────────────────────────────
    const { rows } = await client.query('SELECT COUNT(*) AS count FROM users');
    const alreadySeeded = parseInt(rows[0].count, 10) > 0;

    if (alreadySeeded) {
      console.log('Database already has data — skipping seed step.\n');
      console.log('Setup complete! Start the server with: npm start');
      return;
    }

    console.log('Seeding data...');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seed);
    console.log('Seed data inserted.\n');

    // ── 3. Fix demo passwords ─────────────────────────────────────────────────
    // The seed.sql ships with a placeholder hash. We regenerate the real ones
    // so the demo credentials from the login page work correctly.
    console.log('Setting demo passwords...');

    const demoUsers = [
      { email: 'alex@northwave-tech.com', password: 'partner' },
      { email: 'ops@vistrive.com',        password: 'admin'   },
    ];

    for (const u of demoUsers) {
      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hash, u.email]
      );
      console.log(`  ✓  ${u.email}  (password: "${u.password}")`);
    }

    console.log('\n──────────────────────────────────────────');
    console.log('Setup complete!');
    console.log('\nDemo credentials:');
    console.log('  Partner : alex@northwave-tech.com  /  partner');
    console.log('  Admin   : ops@vistrive.com          /  admin');
    console.log('\nStart the server with:  npm start');
    console.log('──────────────────────────────────────────');

  } catch (err) {
    console.error('\nSetup failed:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('→ PostgreSQL is not running, or the connection string is wrong.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
