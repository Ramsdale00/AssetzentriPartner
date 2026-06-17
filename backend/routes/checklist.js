const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const OBJECTIVE_STEPS = new Set([1, 2, 3, 4, 8]);

function isNonEmpty(value) {
  return typeof value === 'string' ? value.trim().length > 0 : !!value;
}

async function syncObjectiveSteps(partnerId) {
  const [partnerResult, teamResult, checklistResult] = await Promise.all([
    pool.query(
      `SELECT name, country, contact_name, contact_email, logo_url, agreement_accepted_at, territory_plan, created_at
       FROM partners WHERE id = $1`,
      [partnerId]
    ),
    pool.query(
      'SELECT COUNT(*)::int AS count FROM team_members WHERE partner_id = $1',
      [partnerId]
    ),
    pool.query(
      `SELECT id, step_number, done, updated_at, acknowledged_at
       FROM checklist_steps
       WHERE partner_id = $1`,
      [partnerId]
    ),
  ]);

  if (partnerResult.rows.length === 0) {
    return;
  }

  const partner = partnerResult.rows[0];
  const teamCount = teamResult.rows[0]?.count || 0;
  const checklistByStep = new Map(
    checklistResult.rows.map((row) => [row.step_number, row])
  );

  // Steps 5/6/7 are acknowledgement-based in the current UX.
  // Require explicit acknowledgement events from this implementation.
  const hasAcknowledgementProof = (stepNumber) => {
    const step = checklistByStep.get(stepNumber);
    if (!step || !step.done || !step.acknowledged_at) return false;
    return true;
  };

  // Criteria-driven checklist state for all steps.
  const stepDone = {
    1: Boolean(
      isNonEmpty(partner.name) &&
      isNonEmpty(partner.country) &&
      isNonEmpty(partner.contact_name) &&
      isNonEmpty(partner.contact_email)
    ),
    2: isNonEmpty(partner.logo_url),
    3: !!partner.agreement_accepted_at,
    4: teamCount > 0,
    5: hasAcknowledgementProof(5),
    6: hasAcknowledgementProof(6),
    7: hasAcknowledgementProof(7),
    8: isNonEmpty(partner.territory_plan),
  };

  await Promise.all(
    Object.entries(stepDone).map(([stepNumber, done]) =>
      pool.query(
        `UPDATE checklist_steps
         SET done = $1, updated_at = NOW()
         WHERE partner_id = $2 AND step_number = $3`,
        [done, partnerId, Number(stepNumber)]
      )
    )
  );
}

// GET /api/checklist
router.get('/', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

    await syncObjectiveSteps(partnerId);

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

    const stepLookup = await pool.query(
      `SELECT id, step_number FROM checklist_steps WHERE id = $1 AND partner_id = $2`,
      [stepId, partnerId]
    );

    if (stepLookup.rows.length === 0) {
      return res.status(404).json({ error: 'Step not found' });
    }

    const stepNumber = stepLookup.rows[0].step_number;
    if (OBJECTIVE_STEPS.has(stepNumber)) {
      return res.status(409).json({
        error: 'This step is completed automatically when its required action is finished.',
      });
    }

    const isAcknowledgementStep = [5, 6, 7].includes(stepNumber);

    const result = await pool.query(
      `UPDATE checklist_steps
       SET done = $1,
           acknowledged_at = CASE
             WHEN $4 AND $1 = TRUE THEN NOW()
             WHEN $4 AND $1 = FALSE THEN NULL
             ELSE acknowledged_at
           END,
           updated_at = NOW()
       WHERE id = $2 AND partner_id = $3
       RETURNING *`,
      [done, stepId, partnerId, isAcknowledgementStep]
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
