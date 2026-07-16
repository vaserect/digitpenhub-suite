const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return rgb(0.15, 0.39, 0.92); // fallback: default blue
  const int = parseInt(m[1], 16);
  return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
}

const money = (n) => `NGN ${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// pdf-lib's standard fonts only support WinAnsi — strip anything outside
// that range (e.g. emoji, curly quotes pasted from elsewhere) rather than
// removing chars outside printable ASCII range rather than
// letting drawText throw and take the whole request down.
// eslint-disable-next-line no-control-regex
const safe = (s) => String(s ?? '').replace(/[^\x00-\xFF]/g, '?');

// Renders a branded, itemized invoice PDF: sender org name/logo color,
// client details, line items, tax, and total. Returns a Buffer.
async function renderInvoicePdf(invoice, branding) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const accent = hexToRgb(branding?.primary_color);
  const { width, height } = page.getSize();
  let y = height - 60;

  const orgName = safe(branding?.display_name || 'Invoice');
  page.drawText(orgName, { x: 40, y, size: 20, font: bold, color: accent });
  page.drawText('INVOICE', { x: width - 160, y, size: 20, font: bold, color: rgb(0.2, 0.2, 0.2) });
  y -= 30;
  page.drawText(`#${invoice.invoice_number}`, { x: width - 160, y, size: 11, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 40;

  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 25;

  page.drawText('Bill To', { x: 40, y, size: 10, font: bold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('Issue Date', { x: 320, y, size: 10, font: bold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('Due Date', { x: 440, y, size: 10, font: bold, color: rgb(0.5, 0.5, 0.5) });
  y -= 16;
  page.drawText(safe(invoice.client_name) || 'N/A', { x: 40, y, size: 11, font });
  page.drawText(invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : '-', { x: 320, y, size: 11, font });
  page.drawText(invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-', { x: 440, y, size: 11, font });
  y -= 16;
  if (invoice.client_company) { page.drawText(safe(invoice.client_company), { x: 40, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) }); y -= 14; }

  y -= 20;
  page.drawRectangle({ x: 40, y: y - 6, width: width - 80, height: 22, color: accent });
  page.drawText('Description', { x: 48, y, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Qty', { x: 340, y, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Unit Price', { x: 400, y, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Amount', { x: 490, y, size: 10, font: bold, color: rgb(1, 1, 1) });
  y -= 28;

  for (const item of invoice.items || []) {
    if (y < 120) { y = height - 60; doc.addPage([595.28, 841.89]); }
    page.drawText(safe(item.description).slice(0, 55), { x: 48, y, size: 10, font });
    page.drawText(String(item.quantity), { x: 340, y, size: 10, font });
    page.drawText(money(item.unit_price), { x: 400, y, size: 10, font });
    page.drawText(money(item.amount), { x: 490, y, size: 10, font });
    y -= 20;
  }

  y -= 10;
  page.drawLine({ start: { x: 340, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 20;
  page.drawText('Subtotal', { x: 400, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(money(invoice.subtotal), { x: 490, y, size: 10, font });
  y -= 18;
  page.drawText(`Tax (${Number(invoice.tax_rate || 0)}%)`, { x: 400, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(money((invoice.subtotal || 0) * (invoice.tax_rate || 0) / 100), { x: 490, y, size: 10, font });
  y -= 22;
  page.drawText('Total', { x: 400, y, size: 12, font: bold });
  page.drawText(money(invoice.total), { x: 490, y, size: 12, font: bold, color: accent });

  if (invoice.notes) {
    y -= 50;
    page.drawText('Notes', { x: 40, y, size: 10, font: bold, color: rgb(0.5, 0.5, 0.5) });
    y -= 16;
    page.drawText(safe(invoice.notes).slice(0, 500), { x: 40, y, size: 10, font, maxWidth: width - 80, lineHeight: 14 });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

module.exports = { renderInvoicePdf };
