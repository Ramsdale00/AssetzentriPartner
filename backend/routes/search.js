const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/search?q=
router.get('/', requireAuth, async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ deals: [], collaterals: [] });

    const partnerId = req.user.partner_id;
    const isAdmin = req.user.persona === 'admin';

    let dealsResult;
    if (isAdmin) {
      dealsResult = await pool.query(
        `SELECT d.*, p.name as partner_name FROM deals d
         LEFT JOIN partners p ON d.partner_id = p.id
         WHERE d.company ILIKE $1 OR d.deal_id ILIKE $1
         ORDER BY d.created_at DESC LIMIT 10`,
        [`%${q}%`]
      );
    } else {
      dealsResult = await pool.query(
        `SELECT * FROM deals
         WHERE partner_id = $1 AND (company ILIKE $2 OR deal_id ILIKE $2)
         ORDER BY created_at DESC LIMIT 10`,
        [partnerId, `%${q}%`]
      );
    }

    const collateralsResult = await pool.query(
      `SELECT ci.*, cf.name as folder_name
       FROM collateral_items ci
       LEFT JOIN collateral_folders cf ON ci.folder_id = cf.id
       WHERE ci.name ILIKE $1
       ORDER BY ci.id ASC LIMIT 10`,
      [`%${q}%`]
    );

    return res.json({
      deals: dealsResult.rows,
      collaterals: collateralsResult.rows
    });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
