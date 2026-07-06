const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../utils/planAccess');
const { sendMail } = require('../utils/mailer');
const db = require('../db');
const r = Router();

// ── Public routes — no auth. These power the live storefront at
// frontend/app/store/[orgId]/page.jsx and must stay reachable by
// unauthenticated shoppers. Mounted before the requireAuth gate below,
// mirroring the pattern in backend/src/routes/pages.js. ──────────────────────

// Public — no auth. Lists every published store so a single site-wide
// sitemap.xml can include storefronts, mirroring pages.js's public-sitemap.
r.get('/public-sitemap', async (req, res) => {
  const { rows } = await db.query(
    `SELECT org_id, updated_at FROM store_settings WHERE is_published = TRUE ORDER BY updated_at DESC`
  );
  res.json({ stores: rows });
});

r.get('/public/:orgId', async (req, res) => {
  const { orgId } = req.params;
  const { rows: settingsRows } = await db.query(
    `SELECT * FROM store_settings WHERE org_id=$1 AND is_published=TRUE`, [orgId]);
  if (!settingsRows.length) return res.status(404).json({ error: 'not_found' });

  const { rows: products } = await db.query(
    `SELECT * FROM marketplace_products WHERE org_id=$1 AND status='active' ORDER BY created_at DESC`,
    [orgId]
  );
  const { rows: variants } = await db.query(
    `SELECT * FROM product_variants WHERE org_id=$1 ORDER BY created_at ASC`, [orgId]
  );
  const withVariants = products.map(p => ({
    ...p,
    variants: variants.filter(v => v.product_id === p.id),
  }));

  res.json({ settings: settingsRows[0], products: withVariants });
});

r.post('/public/:orgId/checkout', async (req, res) => {
  const { orgId } = req.params;
  const { items, couponCode, customerName, customerEmail, customerPhone, customerAddress, paymentMethod } = req.body || {};

  if (!customerName?.trim()) return res.status(400).json({ error: 'customerName is required.' });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'items are required.' });

  const { rows: settingsRows } = await db.query(
    `SELECT * FROM store_settings WHERE org_id=$1 AND is_published=TRUE`, [orgId]);
  if (!settingsRows.length) return res.status(404).json({ error: 'not_found' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Re-fetch product/variant server-side and build priced line items.
    const lineItems = [];
    for (const it of items) {
      const qty = Number(it.qty) || 0;
      if (!it.productId || qty <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid item in cart.' });
      }
      const { rows: prodRows } = await client.query(
        `SELECT * FROM marketplace_products WHERE id=$1 AND org_id=$2 AND status='active'`,
        [it.productId, orgId]
      );
      if (!prodRows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product ${it.productId} is not available.` });
      }
      const product = prodRows[0];
      let variant = null;
      if (it.variantId) {
        const { rows: varRows } = await client.query(
          `SELECT * FROM product_variants WHERE id=$1 AND product_id=$2 AND org_id=$3`,
          [it.variantId, it.productId, orgId]
        );
        if (!varRows.length) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Variant ${it.variantId} is not available.` });
        }
        variant = varRows[0];
      }
      const unitPrice = Number(product.price) + (variant ? Number(variant.price_delta || 0) : 0);
      lineItems.push({
        productId: product.id,
        variantId: variant ? variant.id : null,
        name: variant ? `${product.name} (${variant.name}: ${variant.value})` : product.name,
        qty,
        price: unitPrice,
      });
    }

    const subtotal = lineItems.reduce((s, li) => s + li.price * li.qty, 0);

    // 2. Validate + apply coupon, mirroring couponsController.validateCoupon's rules.
    let discount = 0;
    let couponRow = null;
    if (couponCode) {
      const { rows: cRows } = await client.query(
        `SELECT * FROM coupons WHERE org_id=$1 AND code=UPPER($2)`, [orgId, couponCode]
      );
      if (!cRows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid coupon code.' });
      }
      const c = cRows[0];
      if (c.status !== 'active') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Coupon is not active.' });
      }
      if (c.expires_at && new Date(c.expires_at) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Coupon has expired.' });
      }
      if (c.max_uses && c.uses_count >= c.max_uses) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Coupon usage limit reached.' });
      }
      if (c.min_order && subtotal < Number(c.min_order)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Minimum order of ₦${c.min_order} required.` });
      }
      discount = c.type === 'percent' ? subtotal * Number(c.value) / 100 : Number(c.value);
      couponRow = c;
    }

    // Shipping: flat rate unless subtotal clears the org's free-shipping threshold.
    const flatRate = Number(settingsRows[0].shipping_flat_rate || 0);
    const freeThreshold = settingsRows[0].free_shipping_threshold != null ? Number(settingsRows[0].free_shipping_threshold) : null;
    const shipping = (freeThreshold != null && subtotal >= freeThreshold) ? 0 : flatRate;

    const total = Math.max(subtotal - discount, 0) + shipping;

    // 3. Atomically decrement stock per line item.
    for (const li of lineItems) {
      if (li.variantId) {
        const { rows } = await client.query(
          `UPDATE product_variants SET stock = stock - $1 WHERE id=$2 AND stock >= $1 RETURNING stock`,
          [li.qty, li.variantId]
        );
        if (!rows.length) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'out_of_stock', productId: li.productId, variantId: li.variantId });
        }
      } else {
        const { rows } = await client.query(
          `UPDATE marketplace_products SET stock = stock - $1 WHERE id=$2 AND stock >= $1 RETURNING stock`,
          [li.qty, li.productId]
        );
        if (!rows.length) {
          await client.query('ROLLBACK');
          return res.status(409).json({ error: 'out_of_stock', productId: li.productId });
        }
      }
      // Track sales per product regardless of variant.
      await client.query(`UPDATE marketplace_products SET sales = sales + $1 WHERE id=$2`, [li.qty, li.productId]);
    }

    // 4. Insert the order.
    const seqRes = await client.query(`SELECT nextval('order_number_seq') AS n`);
    const orderNumber = `ORD-${String(seqRes.rows[0].n).padStart(5, '0')}`;
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (org_id, order_number, customer_name, customer_email, customer_phone, customer_address, items, subtotal, discount, tax_amount, shipping, total, status, payment_status, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending','unpaid',$13) RETURNING *`,
      [
        orgId, orderNumber, customerName.trim(), customerEmail || null, customerPhone || null, customerAddress || null,
        JSON.stringify(lineItems), subtotal, discount, 0, shipping, total, paymentMethod || null,
      ]
    );

    // 5. Increment coupon usage count.
    if (couponRow) {
      await client.query(`UPDATE coupons SET uses_count = uses_count + 1 WHERE id=$1`, [couponRow.id]);
    }

    // 6. This order recovers any prior abandoned cart from the same shopper.
    if (customerEmail) {
      await client.query(
        `UPDATE store_abandoned_carts SET recovered=TRUE, updated_at=NOW() WHERE org_id=$1 AND customer_email=$2 AND recovered=FALSE`,
        [orgId, customerEmail]
      );
    }

    await client.query('COMMIT');
    const order = orderRows[0];
    res.status(201).json({ orderId: order.id, orderNumber: order.order_number, subtotal, discount, shipping, total: Number(order.total) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Storefront checkout failed', err);
    res.status(500).json({ error: 'Checkout failed. Please try again.' });
  } finally {
    client.release();
  }
});

// Public — no auth. Called from the storefront when a shopper has entered an
// email and cart items but hasn't completed checkout yet, so we can follow up.
r.post('/public/:orgId/cart-abandon', async (req, res) => {
  const { orgId } = req.params;
  const { customerEmail, customerName, items, subtotal } = req.body || {};
  if (!customerEmail?.trim() || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'customerEmail and items are required.' });
  }
  await db.query(
    `INSERT INTO store_abandoned_carts (org_id, customer_email, customer_name, items, subtotal)
     VALUES ($1,$2,$3,$4,$5)`,
    [orgId, customerEmail.trim(), customerName || null, JSON.stringify(items), Number(subtotal) || 0]
  );
  res.status(201).json({ ok: true });
});

// ── Protected routes ──────────────────────────────────────────────────────────
r.use(requireAuth);
r.use(requireModuleAccess('online-store-builder'));

r.get('/settings', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM store_settings WHERE org_id=$1`, [req.user.orgId]);
  if (!rows.length) {
    const { rows: created } = await db.query(
      `INSERT INTO store_settings (org_id) VALUES ($1) RETURNING *`, [req.user.orgId]);
    return res.json({ settings: created[0] });
  }
  res.json({ settings: rows[0] });
});

r.put('/settings', async (req, res) => {
  const { storeName, tagline, logoUrl, bannerUrl, theme, primaryColor, currency, contactEmail, contactPhone, address, social,
    gaMeasurementId, metaPixelId, googleAdsConversionId, shippingFlatRate, freeShippingThreshold } = req.body || {};
  // These IDs get interpolated into inline <script> tags on the public storefront,
  // so reject anything that doesn't match the provider's real ID format rather
  // than trusting free-form input from the org's own dashboard.
  if (gaMeasurementId && !/^G-[A-Z0-9]+$/i.test(gaMeasurementId)) return res.status(400).json({ error: 'Invalid GA Measurement ID (expected format: G-XXXXXXX).' });
  if (metaPixelId && !/^[0-9]{5,20}$/.test(metaPixelId)) return res.status(400).json({ error: 'Invalid Meta Pixel ID (expected a numeric ID).' });
  if (googleAdsConversionId && !/^(AW-)?[A-Za-z0-9-]+$/.test(googleAdsConversionId)) return res.status(400).json({ error: 'Invalid Google Ads Conversion ID.' });
  if (shippingFlatRate != null && (isNaN(Number(shippingFlatRate)) || Number(shippingFlatRate) < 0)) return res.status(400).json({ error: 'Shipping flat rate must be a non-negative number.' });
  if (freeShippingThreshold !== undefined && freeShippingThreshold !== null && freeShippingThreshold !== '' && (isNaN(Number(freeShippingThreshold)) || Number(freeShippingThreshold) < 0)) return res.status(400).json({ error: 'Free shipping threshold must be a non-negative number.' });
  const thresholdValue = (freeShippingThreshold === undefined || freeShippingThreshold === null || freeShippingThreshold === '') ? null : Number(freeShippingThreshold);
  const { rows } = await db.query(
    `INSERT INTO store_settings (org_id,store_name,tagline,logo_url,banner_url,theme,primary_color,currency,contact_email,contact_phone,address,social,ga_measurement_id,meta_pixel_id,google_ads_conversion_id,shipping_flat_rate,free_shipping_threshold,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW())
     ON CONFLICT (org_id) DO UPDATE SET
       store_name=$2,tagline=$3,logo_url=$4,banner_url=$5,theme=$6,primary_color=$7,currency=$8,
       contact_email=$9,contact_phone=$10,address=$11,social=$12,ga_measurement_id=$13,meta_pixel_id=$14,google_ads_conversion_id=$15,
       shipping_flat_rate=$16,free_shipping_threshold=$17,updated_at=NOW() RETURNING *`,
    [req.user.orgId, storeName||'My Store', tagline||'', logoUrl||'', bannerUrl||'', theme||'modern',
     primaryColor||'#2563eb', currency||'NGN', contactEmail||'', contactPhone||'', address||'', JSON.stringify(social||{}),
     gaMeasurementId || null, metaPixelId || null, googleAdsConversionId || null,
     Number(shippingFlatRate) || 0, thresholdValue]);
  res.json({ settings: rows[0] });
});

r.get('/abandoned-carts', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM store_abandoned_carts WHERE org_id=$1 ORDER BY updated_at DESC LIMIT 200`, [req.user.orgId]);
  res.json({ carts: rows });
});

// Shared by the manual "Send recovery email" button (below) and the
// automated scheduler (backend/src/utils/abandonedCartRecoveryScheduler.js),
// so the email content and recovery_sent_at bookkeeping only live in one place.
async function sendCartRecoveryEmail(cart) {
  const { rows: settingsRows } = await db.query(`SELECT * FROM store_settings WHERE org_id=$1`, [cart.org_id]);
  const storeName = settingsRows[0]?.store_name || 'our store';
  const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/store/${cart.org_id}`;
  const items = Array.isArray(cart.items) ? cart.items : [];
  const itemsHtml = items.map(i => `<li>${i.name} × ${i.qty}</li>`).join('');
  const result = await sendMail({
    to: cart.customer_email,
    subject: `You left something in your cart at ${storeName}`,
    html: `<p>Hi${cart.customer_name ? ' ' + cart.customer_name : ''},</p>
      <p>You still have items waiting in your cart at ${storeName}:</p>
      <ul>${itemsHtml}</ul>
      <p><a href="${storeUrl}">Come back and complete your order</a></p>`,
  });
  if (result.ok) await db.query(`UPDATE store_abandoned_carts SET recovery_sent_at=NOW() WHERE id=$1`, [cart.id]);
  return result;
}

// Automated recovery pass — called on an interval (see
// abandonedCartRecoveryScheduler.js). Carts get one hour to convert on their
// own before we nudge the shopper; already-recovered or already-emailed
// carts are excluded so this never double-sends.
async function sendDueCartRecoveries() {
  const { rows } = await db.query(
    `SELECT * FROM store_abandoned_carts
     WHERE recovered = FALSE AND recovery_sent_at IS NULL
       AND created_at <= now() - interval '1 hour'`
  );
  for (const cart of rows) {
    try {
      const result = await sendCartRecoveryEmail(cart);
      if (!result.ok) console.error(`abandoned-cart recovery ${cart.id} send failed:`, result.error);
    } catch (err) {
      console.error(`abandoned-cart recovery ${cart.id} failed:`, err.message);
    }
  }
}

r.post('/abandoned-carts/:id/send-recovery', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM store_abandoned_carts WHERE id=$1 AND org_id=$2`, [req.params.id, req.user.orgId]);
  if (!rows.length) return res.status(404).json({ error: 'not_found' });
  const result = await sendCartRecoveryEmail(rows[0]);
  if (!result.ok) return res.status(502).json({ error: 'Failed to send recovery email.' });
  res.json({ ok: true });
});

r.post('/publish', async (req, res) => {
  const { rows } = await db.query(
    `UPDATE store_settings SET is_published=TRUE,updated_at=NOW() WHERE org_id=$1 RETURNING *`, [req.user.orgId]);
  res.json({ settings: rows[0] });
});

r.post('/unpublish', async (req, res) => {
  const { rows } = await db.query(
    `UPDATE store_settings SET is_published=FALSE,updated_at=NOW() WHERE org_id=$1 RETURNING *`, [req.user.orgId]);
  res.json({ settings: rows[0] });
});

r.get('/products', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM marketplace_products WHERE org_id=$1 AND status='active' ORDER BY created_at DESC`, [req.user.orgId]);
  const { rows: variants } = await db.query(
    `SELECT * FROM product_variants WHERE org_id=$1 ORDER BY created_at ASC`, [req.user.orgId]);
  const withVariants = rows.map(p => ({ ...p, variants: variants.filter(v => v.product_id === p.id) }));
  res.json({ products: withVariants });
});

// Express Router is just a function — attaching this lets the scheduler
// (backend/src/utils/abandonedCartRecoveryScheduler.js) reuse the same send
// logic without this file needing to export a plain object instead of the
// router (which app.js mounts directly as middleware).
r.sendDueCartRecoveries = sendDueCartRecoveries;
module.exports = r;
