// Minimal, dependency-free PDF generator. Produces a single-page A-ish letter
// PDF with a title and wrapped body lines using the built-in Helvetica font.
// This lets us serve genuine, openable PDF files for collateral downloads and
// co-branded one-pagers without bundling a heavyweight PDF library. A
// production system would stream the real stored asset instead.

function escapeText(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n\t]/g, ' ');
}

// Naive word wrap to a character budget (Helvetica 12pt ≈ 95 chars at 612pt wide).
function wrap(text, max = 90) {
  const out = [];
  for (const para of String(text).split('\n')) {
    if (para.trim() === '') { out.push(''); continue; }
    let line = '';
    for (const word of para.split(/\s+/)) {
      if ((line + ' ' + word).trim().length > max) {
        if (line) out.push(line);
        line = word;
      } else {
        line = (line ? line + ' ' : '') + word;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

// title: string, bodyLines: string[] (already short), footer: string
function buildPdf({ title = 'Document', subtitle = '', bodyLines = [], footer = '' } = {}) {
  const lines = [];
  // Header block
  lines.push({ size: 22, text: title });
  if (subtitle) lines.push({ size: 12, text: subtitle, gap: 8 });
  lines.push({ size: 12, text: '', gap: 6 });
  for (const raw of bodyLines) {
    for (const w of wrap(raw, 92)) lines.push({ size: 12, text: w });
  }

  // Build the content stream with absolute text positioning.
  let y = 740;
  let content = '';
  for (const ln of lines) {
    y -= (ln.gap || 0);
    content += `BT /F1 ${ln.size} Tf 1 0 0 1 56 ${y} Tm (${escapeText(ln.text)}) Tj ET\n`;
    y -= ln.size + 6;
    if (y < 70) break; // single page only
  }
  if (footer) {
    content += `BT /F1 9 Tf 1 0 0 1 56 48 Tm (${escapeText(footer)}) Tj ET\n`;
  }

  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>',
    `<</Length ${Buffer.byteLength(content, 'utf8')}>>\nstream\n${content}endstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];

  const header = '%PDF-1.4\n';
  let body = '';
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(header.length + Buffer.byteLength(body, 'utf8'));
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefStart = header.length + Buffer.byteLength(body, 'utf8');
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(header + body + xref + trailer, 'utf8');
}

module.exports = { buildPdf };
