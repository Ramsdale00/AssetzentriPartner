const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

function calcAnnualValue(devices, tier) {
  return devices * (tier === 'Premium' ? 8 : 4) * 12;
}

function generateDealId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DR-${num}`;
}

// GET /api/deals
router.get('/', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

    const result = await pool.query(
      `SELECT * FROM deals WHERE partner_id = $1 ORDER BY created_at DESC`,
      [partnerId]
    );

    const deals = result.rows.map(d => ({
      ...d,
      annual_value: calcAnnualValue(d.devices, d.tier)
    }));

    return res.json(deals);
  } catch (err) {
    console.error('Get deals error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/deals
router.post('/', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

    const { company, country, contact, email, phone, devices, tier, close_date, source, notes } = req.body;

    if (!company || !devices || !tier) {
      return res.status(400).json({ error: 'Company, devices, and tier are required' });
    }

    // Generate unique deal ID
    let dealId;
    let attempts = 0;
    do {
      dealId = generateDealId();
      const existing = await pool.query('SELECT id FROM deals WHERE deal_id = $1', [dealId]);
      if (existing.rows.length === 0) break;
      attempts++;
    } while (attempts < 10);

    const result = await pool.query(
      `INSERT INTO deals (deal_id, partner_id, company, country, contact, email, phone, devices, tier, close_date, stage, source, notes, registered_date, protection_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Qualified', $11, $12, CURRENT_DATE, 90)
       RETURNING *`,
      [dealId, partnerId, company, country, contact, email, phone, parseInt(devices), tier, close_date || null, source || 'Direct', notes || null]
    );

    const deal = { ...result.rows[0], annual_value: calcAnnualValue(result.rows[0].devices, result.rows[0].tier) };
    return res.status(201).json(deal);
  } catch (err) {
    console.error('Create deal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/deals/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    const dealId = req.params.id;

    const dealResult = await pool.query(
      `SELECT d.*, p.name as partner_name FROM deals d
       LEFT JOIN partners p ON d.partner_id = p.id
       WHERE d.deal_id = $1`,
      [dealId]
    );

    if (dealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const deal = dealResult.rows[0];

    // Partners can only see their own deals
    if (req.user.persona === 'partner' && deal.partner_id !== partnerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const commentsResult = await pool.query(
      `SELECT * FROM deal_comments WHERE deal_id = $1 ORDER BY created_at ASC`,
      [dealId]
    );

    return res.json({
      ...deal,
      annual_value: calcAnnualValue(deal.devices, deal.tier),
      comments: commentsResult.rows
    });
  } catch (err) {
    console.error('Get deal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/deals/:id/stage
router.put('/:id/stage', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    const dealId = req.params.id;
    const { stage } = req.body;

    const validStages = ['Qualified', 'Demo', 'Proposal', 'Legal', 'Won', 'Lost'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const dealResult = await pool.query('SELECT * FROM deals WHERE deal_id = $1', [dealId]);
    if (dealResult.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });

    if (req.user.persona === 'partner' && dealResult.rows[0].partner_id !== partnerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `UPDATE deals SET stage = $1, updated_at = NOW() WHERE deal_id = $2 RETURNING *`,
      [stage, dealId]
    );

    return res.json({ ...result.rows[0], annual_value: calcAnnualValue(result.rows[0].devices, result.rows[0].tier) });
  } catch (err) {
    console.error('Update stage error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/deals/:id/comments
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    const dealId = req.params.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const dealResult = await pool.query('SELECT * FROM deals WHERE deal_id = $1', [dealId]);
    if (dealResult.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });

    if (req.user.persona === 'partner' && dealResult.rows[0].partner_id !== partnerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const author = req.user.name || 'You';
    const result = await pool.query(
      `INSERT INTO deal_comments (deal_id, author, text) VALUES ($1, $2, $3) RETURNING *`,
      [dealId, author, text.trim()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
