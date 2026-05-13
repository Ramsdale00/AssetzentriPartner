const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');

function calcAnnualValue(devices, tier) {
  return devices * (tier === 'Premium' ? 8 : 4) * 12;
}

// GET /api/admin/deals
router.get('/deals', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, p.name as partner_name, p.tier as partner_tier
       FROM deals d
       LEFT JOIN partners p ON d.partner_id = p.id
       ORDER BY d.created_at DESC`
    );

    const deals = result.rows.map(d => ({
      ...d,
      annual_value: calcAnnualValue(d.devices, d.tier)
    }));

    return res.json(deals);
  } catch (err) {
    console.error('Admin get deals error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/partners
router.get('/partners', requireAdmin, async (req, res) => {
  try {
    const partnersResult = await pool.query(
      `SELECT p.*,
        COUNT(DISTINCT tm.id) as team_count,
        COUNT(DISTINCT CASE WHEN d.stage NOT IN ('Won','Lost') THEN d.id END) as active_deals,
        COALESCE(SUM(CASE WHEN d.stage NOT IN ('Won','Lost') THEN d.devices * (CASE WHEN d.tier = 'Premium' THEN 8 ELSE 4 END) * 12 END), 0) as pipeline_value,
        COALESCE(SUM(CASE WHEN d.stage IN ('Won','Lost') THEN d.devices * (CASE WHEN d.tier = 'Premium' THEN 8 ELSE 4 END) * 12 END), 0) as closed_value,
        COUNT(DISTINCT cs_done.id) as onboarding_done,
        COUNT(DISTINCT cs_all.id) as onboarding_total
       FROM partners p
       LEFT JOIN team_members tm ON tm.partner_id = p.id
       LEFT JOIN deals d ON d.partner_id = p.id
       LEFT JOIN checklist_steps cs_all ON cs_all.partner_id = p.id
       LEFT JOIN checklist_steps cs_done ON cs_done.partner_id = p.id AND cs_done.done = TRUE
       GROUP BY p.id
       ORDER BY p.created_at ASC`
    );

    return res.json(partnersResult.rows);
  } catch (err) {
    console.error('Admin get partners error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/partners
router.post('/partners', requireAdmin, async (req, res) => {
  try {
    const { id, name, tier, country, psm, contact_name, contact_email, contact_phone, team_members } = req.body;

    if (!name || !tier || !country) {
      return res.status(400).json({ error: 'Name, tier, and country are required' });
    }

    // Generate partner ID
    const partnerId = id || `p${Date.now()}`;

    const partnerResult = await pool.query(
      `INSERT INTO partners (id, name, tier, country, psm, joined_date, contact_name, contact_email, contact_phone, is_custom)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7, $8, TRUE)
       RETURNING *`,
      [partnerId, name, tier, country, psm || null, contact_name || null, contact_email || null, contact_phone || null]
    );

    const partner = partnerResult.rows[0];

    // Add default checklist steps
    const defaultSteps = [
      { num: 1, title: 'Complete company profile', desc: 'Fill in your company details, logo, and contact information in the partner profile section.' },
      { num: 2, title: 'Upload company logo', desc: 'Upload a high-resolution version of your company logo for co-branded materials.' },
      { num: 3, title: 'Accept Partner Agreement', desc: 'Review and digitally sign the AssetZentri Partner Programme Agreement.' },
      { num: 4, title: 'Add team members', desc: 'Invite your sales team to the partner portal so they can access resources and register deals.' },
      { num: 5, title: 'Watch product demo video', desc: 'Complete the 45-minute AssetZentri platform walkthrough to understand core features and positioning.' },
      { num: 6, title: 'Download and review sales kit', desc: 'Access the Sales Playbook, battlecards, and pricing guide from the Product Collaterals section.' },
      { num: 7, title: 'Pass partner knowledge check', desc: 'Complete the 20-question online assessment to demonstrate platform knowledge. Minimum score: 80%.' },
      { num: 8, title: 'Submit territory plan', desc: 'Submit your 90-day go-to-market plan including target verticals, pipeline targets, and key prospects.' }
    ];

    for (const step of defaultSteps) {
      await pool.query(
        `INSERT INTO checklist_steps (partner_id, step_number, title, description, done) VALUES ($1, $2, $3, $4, FALSE)`,
        [partnerId, step.num, step.title, step.desc]
      );
    }

    // Add team members if provided
    if (team_members && Array.isArray(team_members)) {
      for (const member of team_members) {
        if (member.name && member.email) {
          await pool.query(
            `INSERT INTO team_members (partner_id, name, email, role, status) VALUES ($1, $2, $3, $4, $5)`,
            [partnerId, member.name, member.email, member.role || 'Seller', member.status || 'Invited']
          );
        }
      }
    }

    return res.status(201).json(partner);
  } catch (err) {
    console.error('Admin create partner error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/partners/:id
router.get('/partners/:id', requireAdmin, async (req, res) => {
  try {
    const partnerId = req.params.id;

    const partnerResult = await pool.query('SELECT * FROM partners WHERE id = $1', [partnerId]);
    if (partnerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    const partner = partnerResult.rows[0];

    const dealsResult = await pool.query(
      `SELECT * FROM deals WHERE partner_id = $1 ORDER BY created_at DESC`,
      [partnerId]
    );

    const teamResult = await pool.query(
      `SELECT * FROM team_members WHERE partner_id = $1 ORDER BY created_at ASC`,
      [partnerId]
    );

    const checklistResult = await pool.query(
      `SELECT * FROM checklist_steps WHERE partner_id = $1 ORDER BY step_number ASC`,
      [partnerId]
    );

    const deals = dealsResult.rows.map(d => ({
      ...d,
      annual_value: calcAnnualValue(d.devices, d.tier)
    }));

    const activeDeals = deals.filter(d => !['Won', 'Lost'].includes(d.stage));
    const wonDeals = deals.filter(d => d.stage === 'Won');
    const pipelineValue = activeDeals.reduce((sum, d) => sum + d.annual_value, 0);
    const closedValue = wonDeals.reduce((sum, d) => sum + d.annual_value, 0);

    return res.json({
      ...partner,
      deals,
      team: teamResult.rows,
      checklist: checklistResult.rows,
      stats: {
        active_deals: activeDeals.length,
        pipeline_value: pipelineValue,
        closed_value: closedValue,
        team_count: teamResult.rows.length,
        onboarding_done: checklistResult.rows.filter(s => s.done).length,
        onboarding_total: checklistResult.rows.length
      }
    });
  } catch (err) {
    console.error('Admin get partner detail error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
