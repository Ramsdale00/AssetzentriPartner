const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { buildPdf } = require('../pdf');

function safeFilename(name) {
  return String(name).replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '') || 'collateral';
}

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

// GET /api/collaterals/:id/download — serve a real, openable file for the item.
// Since items are metadata-only (no stored binary), we generate a PDF cover
// sheet on the fly so the download genuinely works end-to-end.
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const itemResult = await pool.query(
      `SELECT ci.*, cf.name AS folder_name
       FROM collateral_items ci
       LEFT JOIN collateral_folders cf ON ci.folder_id = cf.id
       WHERE ci.id = $1`,
      [parseInt(req.params.id)]
    );
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collateral not found' });
    }
    const item = itemResult.rows[0];

    const pdf = buildPdf({
      title: item.name,
      subtitle: `AssetZentri Partner Programme · ${item.folder_name || 'Product Collaterals'}`,
      bodyLines: [
        item.description || 'AssetZentri sales enablement material.',
        '',
        `Document type: ${item.type}`,
        `Version: ${item.version || '1.0'}`,
        `Last updated: ${item.updated_label || '—'}`,
        item.must_read ? `Note: Must-read material${item.must_read_note ? ` · ${item.must_read_note}` : ''}.` : '',
      ].filter(Boolean),
      footer: `Downloaded from the AssetZentri Partner Portal · ${new Date().toISOString().slice(0, 10)}`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(item.name)}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    return res.end(pdf);
  } catch (err) {
    console.error('Download collateral error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/collaterals/cobrand — generate a real co-branded one-pager PDF
// from the partner's own profile + the chosen template.
const TEMPLATES = {
  standard: { label: 'Standard One-Pager', tagline: 'Smarter IT asset management, together.' },
  enterprise: { label: 'Enterprise Template', tagline: 'Enterprise-grade device intelligence for your organisation.' },
  technical: { label: 'Technical Overview', tagline: 'Automated discovery, protection, and lifecycle control.' },
};

router.post('/cobrand', requireAuth, async (req, res) => {
  try {
    const partnerId = req.user.partner_id;
    if (!partnerId) return res.status(403).json({ error: 'No partner associated' });

    const template = TEMPLATES[req.body.template] || TEMPLATES.standard;

    const result = await pool.query(
      `SELECT name, description, website, contact_name, contact_email FROM partners WHERE id = $1`,
      [partnerId]
    );
    const partner = result.rows[0] || {};

    const pdf = buildPdf({
      title: `${partner.name || 'Your Company'}  ×  AssetZentri`,
      subtitle: `${template.label} · ${template.tagline}`,
      bodyLines: [
        '',
        'About AssetZentri',
        'AssetZentri gives organisations a single source of truth for every device:',
        'automated discovery, real-time protection, and full lifecycle management',
        'across Standard and Premium subscription tiers.',
        '',
        `Brought to you by ${partner.name || 'our team'}`,
        partner.description || 'Your trusted AssetZentri partner.',
        '',
        partner.website ? `Web: ${partner.website}` : '',
        partner.contact_name ? `Contact: ${partner.contact_name}${partner.contact_email ? ` · ${partner.contact_email}` : ''}` : '',
      ].filter((l) => l !== null && l !== undefined),
      footer: `Co-branded one-pager · generated ${new Date().toISOString().slice(0, 10)}`,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(partner.name || 'AssetZentri')}-one-pager.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    return res.end(pdf);
  } catch (err) {
    console.error('Cobrand error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
