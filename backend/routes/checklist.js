const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/checklist
router.get('/', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

    const result = await pool.query(
      `SELECT * FROM checklist_steps WHERE partner_id = $1 ORDER BY step_number ASC`,
      [partnerId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Get checklist error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/checklist/:stepId
router.put('/:stepId', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

    const stepId = parseInt(req.params.stepId);
    const { done } = req.body;

    const result = await pool.query(
      `UPDATE checklist_steps SET done = $1, updated_at = NOW()
       WHERE id = $2 AND partner_id = $3
       RETURNING *`,
      [done, stepId, partnerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Step not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Update checklist error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
