// In-app notification helper. Notifications target either one partner org
// (partnerId) or all admins (persona: 'admin'). Failures are swallowed so a
// notification never blocks the primary action that triggered it.
const pool = require('./db');

async function notifyPartner(partnerId, { title, body, link } = {}) {
  if (!partnerId || !title) return;
  try {
    await pool.query(
      `INSERT INTO notifications (recipient_partner_id, title, body, link) VALUES ($1, $2, $3, $4)`,
      [partnerId, title, body || null, link || null]
    );
  } catch (err) {
    console.error('notifyPartner error:', err.message);
  }
}

async function notifyAdmins({ title, body, link } = {}) {
  if (!title) return;
  try {
    await pool.query(
      `INSERT INTO notifications (recipient_persona, title, body, link) VALUES ('admin', $1, $2, $3)`,
      [title, body || null, link || null]
    );
  } catch (err) {
    console.error('notifyAdmins error:', err.message);
  }
}

module.exports = { notifyPartner, notifyAdmins };
