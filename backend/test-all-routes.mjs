// End-to-end API test — hits every major route with a real authenticated session
import http from 'http';
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const BASE = 'http://127.0.0.1:4001';
const email = `test-e2e-${Date.now()}@test.com`;
let cookie = '';

async function api(method, path, body) {
  return new Promise((resolve) => {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (cookie) opts.headers['Cookie'] = cookie;
    const req = http.request(`${BASE}${path}`, opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        if (setCookie) cookie = setCookie[0].split(';')[0];
        try { resolve({ status: res.statusCode, body: JSON.parse(data), ok: res.statusCode < 400 }); }
        catch { resolve({ status: res.statusCode, body: data, ok: res.statusCode < 400 }); }
      });
    });
    req.on('error', e => resolve({ status: 0, body: e.message, ok: false }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAll() {
  const results = [];
  const pass = (name) => { results.push(`✅ ${name}`); };
  const fail = (name, err) => { results.push(`❌ ${name}: ${typeof err === 'object' ? JSON.stringify(err) : err}`); };

  // 1. Health
  const h = await api('GET', '/api/v1/health');
  if (h.ok) pass('health') ; else fail('health', h.body);

  // 2. Register
  const r = await api('POST', '/api/v1/auth/register', { orgName: 'E2E Org', fullName: 'E2E User', email, password: 'Password123!' });
  if (r.ok) pass('register'); else fail('register', r.body?.error || r.body);

  // Upgrade the registered org's plan to business so it can access all modules
  if (r.ok) {
    try {
      const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      await client.query(
        `UPDATE subscriptions SET plan_id = (SELECT id FROM plans WHERE slug = 'business')
         WHERE org_id = (SELECT org_id FROM users WHERE email = $1)`,
        [email]
      );
      await client.end();
    } catch (e) {
      console.error('Failed to upgrade org plan in database:', e.message);
    }
  }

  // 3. Login
  const l = await api('POST', '/api/v1/auth/login', { email, password: 'Password123!' });
  if (l.ok && cookie) pass('login'); else fail('login', l.body?.error);

  // 4. Me
  const me = await api('GET', '/api/v1/auth/me');
  if (me.ok) pass('me'); else fail('me', me.body);

  // 5. Modules
  const mods = await api('GET', '/api/v1/modules');
  if (mods.ok) pass('modules (' + (mods.body?.categories?.length || 0) + ' cats)'); else fail('modules', mods.body);

  // 6. CRM
  const contacts = await api('GET', '/api/v1/crm/contacts');
  if (contacts.ok) pass('crm/contacts'); else fail('crm/contacts', contacts.body);
  const cc = await api('POST', '/api/v1/crm/contacts', { fullName: 'Test Contact', company: 'Test Co' });
  if (cc.ok) pass('crm/create'); else fail('crm/create', cc.body?.error);

  // 7. Invoices
  const invs = await api('GET', '/api/v1/invoices');
  if (invs.ok) pass('invoices'); else fail('invoices', invs.body);
  const ic = await api('POST', '/api/v1/invoices/clients', { name: 'Test Client', email: 'c@t.com' });
  if (ic.ok) pass('invoices/clients/create'); else fail('invoices/clients', ic.body);

  // 8. Email
  const el = await api('GET', '/api/v1/email/lists');
  if (el.ok) pass('email/lists'); else fail('email/lists', el.body);

  // 9. SEO
  const kw = await api('GET', '/api/v1/seo/keywords');
  if (kw.ok) pass('seo/keywords'); else fail('seo/keywords', kw.body);
  const sp = await api('GET', '/api/v1/seo/speed');
  if (sp.ok) pass('seo/speed'); else fail('seo/speed', sp.body);

  // 10. Platform Core
  const cf = await api('GET', '/api/v1/approvals/requests');
  if (cf.ok) pass('approvals'); else fail('approvals', cf.body);
  const act = await api('GET', '/api/v1/platform/activity');
  if (act.ok) pass('platform/activity'); else fail('platform/activity', act.body);
  const cal = await api('GET', '/api/v1/platform/calendar');
  if (cal.ok) pass('platform/calendar'); else fail('platform/calendar', cal.body);

  // 11. Workspace routes
  const sand = await api('GET', '/api/v1/workspace/sandboxes');
  if (sand.ok) pass('workspace/sandboxes'); else fail('workspace/sandboxes', sand.body);
  const expAll = await api('GET', '/api/v1/workspace/export-all');
  if (expAll.ok) pass('workspace/export-all'); else fail('workspace/export-all', expAll.body);

  // 12. Financial
  const exp = await api('GET', '/api/v1/expenses');
  if (exp.ok) pass('expenses'); else fail('expenses', exp.body);
  const pay = await api('GET', '/api/v1/payroll');
  if (pay.ok) pass('payroll'); else fail('payroll', pay.body);
  const quo = await api('GET', '/api/v1/quotations');
  if (quo.ok) pass('quotations'); else fail('quotations', quo.body);
  const acc = await api('GET', '/api/v1/accounting/accounts');
  if (acc.ok) pass('accounting'); else fail('accounting', acc.body);

  // 13. HR
  const hr = await api('GET', '/api/v1/hr/employees');
  if (hr.ok) pass('hr/employees'); else fail('hr/employees', hr.body);
  const rec = await api('GET', '/api/v1/recruitment/jobs');
  if (rec.ok) pass('recruitment'); else fail('recruitment', rec.body);

  // 14. LMS
  const lms = await api('GET', '/api/v1/lms/courses');
  if (lms.ok) pass('lms/courses'); else fail('lms/courses', lms.body);
  const cbt = await api('GET', '/api/v1/cbt/quizzes');
  if (cbt.ok) pass('cbt/quizzes'); else fail('cbt/quizzes', cbt.body);

  // 15. Commerce
  const store = await api('GET', '/api/v1/store-builder/products');
  if (store.ok) pass('store/products'); else fail('store/products', store.body);
  const ord = await api('GET', '/api/v1/orders');
  if (ord.ok) pass('orders'); else fail('orders', ord.body);
  const subs = await api('GET', '/api/v1/customer-subs');
  if (subs.ok) pass('customer-subs'); else fail('customer-subs', subs.body);

  // 16. Helpdesk
  const hd = await api('GET', '/api/v1/helpdesk');
  if (hd.ok) pass('helpdesk'); else fail('helpdesk', hd.body);

  // 17. Dokuments
  const doc = await api('GET', '/api/v1/documents');
  if (doc.ok) pass('documents'); else fail('documents', doc.body);
  const kb = await api('GET', '/api/v1/kb/articles');
  if (kb.ok) pass('kb/articles'); else fail('kb/articles', kb.body);

  // 18. Marketing
  const forms = await api('GET', '/api/v1/leads/forms');
  if (forms.ok) pass('leads/forms'); else fail('leads/forms', forms.body);
  const popups = await api('GET', '/api/v1/popup-builder');
  if (popups.ok) pass('popup-builder'); else fail('popup-builder', popups.body);
  const funnels = await api('GET', '/api/v1/funnels');
  if (funnels.ok) pass('funnels'); else fail('funnels', funnels.body);

  // 19. API Keys
  const apiKeys = await api('GET', '/api/v1/api-keys');
  if (apiKeys.ok) pass('api-keys'); else fail('api-keys', apiKeys.body);

  // 20. Feature Flags
  const ff = await api('GET', '/api/v1/feature-flags');
  if (ff.ok) pass('feature-flags'); else fail('feature-flags', ff.body);

  // 21. Contracts
  const cont = await api('GET', '/api/v1/contracts');
  if (cont.ok) pass('contracts'); else fail('contracts', cont.body);

  // 22. GDPR
  const gdpr = await api('GET', '/api/v1/gdpr/requests');
  if (gdpr.ok) pass('gdpr/requests'); else fail('gdpr/requests', gdpr.body);

  // 23. Dunning
  const dun = await api('GET', '/api/v1/dunning/templates');
  if (dun.ok) pass('dunning/templates'); else fail('dunning/templates', dun.body);

  // 24. Sites, Pages, Store
  const pages = await api('GET', '/api/v1/pages');
  if (pages.ok) pass('pages'); else fail('pages', pages.body);
  const st = await api('GET', '/api/v1/site-templates');
  if (st.ok) pass('site-templates'); else fail('site-templates', st.body);

  // 25. Assets, Inventory, POS
  const ast = await api('GET', '/api/v1/assets');
  if (ast.ok) pass('assets'); else fail('assets', ast.body);
  const inv = await api('GET', '/api/v1/inventory/products');
  if (inv.ok) pass('inventory/products'); else fail('inventory/products', inv.body);

  // 26. Tasks, PM
  const pm = await api('GET', '/api/v1/pm/projects');
  if (pm.ok) pass('pm'); else fail('pm', pm.body);
  const tasks = await api('GET', '/api/v1/tasks');
  if (tasks.ok) pass('tasks'); else fail('tasks', tasks.body);

  // 27. Custom Fields
  const cfields = await api('GET', '/api/v1/custom-fields/contact');
  if (cfields.ok) pass('custom-fields/contact'); else fail('custom-fields/contact', cfields.body);

  // 28. Notifications
  const notif = await api('GET', '/api/v1/notifications');
  if (notif.ok) pass('notifications'); else fail('notifications', notif.body);

  // 29. Calendar, Time tracking, Notes
  const cal2 = await api('GET', '/api/v1/calendar');
  if (cal2.ok) pass('calendar'); else fail('calendar', cal2.body);
  const tt = await api('GET', '/api/v1/time-tracking/projects');
  if (tt.ok) pass('time-tracking'); else fail('time-tracking', tt.body);
  const notes = await api('GET', '/api/v1/notes');
  if (notes.ok) pass('notes'); else fail('notes', notes.body);

  // 30. Affiliates, Referrals, Coupons
  const aff = await api('GET', '/api/v1/affiliates');
  if (aff.ok) pass('affiliates'); else fail('affiliates', aff.body);
  const ref = await api('GET', '/api/v1/referrals/programs');
  if (ref.ok) pass('referrals'); else fail('referrals', ref.body);
  const coup = await api('GET', '/api/v1/coupons');
  if (coup.ok) pass('coupons'); else fail('coupons', coup.body);

  // 31. WhatsApp, SMS
  const wa = await api('GET', '/api/v1/whatsapp/contacts');
  if (wa.ok) pass('whatsapp/contacts'); else fail('whatsapp/contacts', wa.body);
  const sms = await api('GET', '/api/v1/sms/contacts');
  if (sms.ok) pass('sms/contacts'); else fail('sms/contacts', sms.body);

  // 32. Lead Generation
  const lead = await api('GET', '/api/v1/leads');
  if (lead.ok) pass('leads'); else fail('leads', lead.body);

  // 33. Scheduling
  const appt = await api('GET', '/api/v1/appointments');
  if (appt.ok) pass('appointments'); else fail('appointments', appt.body);

  // 34. Search
  const search = await api('GET', '/api/v1/search?q=test');
  if (search.ok) pass('search'); else fail('search', search.body);

  // 35. Upload & Brand Kit
  const bk = await api('GET', '/api/v1/brand-kit');
  if (bk.ok) pass('brand-kit'); else fail('brand-kit', bk.body);

  // Summary
  const passed = results.filter(r => r.startsWith('✅')).length;
  const failed = results.filter(r => r.startsWith('❌')).length;
  console.log(`\n═══════════════════════════════`);
  console.log(`API TEST RESULTS: ${passed} passed, ${failed} failed (of ${results.length})`);
  console.log(`═══════════════════════════════`);
  results.forEach(r => console.log(r));

  if (failed > 0) process.exit(1);
  process.exit(0);
}

testAll();
