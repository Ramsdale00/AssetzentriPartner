const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

// Configure SendGrid
sgMail.setApiKey(process.env.DEV_SENDGRID_API_KEY);

const FROM_EMAIL = process.env.DEV_FROM_EMAIL || 'noreply@zentri.cloud';
const FROM_NAME  = process.env.DEV_FROM_NAME  || 'Zentri Cloud';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://partner.vistrivetech.com').replace(/\/$/, '');

// ─── Helper: send magic link email via SendGrid ───────────────────────────────
async function sendMagicLinkEmail(toEmail, toName, token) {
  const link = `${FRONTEND_URL}/verify?token=${token}`;

  const msg = {
    to: toEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: 'Your AssetZentri sign-in link',
    text: `Hi ${toName},\n\nClick the link below to sign in to your AssetZentri Partner Portal. This link expires in 15 minutes and can only be used once.\n\n${link}\n\nIf you did not request this, you can safely ignore this email.\n\n— Zentri Cloud`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0f0f0f;padding:28px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#c9a96e;border-radius:8px;width:36px;height:36px;text-align:center;vertical-align:middle;color:#0f0f0f;font-weight:700;font-size:14px;letter-spacing:0.02em;">AZ</td>
                  <td style="padding-left:12px;">
                    <div style="color:#ffffff;font-size:16px;font-weight:600;">AssetZentri</div>
                    <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">Partner Portal</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#111;">Sign in to your portal</p>
              <p style="margin:0 0 28px;font-size:14px;color:#666;line-height:1.6;">
                Hi ${toName}, click the button below to securely sign in. This link expires in <strong>15 minutes</strong> and is single-use.
              </p>

              <a href="${link}"
                 style="display:inline-block;background:#c9a96e;color:#0f0f0f;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:8px;letter-spacing:0.01em;">
                Sign in to AssetZentri →
              </a>

              <p style="margin:28px 0 0;font-size:12px;color:#999;line-height:1.6;">
                Or copy this link into your browser:<br/>
                <a href="${link}" style="color:#c9a96e;word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:11px;color:#bbb;line-height:1.6;">
                If you didn't request this email, you can safely ignore it — your account remains secure.<br/>
                Sent by ${FROM_NAME} &bull; noreply@zentri.cloud
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  };

  await sgMail.send(msg);
}

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
// Validates email + password, then sends a magic link instead of returning a JWT.
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Credentials are valid — generate a one-time magic link token
    const rawToken = crypto.randomBytes(48).toString('hex'); // 96-char hex string
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Remove any existing unused tokens for this user (keep DB clean)
    await pool.query(
      'DELETE FROM magic_link_tokens WHERE user_id = $1 AND used = FALSE',
      [user.id]
    );

    // Store the new token
    await pool.query(
      'INSERT INTO magic_link_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, rawToken, expiresAt]
    );

    // Send the magic link email
    await sendMagicLinkEmail(user.email, user.name, rawToken);

    return res.json({ message: 'Check your email — a sign-in link has been sent.' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/signup ─────────────────────────────────────────────────────
// Self-service partner registration. Creates a partner organisation plus its
// first Partner Admin user, seeds the default onboarding checklist, then sends
// a magic link so the new user signs in through the same secure flow.
const DEFAULT_CHECKLIST_STEPS = [
  { num: 1, title: 'Complete company profile', desc: 'Fill in your company details, logo, and contact information in the partner profile section.' },
  { num: 2, title: 'Upload company logo', desc: 'Upload a high-resolution version of your company logo for co-branded materials.' },
  { num: 3, title: 'Accept Partner Agreement', desc: 'Review and digitally sign the AssetZentri Partner Programme Agreement.' },
  { num: 4, title: 'Add team members', desc: 'Invite your sales team to the partner portal so they can access resources and register deals.' },
  { num: 5, title: 'Watch product demo video', desc: 'Complete the 45-minute AssetZentri platform walkthrough to understand core features and positioning.' },
  { num: 6, title: 'Download and review sales kit', desc: 'Access the Sales Playbook, battlecards, and pricing guide from the Product Collaterals section.' },
  { num: 7, title: 'Pass partner knowledge check', desc: 'Complete the 20-question online assessment to demonstrate platform knowledge. Minimum score: 80%.' },
  { num: 8, title: 'Submit territory plan', desc: 'Submit your 90-day go-to-market plan including target verticals, pipeline targets, and key prospects.' },
];

router.post('/signup', async (req, res) => {
  const { name, email, password, company, country } = req.body;

  if (!name || !email || !password || !company || !country) {
    return res.status(400).json({ error: 'Name, email, password, company, and country are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const clientConn = await pool.connect();
  try {
    // Reject duplicate accounts up front.
    const existing = await clientConn.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }

    await clientConn.query('BEGIN');

    // Generate a unique partner id that fits VARCHAR(10): "p" + 9 hex chars.
    const partnerId = `p${crypto.randomBytes(5).toString('hex').slice(0, 9)}`;

    await clientConn.query(
      `INSERT INTO partners (id, name, tier, country, joined_date, contact_name, contact_email, is_custom)
       VALUES ($1, $2, 'Bronze', $3, CURRENT_DATE, $4, $5, TRUE)`,
      [partnerId, company.trim(), country.trim(), name.trim(), normalizedEmail]
    );

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await clientConn.query(
      `INSERT INTO users (email, password_hash, name, role, persona, partner_id)
       VALUES ($1, $2, $3, 'Partner Admin', 'partner', $4)
       RETURNING id, name, email`,
      [normalizedEmail, passwordHash, name.trim(), partnerId]
    );
    const newUser = userResult.rows[0];

    // Seed the default onboarding checklist for the new partner.
    for (const step of DEFAULT_CHECKLIST_STEPS) {
      await clientConn.query(
        `INSERT INTO checklist_steps (partner_id, step_number, title, description, done) VALUES ($1, $2, $3, $4, FALSE)`,
        [partnerId, step.num, step.title, step.desc]
      );
    }

    // Issue a session immediately. The account was just created with a
    // password the user chose in this same request, so we log them straight in
    // rather than emailing a separate magic link (which is brittle — e.g. the
    // /login cleanup can delete a freshly-issued unused token) and forcing a
    // second round-trip through their inbox.
    const sessionPayload = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: 'Partner Admin',
      persona: 'partner',
      partner_id: partnerId,
    };

    await clientConn.query('COMMIT');

    const jwtToken = jwt.sign(sessionPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({ token: jwtToken, user: sessionPayload });
  } catch (err) {
    await clientConn.query('ROLLBACK').catch(() => {});
    // Unique-violation safety net in case of a race between the check and insert.
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    clientConn.release();
  }
});

// ─── POST /api/auth/verify-magic-link ─────────────────────────────────────────
// Validates the token from the email link and returns a JWT session.
router.post('/verify-magic-link', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Atomically claim the token: flip used → TRUE only if it is currently
    // unused and unexpired, all in a single statement. This closes the race
    // where two near-simultaneous requests (e.g. a double-fired client) could
    // both pass a separate "is it used?" check and each be issued a session.
    // Only the request that actually flips the row gets a row back.
    const claim = await pool.query(
      `UPDATE magic_link_tokens
       SET used = TRUE
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()
       RETURNING user_id`,
      [token]
    );

    if (claim.rows.length === 0) {
      // The claim failed — figure out why so we can return a helpful message.
      const existing = await pool.query(
        'SELECT used, expires_at FROM magic_link_tokens WHERE token = $1',
        [token]
      );

      if (existing.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired link. Please sign in again.' });
      }
      if (existing.rows[0].used) {
        return res.status(401).json({ error: 'This link has already been used. Please sign in again.' });
      }
      return res.status(401).json({ error: 'This link has expired. Please sign in again.' });
    }

    // Token successfully claimed — load the user and issue a session.
    const userResult = await pool.query(
      'SELECT id, email, name, role, persona, partner_id FROM users WHERE id = $1',
      [claim.rows[0].user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired link. Please sign in again.' });
    }

    const u = userResult.rows[0];

    // Issue a JWT session — same shape as before
    const payload = {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      persona: u.persona,
      partner_id: u.partner_id,
    };

    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token: jwtToken, user: payload });
  } catch (err) {
    console.error('Magic link verify error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, persona, partner_id FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
