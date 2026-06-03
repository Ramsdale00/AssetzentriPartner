// Cloudflare Turnstile verification — free, privacy-friendly bot/spam protection.
//
// Opt-in: if TURNSTILE_SECRET_KEY is not set (e.g. local development), this is a
// no-op so the app keeps working without a Cloudflare account. Set the secret in
// the backend env and VITE_TURNSTILE_SITE_KEY in the frontend env to enable it.

const SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(req, res, next) {
  if (!SECRET) return next(); // protection disabled — nothing to verify

  const token = req.body?.turnstileToken || req.headers['cf-turnstile-response'];
  if (!token) {
    return res.status(400).json({ error: 'Please complete the captcha and try again.' });
  }

  try {
    const form = new URLSearchParams();
    form.append('secret', SECRET);
    form.append('response', token);
    if (req.ip) form.append('remoteip', req.ip);

    const resp = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    const data = await resp.json();

    if (!data.success) {
      return res.status(403).json({ error: 'Captcha verification failed. Please try again.' });
    }
    return next();
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return res.status(502).json({ error: 'Could not verify captcha right now. Please try again.' });
  }
}

module.exports = { verifyTurnstile };
