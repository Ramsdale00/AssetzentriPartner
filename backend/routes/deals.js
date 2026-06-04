const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { notifyAdmins, notifyPartner } = require('../notify');

function calcAnnualValue(devices, tier) {
  return devices * (tier === 'Premium' ? 8 : 4) * 12;
}

function generateDealId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DR-${num}`;
}

async function recordStageChange(dealId, fromStage, toStage, { reason, note, actor } = {}) {
  try {
    await pool.query(
      `INSERT INTO deal_stage_history (deal_id, from_stage, to_stage, reason, note, actor)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [dealId, fromStage || null, toStage, reason || null, note || null, actor || null]
    );
  } catch (err) {
    console.error('recordStageChange error:', err.message);
  }
}

// Fields a partner may edit on an existing deal.
const EDITABLE_DEAL_FIELDS = ['company', 'country', 'contact', 'email', 'phone', 'devices', 'tier', 'close_date', 'source', 'notes'];

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

    // New registrations start as 'Registered' (pending admin approval).
    const result = await pool.query(
      `INSERT INTO deals (deal_id, partner_id, company, country, contact, email, phone, devices, tier, close_date, stage, source, notes, registered_date, protection_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Registered', $11, $12, CURRENT_DATE, 90)
       RETURNING *`,
      [dealId, partnerId, company, country, contact, email, phone, parseInt(devices), tier, close_date || null, source || 'Direct', notes || null]
    );

    const created = result.rows[0];
    await recordStageChange(created.deal_id, null, 'Registered', { actor: req.user.name, note: 'Deal registered' });
    notifyAdmins({
      title: `New deal registered: ${created.company}`,
      body: `${req.user.name} registered ${created.deal_id} — awaiting approval.`,
      link: '/admin/deals',
    });

    const deal = { ...created, annual_value: calcAnnualValue(created.devices, created.tier) };
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

    const historyResult = await pool.query(
      `SELECT * FROM deal_stage_history WHERE deal_id = $1 ORDER BY created_at ASC`,
      [dealId]
    );

    return res.json({
      ...deal,
      annual_value: calcAnnualValue(deal.devices, deal.tier),
      comments: commentsResult.rows,
      stage_history: historyResult.rows
    });
  } catch (err) {
    console.error('Get deal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/deals/:id — edit an existing deal's details.
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    const dealId = req.params.id;

    const dealResult = await pool.query('SELECT * FROM deals WHERE deal_id = $1', [dealId]);
    if (dealResult.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });

    if (req.user.persona === 'partner' && dealResult.rows[0].partner_id !== partnerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = [];
    const values = [];
    let i = 1;
    for (const field of EDITABLE_DEAL_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        let value = req.body[field];
        if (field === 'devices') value = parseInt(value) || 0;
        if (field === 'tier' && !['Standard', 'Premium'].includes(value)) {
          return res.status(400).json({ error: 'Invalid tier' });
        }
        updates.push(`${field} = $${i++}`);
        values.push(typeof value === 'string' && value.trim() === '' ? null : value);
      }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    updates.push(`updated_at = NOW()`);
    values.push(dealId);

    const result = await pool.query(
      `UPDATE deals SET ${updates.join(', ')} WHERE deal_id = $${i} RETURNING *`,
      values
    );

    return res.json({ ...result.rows[0], annual_value: calcAnnualValue(result.rows[0].devices, result.rows[0].tier) });
  } catch (err) {
    console.error('Update deal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/deals/:id/stage
router.put('/:id/stage', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    const dealId = req.params.id;
    const { stage, reason, note } = req.body;

    const validStages = ['Qualified', 'Demo', 'Proposal', 'Legal', 'Won', 'Lost'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const dealResult = await pool.query('SELECT * FROM deals WHERE deal_id = $1', [dealId]);
    if (dealResult.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });

    const existing = dealResult.rows[0];
    if (req.user.persona === 'partner' && existing.partner_id !== partnerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Registration approval: a pending ('Registered') deal must be approved by an
    // admin before it can be advanced. Partners can't self-advance it.
    if (req.user.persona === 'partner' && existing.stage === 'Registered') {
      return res.status(403).json({ error: 'This deal is pending admin approval and cannot be advanced yet.' });
    }

    // Capture a close reason when moving to Won/Lost.
    const isClosing = stage === 'Won' || stage === 'Lost';
    const closeReason = isClosing ? (reason || null) : existing.close_reason;

    const result = await pool.query(
      `UPDATE deals SET stage = $1, close_reason = $2, updated_at = NOW() WHERE deal_id = $3 RETURNING *`,
      [stage, closeReason, dealId]
    );

    if (existing.stage !== stage) {
      await recordStageChange(dealId, existing.stage, stage, { reason, note, actor: req.user.name });
      // Notify the other side of the relationship.
      if (req.user.persona === 'admin') {
        notifyPartner(existing.partner_id, {
          title: `Deal ${dealId} moved to ${stage}`,
          body: `${existing.company} is now at the ${stage} stage.`,
          link: `/leads/${dealId}`,
        });
      } else {
        notifyAdmins({
          title: `Deal ${dealId} moved to ${stage}`,
          body: `${req.user.name} moved ${existing.company} to ${stage}.`,
          link: '/admin/deals',
        });
      }
    }

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

    const deal = dealResult.rows[0];
    if (req.user.persona === 'admin') {
      notifyPartner(deal.partner_id, {
        title: `New note on ${dealId}`,
        body: `${author} commented on ${deal.company}.`,
        link: `/leads/${dealId}`,
      });
    } else {
      notifyAdmins({
        title: `New note on ${dealId}`,
        body: `${author} commented on ${deal.company}.`,
        link: '/admin/deals',
      });
    }

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
