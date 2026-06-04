const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// Notifications visible to the current user: those targeting their partner org,
// plus admin-wide notifications when they're an admin.
function scopeClause(user) {
  if (user.persona === 'admin') {
    return { where: `recipient_persona = 'admin'`, params: [] };
  }
  return { where: `recipient_partner_id = $1`, params: [user.partner_id] };
}

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const { where, params } = scopeClause(req.user);
    const result = await pool.query(
      `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT 50`,
      params
    );
    const unread = result.rows.filter((n) => !n.read).length;
    return res.json({ items: result.rows, unread });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, async (req, res) => {
  try {
    const { where, params } = scopeClause(req.user);
    await pool.query(`UPDATE notifications SET read = TRUE WHERE ${where}`, params);
    return res.json({ message: 'All marked read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const { where, params } = scopeClause(req.user);
    await pool.query(
      `UPDATE notifications SET read = TRUE WHERE id = $${params.length + 1} AND ${where}`,
      [...params, parseInt(req.params.id)]
    );
    return res.json({ message: 'Marked read' });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
