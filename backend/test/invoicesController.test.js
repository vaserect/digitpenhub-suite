const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/db');

function buildRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('createInvoice defaults the issue date to today when none is provided', async () => {
  const originalQuery = db.query;
  let capturedIssueDate;

  db.query = async (text, params) => {
    if (text.includes('INSERT INTO invoices')) {
      capturedIssueDate = params[4];
      return {
        rows: [{ id: 'invoice-2', invoice_number: 'INV-200', status: 'draft', issue_date: '2026-06-29', due_date: null, subtotal: '0', tax_rate: '0', total: '0', notes: null }],
      };
    }

    return { rows: [] };
  };

  try {
    delete require.cache[require.resolve('../src/controllers/invoicesController')];
    const { createInvoice } = require('../src/controllers/invoicesController');
    const req = { body: { invoiceNumber: 'INV-200', items: [{ description: 'Design', quantity: 1, unitPrice: 100, amount: 100 }] }, user: { orgId: 'org-1' } };
    const res = buildRes();

    await createInvoice(req, res);

    assert.equal(capturedIssueDate, new Date().toISOString().slice(0, 10));
    assert.equal(res.statusCode, 201);
  } finally {
    db.query = originalQuery;
  }
});

test('createInvoice rejects empty invoice submissions', async () => {
  const originalQuery = db.query;

  db.query = async () => ({ rows: [] });

  try {
    delete require.cache[require.resolve('../src/controllers/invoicesController')];
    const { createInvoice } = require('../src/controllers/invoicesController');
    const req = { body: { invoiceNumber: '   ' }, user: { orgId: 'org-1' } };
    const res = buildRes();

    await createInvoice(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'invoiceNumber is required.');
  } finally {
    db.query = originalQuery;
  }
});

test('updateInvoice preserves the existing status when status is omitted', async () => {
  const originalQuery = db.query;
  let capturedStatus;

  db.query = async (text, params) => {
    if (text.includes('UPDATE invoices')) {
      capturedStatus = params[2];
      return {
        rows: [{ id: 'invoice-1', invoice_number: 'INV-100', status: 'sent', issue_date: null, due_date: null, subtotal: '100', tax_rate: '0', total: '100', notes: null }],
      };
    }

    if (text.includes('SELECT id, description, quantity, unit_price, amount FROM invoice_items')) {
      return { rows: [] };
    }

    return { rows: [] };
  };

  try {
    delete require.cache[require.resolve('../src/controllers/invoicesController')];
    const { updateInvoice } = require('../src/controllers/invoicesController');
    const req = { params: { id: 'invoice-1' }, body: { invoiceNumber: 'INV-101' }, user: { orgId: 'org-1' } };
    const res = buildRes();

    await updateInvoice(req, res);

    assert.equal(capturedStatus, null);
    assert.equal(res.statusCode, 200);
  } finally {
    db.query = originalQuery;
  }
});

test('shareInvoice generates a share token and returns it', async () => {
  const originalQuery = db.query;
  let updateCalled = false;

  db.query = async (text, params) => {
    if (text.includes('SELECT share_token FROM invoices')) {
      return { rows: [{ share_token: null }] };
    }
    if (text.includes('UPDATE invoices SET share_token')) {
      updateCalled = true;
      return { rows: [{ share_token: '11111111-1111-1111-1111-111111111111' }] };
    }
    return { rows: [] };
  };

  try {
    delete require.cache[require.resolve('../src/controllers/invoicesController')];
    const { shareInvoice } = require('../src/controllers/invoicesController');
    const req = { params: { id: 'invoice-1' }, user: { orgId: 'org-1' } };
    const res = buildRes();

    await shareInvoice(req, res);

    assert.equal(updateCalled, true);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.shareToken, '11111111-1111-1111-1111-111111111111');
  } finally {
    db.query = originalQuery;
  }
});

test('getPublicInvoice returns the invoice for a valid share token', async () => {
  const originalQuery = db.query;
  let itemQueryCalled = false;

  db.query = async (text, params) => {
    if (text.includes('WHERE i.share_token = $1')) {
      return { rows: [{ id: 'invoice-1', invoice_number: 'INV-100', status: 'sent', issue_date: '2026-06-29', due_date: null, subtotal: '100', tax_rate: '0', total: '100', notes: null, client_id: 'client-1', client_name: 'Acme', client_company: 'Acme Corp' }] };
    }
    if (text.includes('FROM invoice_items WHERE invoice_id = $1')) {
      itemQueryCalled = true;
      return { rows: [{ id: 'line-1', description: 'Design', quantity: '1', unit_price: '100', amount: '100' }] };
    }
    return { rows: [] };
  };

  try {
    delete require.cache[require.resolve('../src/controllers/invoicesController')];
    const { getPublicInvoice } = require('../src/controllers/invoicesController');
    const req = { params: { token: 'share-token' } };
    const res = buildRes();

    await getPublicInvoice(req, res);

    assert.equal(itemQueryCalled, true);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.invoice.invoice_number, 'INV-100');
    assert.equal(res.body.invoice.items.length, 1);
  } finally {
    db.query = originalQuery;
  }
});
