// Idempotent schema migrations run on startup.
//
// schema.sql uses CREATE TABLE IF NOT EXISTS, which won't add new columns to an
// already-existing table. These ADD COLUMN IF NOT EXISTS statements bring older
// databases up to date (e.g. the partner-profile fields used by onboarding).

const pool = require('./db');

const STATEMENTS = [
  `ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url TEXT`,
  `ALTER TABLE partners ADD COLUMN IF NOT EXISTS website VARCHAR(255)`,
  `ALTER TABLE partners ADD COLUMN IF NOT EXISTS description TEXT`,
  `ALTER TABLE partners ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ`,
  `ALTER TABLE partners ADD COLUMN IF NOT EXISTS territory_plan TEXT`,
];

async function ensureSchema() {
  for (const sql of STATEMENTS) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.error('ensureSchema:', err.message);
    }
  }
}

module.exports = { ensureSchema };
