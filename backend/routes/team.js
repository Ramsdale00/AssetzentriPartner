const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendMail } = require('../mailer');
const { notifyPartner } = require('../notify');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://partner.vistrivetech.com').replace(/\/$/, '');

// GET /api/team
router.get('/', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

    const result = await pool.query(
      `SELECT * FROM team_members WHERE partner_id = $1 ORDER BY created_at ASC`,
      [partnerId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Get team error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/team
router.post('/', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    const validRoles = ['Admin', 'Seller', 'Read-Only'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check for duplicate email in this partner's team
    const existing = await pool.query(
      'SELECT id FROM team_members WHERE partner_id = $1 AND email = $2',
      [partnerId, email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Team member with this email already exists' });
    }

    const result = await pool.query(
      `INSERT INTO team_members (partner_id, name, email, role, status)
       VALUES ($1, $2, $3, $4, 'Invited')
       RETURNING *`,
      [partnerId, name.trim(), email.toLowerCase().trim(), role]
    );

    const partnerResult = await pool.query('SELECT name FROM partners WHERE id = $1', [partnerId]);
    const partnerName = partnerResult.rows[0]?.name || 'your partner organisation';

    // Best-effort invite email (skipped gracefully if SendGrid isn't configured).
    const emailSent = await sendMail({
      to: email.toLowerCase().trim(),
      subject: `You've been invited to the AssetZentri Partner Portal`,
      text: `Hi ${name.trim()},\n\n${req.user.name} has invited you to join ${partnerName} on the AssetZentri Partner Portal as a ${role}.\n\nSign in to get started: ${FRONTEND_URL}/login\n\n— AssetZentri Partner Programme`,
      html: `<p>Hi ${name.trim()},</p><p><strong>${req.user.name}</strong> has invited you to join <strong>${partnerName}</strong> on the AssetZentri Partner Portal as a <strong>${role}</strong>.</p><p><a href="${FRONTEND_URL}/login">Sign in to get started →</a></p><p>— AssetZentri Partner Programme</p>`,
    });

    notifyPartner(partnerId, {
      title: `Team member invited`,
      body: `${name.trim()} (${role}) was invited to the team.`,
      link: '/team',
    });

    return res.status(201).json({ ...result.rows[0], email_sent: emailSent });
  } catch (err) {
    console.error('Invite team member error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/team/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

    const memberId = parseInt(req.params.id);

    // Check member exists and belongs to this partner
    const memberResult = await pool.query(
      'SELECT * FROM team_members WHERE id = $1 AND partner_id = $2',
      [memberId, partnerId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    if (memberResult.rows[0].role === 'Admin') {
      return res.status(403).json({ error: 'Cannot remove Admin members' });
    }

    await pool.query('DELETE FROM team_members WHERE id = $1', [memberId]);

    return res.json({ message: 'Team member removed' });
  } catch (err) {
    console.error('Remove team member error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
