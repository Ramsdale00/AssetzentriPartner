// Thin wrapper around SendGrid so other routes can send transactional email
// without each re-implementing setup. If no API key is configured (e.g. local
// dev), sending is skipped gracefully and reported as not sent.
const sgMail = require('@sendgrid/mail');

const API_KEY = process.env.DEV_SENDGRID_API_KEY;
if (API_KEY) sgMail.setApiKey(API_KEY);

const FROM_EMAIL = process.env.DEV_FROM_EMAIL || 'noreply@zentri.cloud';
const FROM_NAME = process.env.DEV_FROM_NAME || 'Zentri Cloud';

// Returns true if the email was handed off to SendGrid, false if skipped.
async function sendMail({ to, subject, text, html }) {
  if (!API_KEY) {
    console.log(`[mailer] SENDGRID not configured — skipping email "${subject}" to ${to}`);
    return false;
  }
  try {
    await sgMail.send({ to, from: { email: FROM_EMAIL, name: FROM_NAME }, subject, text, html });
    return true;
  } catch (err) {
    console.error('[mailer] send error:', err.message);
    return false;
  }
}

module.exports = { sendMail, FROM_NAME };
