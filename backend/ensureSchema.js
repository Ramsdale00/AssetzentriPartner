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
  `ALTER TABLE partners ADD COLUMN IF NOT EXISTS knowledge_score INTEGER`,

  // Capture why a deal was won or lost (shown on the deal timeline).
  `ALTER TABLE deals ADD COLUMN IF NOT EXISTS close_reason TEXT`,

  // Richer collateral metadata for the library + real downloads.
  `ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS description TEXT`,
  `ALTER TABLE collateral_items ADD COLUMN IF NOT EXISTS version VARCHAR(20)`,

  // Per-deal stage history powers the visible deal timeline.
  `CREATE TABLE IF NOT EXISTS deal_stage_history (
     id SERIAL PRIMARY KEY,
     deal_id VARCHAR(20) REFERENCES deals(deal_id) ON DELETE CASCADE,
     from_stage VARCHAR(50),
     to_stage VARCHAR(50) NOT NULL,
     reason TEXT,
     note TEXT,
     actor VARCHAR(255),
     created_at TIMESTAMPTZ DEFAULT NOW()
   )`,

  // Lightweight in-app notifications. A notification targets either a single
  // partner org (recipient_partner_id) or all admins (recipient_persona='admin').
  `CREATE TABLE IF NOT EXISTS notifications (
     id SERIAL PRIMARY KEY,
     recipient_partner_id VARCHAR(10),
     recipient_persona VARCHAR(20),
     title VARCHAR(255) NOT NULL,
     body TEXT,
     link VARCHAR(255),
     read BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_partner ON notifications(recipient_partner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_persona ON notifications(recipient_persona)`,
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
