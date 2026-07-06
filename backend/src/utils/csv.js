// Shared CSV export helper. `columns` is an array of [header, key] pairs or
// [header, (row) => value] accessor functions.
function toCsv(rows, columns) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = (v instanceof Date) ? v.toISOString() : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(([label]) => escape(label)).join(',');
  const lines = rows.map((row) =>
    columns.map(([, accessor]) => escape(typeof accessor === 'function' ? accessor(row) : row[accessor])).join(',')
  );
  return [header, ...lines].join('\n');
}

function sendCsv(res, filename, rows, columns) {
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send(toCsv(rows, columns));
}

const titleCase = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Derives [header, key] columns from the shape of the first row — fine for
// `SELECT *`-style exports where the columns aren't known ahead of time.
function autoColumns(rows, exclude = ['org_id']) {
  if (!rows.length) return [];
  return Object.keys(rows[0])
    .filter((k) => !exclude.includes(k))
    .map((k) => [titleCase(k), k]);
}

module.exports = { toCsv, sendCsv, autoColumns };
