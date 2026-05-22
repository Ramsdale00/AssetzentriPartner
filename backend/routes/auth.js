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

// ─── POST /api/auth/verify-magic-link ─────────────────────────────────────────
// Validates the token from the email link and returns a JWT session.
router.post('/verify-magic-link', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const result = await pool.query(
      `SELECT mlt.*, u.id AS uid, u.email, u.name, u.role, u.persona, u.partner_id
       FROM magic_link_tokens mlt
       JOIN users u ON u.id = mlt.user_id
       WHERE mlt.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired link. Please sign in again.' });
    }

    const row = result.rows[0];

    if (row.used) {
      return res.status(401).json({ error: 'This link has already been used. Please sign in again.' });
    }

    if (new Date() > new Date(row.expires_at)) {
      return res.status(401).json({ error: 'This link has expired. Please sign in again.' });
    }

    // Mark token as used (single-use enforcement)
    await pool.query(
      'UPDATE magic_link_tokens SET used = TRUE WHERE id = $1',
      [row.id]
    );

    // Issue a JWT session — same shape as before
    const payload = {
      id: row.uid,
      email: row.email,
      name: row.name,
      role: row.role,
      persona: row.persona,
      partner_id: row.partner_id,
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
