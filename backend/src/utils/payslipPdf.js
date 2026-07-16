const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return rgb(0.15, 0.39, 0.92);
  const int = parseInt(m[1], 16);
  return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
}

const money = (n) => `NGN ${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
// eslint-disable-next-line no-control-regex
const safe = (s) => String(s ?? '').replace(/[^\x00-\xFF]/g, '?');

// Renders a payslip PDF for one payroll item within a run. Returns a Buffer.
async function renderPayslipPdf(run, item, branding) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const accent = hexToRgb(branding?.primary_color);
  const { width, height } = page.getSize();
  let y = height - 60;

  const orgName = safe(branding?.display_name || 'Payslip');
  page.drawText(orgName, { x: 40, y, size: 20, font: bold, color: accent });
  page.drawText('PAYSLIP', { x: width - 160, y, size: 20, font: bold, color: rgb(0.2, 0.2, 0.2) });
  y -= 30;
  page.drawText(safe(run.name), { x: width - 160, y, size: 11, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 40;

  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 25;

  page.drawText('Employee', { x: 40, y, size: 10, font: bold, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('Pay Period', { x: 320, y, size: 10, font: bold, color: rgb(0.5, 0.5, 0.5) });
  y -= 16;
  page.drawText(safe(item.employee_name), { x: 40, y, size: 11, font });
  page.drawText(`${run.period_start ? new Date(run.period_start).toLocaleDateString() : '-'} to ${run.period_end ? new Date(run.period_end).toLocaleDateString() : '-'}`, { x: 320, y, size: 11, font });
  y -= 16;
  if (item.department) { page.drawText(safe(item.department), { x: 40, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) }); }
  if (item.bank_name) { page.drawText(`${safe(item.bank_name)} ...${safe(item.account_number || '').slice(-4)}`, { x: 320, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) }); }
  y -= 30;

  page.drawRectangle({ x: 40, y: y - 6, width: width - 80, height: 22, color: accent });
  page.drawText('Earnings', { x: 48, y, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Amount', { x: 300, y, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Deductions', { x: 400, y, size: 10, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Amount', { x: 490, y, size: 10, font: bold, color: rgb(1, 1, 1) });
  y -= 26;

  const rowsL = [['Basic salary', item.gross_salary], ['Allowances', item.allowances]];
  const rowsR = [['PAYE tax', item.tax], ['Pension (8%)', item.pension], ['Other deductions', item.other_deductions]];
  const maxRows = Math.max(rowsL.length, rowsR.length);
  for (let i = 0; i < maxRows; i++) {
    if (rowsL[i]) {
      page.drawText(rowsL[i][0], { x: 48, y, size: 10, font });
      page.drawText(money(rowsL[i][1]), { x: 300, y, size: 10, font });
    }
    if (rowsR[i]) {
      page.drawText(rowsR[i][0], { x: 400, y, size: 10, font });
      page.drawText(money(rowsR[i][1]), { x: 490, y, size: 10, font });
    }
    y -= 20;
  }

  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 24;
  const grossTotal = Number(item.gross_salary) + Number(item.allowances);
  const deductionsTotal = Number(item.tax) + Number(item.pension) + Number(item.other_deductions);
  page.drawText('Gross pay', { x: 48, y, size: 11, font: bold });
  page.drawText(money(grossTotal), { x: 300, y, size: 11, font: bold });
  page.drawText('Total deductions', { x: 400, y, size: 11, font: bold });
  page.drawText(money(deductionsTotal), { x: 490, y, size: 11, font: bold });
  y -= 30;

  page.drawRectangle({ x: 40, y: y - 8, width: width - 80, height: 30, color: rgb(0.95, 0.97, 1) });
  page.drawText('Net pay', { x: 48, y, size: 13, font: bold, color: accent });
  page.drawText(money(item.net_pay), { x: 490, y, size: 13, font: bold, color: accent });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

module.exports = { renderPayslipPdf };
