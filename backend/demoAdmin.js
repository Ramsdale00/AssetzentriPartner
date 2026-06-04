// Hardcoded "demo" partner admin account.
//
// This account logs in directly (email + password → JWT) and bypasses the
// magic-link email flow, so you can sign in without waiting for an email.
// Credentials default to the values below but can be overridden via env. The
// account is (idempotently) ensured in the database on server startup so the
// rest of the app — /auth/me, partner-scoped data, etc. — works normally.
//
// Set DISABLE_DEMO_ADMIN=true to turn it off entirely (recommended if you don't
// need a password-only login in production).

const bcrypt = require('bcryptjs');
const pool = require('./db');

const ENABLED = process.env.DISABLE_DEMO_ADMIN !== 'true';
const EMAIL = (process.env.DEMO_ADMIN_EMAIL || 'partner-admin@assetzentri.com').toLowerCase().trim();
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'PartnerAdmin123!';
const NAME = process.env.DEMO_ADMIN_NAME || 'Demo Partner Admin';

// Ensure the demo admin exists and its password matches the configured one.
async function ensureDemoAdmin() {
  if (!ENABLED) return;

  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [EMAIL]);
    if (existing.rows.length > 0) {
      // Keep the password in sync with config so the hardcoded login always works.
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, EMAIL]);
      return;
    }

    // Attach to an existing partner (so the account has data to see); fall back
    // to a dedicated demo partner on an otherwise-empty database.
    let partnerId;
    const partner = await pool.query('SELECT id FROM partners ORDER BY created_at ASC LIMIT 1');
    if (partner.rows.length > 0) {
      partnerId = partner.rows[0].id;
    } else {
      partnerId = 'pdemo';
      await pool.query(
        `INSERT INTO partners (id, name, tier, country, joined_date, contact_name, contact_email, is_custom)
         VALUES ($1, 'Demo Partner', 'Bronze', 'United Kingdom', CURRENT_DATE, $2, $3, TRUE)
         ON CONFLICT (id) DO NOTHING`,
        [partnerId, NAME, EMAIL]
      );
    }

    await pool.query(
      `INSERT INTO users (email, password_hash, name, role, persona, partner_id)
       VALUES ($1, $2, $3, 'Partner Admin', 'partner', $4)
       ON CONFLICT (email) DO NOTHING`,
      [EMAIL, passwordHash, NAME, partnerId]
    );

    console.log(`Demo partner admin ready — email: ${EMAIL}`);
  } catch (err) {
    // Non-fatal: the server should still start even if bootstrapping fails.
    console.error('Could not ensure demo partner admin:', err.message);
  }
}

module.exports = { ensureDemoAdmin, DEMO_ADMIN_EMAIL: EMAIL, DEMO_ADMIN_ENABLED: ENABLED };
