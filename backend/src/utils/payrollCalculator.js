// Nigerian PAYE (Personal Income Tax) + pension calculator, per the Finance
// Act consolidated relief allowance rules and the Pension Reform Act 2014
// minimum employee contribution. Inputs/outputs are monthly NGN amounts.

// Annual graduated PAYE bands (Nigeria), applied to taxable income after CRA.
const ANNUAL_BANDS = [
  { upTo: 300000, rate: 0.07 },
  { upTo: 600000, rate: 0.11 },
  { upTo: 1100000, rate: 0.15 },
  { upTo: 1600000, rate: 0.19 },
  { upTo: 3200000, rate: 0.21 },
  { upTo: Infinity, rate: 0.24 },
];

// Employee pension contribution: 8% of (basic + housing + transport). We
// don't split gross into those components, so approximate with 8% of gross
// monthly salary (excludes non-pensionable allowances), which is the common
// simplified basis smaller employers use.
const PENSION_RATE = 0.08;

function annualPaye(annualGrossIncome) {
  // Consolidated Relief Allowance: higher of NGN200,000 or 1% of gross income,
  // plus 20% of gross income.
  const cra = Math.max(200000, annualGrossIncome * 0.01) + annualGrossIncome * 0.2;
  let taxable = Math.max(0, annualGrossIncome - cra);
  let tax = 0;
  let lower = 0;
  for (const band of ANNUAL_BANDS) {
    if (taxable <= 0) break;
    const bandSize = band.upTo - lower;
    const amountInBand = Math.min(taxable, bandSize);
    tax += amountInBand * band.rate;
    taxable -= amountInBand;
    lower = band.upTo;
  }
  return tax;
}

// grossMonthly/allowancesMonthly are the salary components entered per pay
// run item. Returns { tax, pension } as monthly NGN, rounded to 2dp.
function calculateStatutoryDeductions(grossMonthly, allowancesMonthly) {
  const gross = Number(grossMonthly) || 0;
  const allowances = Number(allowancesMonthly) || 0;
  const annualGross = (gross + allowances) * 12;
  const tax = annualPaye(annualGross) / 12;
  const pension = gross * PENSION_RATE;
  return {
    tax: Math.round(tax * 100) / 100,
    pension: Math.round(pension * 100) / 100,
  };
}

module.exports = { calculateStatutoryDeductions, annualPaye };
