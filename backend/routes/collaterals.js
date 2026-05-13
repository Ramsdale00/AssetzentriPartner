const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /api/collaterals
router.get('/', requireAuth, async (req, res) => {
  try {
    const foldersResult = await pool.query(
      `SELECT * FROM collateral_folders ORDER BY sort_order ASC`
    );

    const itemsResult = await pool.query(
      `SELECT * FROM collateral_items ORDER BY id ASC`
    );

    const folders = foldersResult.rows.map(folder => ({
      ...folder,
      items: itemsResult.rows.filter(item => item.folder_id === folder.id)
    }));

    return res.json(folders);
  } catch (err) {
    console.error('Get collaterals error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/collaterals/search?q=
router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json([]);

    const result = await pool.query(
      `SELECT ci.*, cf.name as folder_name
       FROM collateral_items ci
       LEFT JOIN collateral_folders cf ON ci.folder_id = cf.id
       WHERE ci.name ILIKE $1
       ORDER BY ci.id ASC`,
      [`%${q}%`]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Search collaterals error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
