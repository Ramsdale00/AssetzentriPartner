const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// Fields a partner may edit on their own profile. tier/psm are admin-managed.
const EDITABLE_FIELDS = [
  'name',
  'website',
  'description',
  'country',
  'contact_name',
  'contact_email',
  'contact_phone',
  'logo_url',
  'territory_plan',
];

const SELECT_COLUMNS = `
  id, name, tier, country, psm, joined_date,
  contact_name, contact_email, contact_phone,
  logo_url, website, description, agreement_accepted_at, territory_plan
`;

// GET /api/profile — the current partner's company profile.
router.get('/', requireAuth, async (req, res) => {
  const partnerId = req.user.partner_id;
  if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

  try {
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM partners WHERE id = $1`,
      [partnerId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile — update any subset of editable fields.
router.put('/', requireAuth, async (req, res) => {
  const partnerId = req.user.partner_id;
  if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

  const updates = [];
  const values = [];
  let i = 1;
  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      const value = req.body[field];
      updates.push(`${field} = $${i++}`);
      // Normalise empty strings to NULL so cleared fields don't store "".
      values.push(typeof value === 'string' && value.trim() === '' ? null : value);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(partnerId);

  try {
    const result = await pool.query(
      `UPDATE partners SET ${updates.join(', ')} WHERE id = $${i} RETURNING ${SELECT_COLUMNS}`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/profile/accept-agreement — record agreement acceptance (once).
router.post('/accept-agreement', requireAuth, async (req, res) => {
  const partnerId = req.user.partner_id;
  if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

  try {
    const result = await pool.query(
      `UPDATE partners
       SET agreement_accepted_at = COALESCE(agreement_accepted_at, NOW())
       WHERE id = $1
       RETURNING agreement_accepted_at`,
      [partnerId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Accept agreement error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
