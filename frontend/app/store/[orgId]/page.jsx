'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

export default function StorePage() {
  const { orgId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cart, setCart] = useState([]); // { productId, variantId, name, price, qty, image }
  const [showCart, setShowCart] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', customerAddress: '', couponCode: '' });
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`/api/v1/store-builder/public/${orgId}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('not_found'))
      .finally(() => setLoading(false));
  }, [orgId]);

  const settings = data?.settings;
  const primaryColor = settings?.primary_color || '#2563eb';
  const currency = settings?.currency || 'NGN';

  const cartTotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.qty, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart]);

  function addToCart(product, variant) {
    const price = Number(product.price) + (variant ? Number(variant.price_delta || 0) : 0);
    const key = `${product.id}:${variant ? variant.id : ''}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.key === key);
      if (existing) {
        return prev.map((c) => (c.key === key ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, {
        key,
        productId: product.id,
        variantId: variant ? variant.id : null,
        name: variant ? `${product.name} (${variant.name}: ${variant.value})` : product.name,
        price,
        qty: 1,
        image: Array.isArray(product.images) && product.images.length ? product.images[0] : null,
      }];
    });
    setShowCart(true);
  }

  function updateQty(key, qty) {
    setCart((prev) => prev.map((c) => (c.key === key ? { ...c, qty: Math.max(1, qty) } : c)).filter((c) => c.qty > 0));
  }

  function removeFromCart(key) {
    setCart((prev) => prev.filter((c) => c.key !== key));
  }

  async function handleCheckout(e) {
    e.preventDefault();
    if (!form.customerName.trim()) return;
    setSubmitting(true);
    setCheckoutError('');
    try {
      const res = await fetch(`/api/v1/store-builder/public/${orgId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({ productId: c.productId, variantId: c.variantId, qty: c.qty })),
          couponCode: form.couponCode || undefined,
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          customerAddress: form.customerAddress,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setCheckoutError(d.error || 'Checkout failed. Please try again.');
      } else {
        setOrder(d);
        setCart([]);
      }
    } catch {
      setCheckoutError('Checkout failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#94a3b8' }}>
        Loading store…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛒</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8, color: '#0f172a' }}>Store not available</div>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>This store is unpublished or doesn't exist.</div>
        </div>
      </div>
    );
  }

  if (order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif", background: '#f8fafc' }}>
        <div style={{ maxWidth: 480, textAlign: 'center', background: '#fff', borderRadius: 16, padding: '48px 36px', boxShadow: '0 8px 32px rgba(15,23,42,.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>Order placed!</div>
          <div style={{ color: '#64748b', marginBottom: 20 }}>Thank you, {form.customerName}. We'll be in touch shortly.</div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px', marginBottom: 8 }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Order Number</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{order.orderNumber}</div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: primaryColor }}>{currency} {Number(order.total).toLocaleString()}</div>
          </div>
        </div>
      </div>
    );
  }

  const products = data.products || [];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#fff', color: '#0f172a' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: settings.banner_url ? `url(${settings.banner_url}) center/cover` : primaryColor, color: '#fff', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            {settings.logo_url && <img src={settings.logo_url} alt="" style={{ height: 44, marginBottom: 10, borderRadius: 8 }} />}
            <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>{settings.store_name}</div>
            {settings.tagline && <div style={{ opacity: 0.9, marginTop: 4 }}>{settings.tagline}</div>}
          </div>
          <button onClick={() => setShowCart(true)} style={{ background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,.5)', color: '#fff', borderRadius: 50, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
            🛒 Cart ({cartCount})
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px' }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>No products available yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {products.map((p) => <ProductCard key={p.id} product={p} currency={currency} primaryColor={primaryColor} onAdd={addToCart} />)}
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.85rem', borderTop: '1px solid #e2e8f0' }}>
        {settings.contact_email || settings.contact_phone ? `Contact: ${settings.contact_email || ''} ${settings.contact_phone || ''}` : ''}
      </footer>

      {showCart && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setShowCart(false)}>
          <div style={{ width: 'min(420px, 100%)', height: '100%', background: '#fff', padding: 24, overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>Your Cart</div>
              <button onClick={() => setShowCart(false)} style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            {cart.length === 0 ? (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>Your cart is empty.</div>
            ) : (
              <>
                {cart.map((c) => (
                  <div key={c.key} style={{ display: 'flex', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 8, background: c.image ? `url(${c.image}) center/cover` : '#f1f5f9', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                      <div style={{ color: primaryColor, fontWeight: 700, fontSize: '0.9rem' }}>{currency} {c.price.toLocaleString()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <button onClick={() => updateQty(c.key, c.qty - 1)} style={{ width: 24, height: 24, border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>−</button>
                        <span>{c.qty}</span>
                        <button onClick={() => updateQty(c.key, c.qty + 1)} style={{ width: 24, height: 24, border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>+</button>
                        <button onClick={() => removeFromCart(c.key)} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 16 }}>
                  <span>Total</span>
                  <span>{currency} {cartTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setCheckoutOpen(true); }}
                  style={{ width: '100%', background: primaryColor, color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
                >
                  Checkout
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setCheckoutOpen(false)}>
          <form onSubmit={handleCheckout} style={{ background: '#fff', borderRadius: 16, padding: 32, width: 'min(480px, 100%)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 20 }}>Checkout</div>
            <div style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
              <input required placeholder="Full name *" value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} style={inputStyle} />
              <input type="email" placeholder="Email" value={form.customerEmail} onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))} style={inputStyle} />
              <input placeholder="Phone" value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} style={inputStyle} />
              <textarea placeholder="Delivery address" rows={2} value={form.customerAddress} onChange={(e) => setForm((f) => ({ ...f, customerAddress: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
              <input placeholder="Coupon code (optional)" value={form.couponCode} onChange={(e) => setForm((f) => ({ ...f, couponCode: e.target.value.toUpperCase() }))} style={inputStyle} />
            </div>
            {checkoutError && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 12 }}>{checkoutError}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 16 }}>
              <span>Total</span>
              <span>{currency} {cartTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setCheckoutOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={submitting || cart.length === 0} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: primaryColor, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                {submitting ? 'Placing order…' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
};

function ProductCard({ product, currency, primaryColor, onAdd }) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const [variantId, setVariantId] = useState(variants[0]?.id || '');
  const selectedVariant = variants.find((v) => v.id === variantId) || null;
  const price = Number(product.price) + (selectedVariant ? Number(selectedVariant.price_delta || 0) : 0);
  const outOfStock = selectedVariant ? selectedVariant.stock <= 0 : (variants.length === 0 && product.stock <= 0);

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(15,23,42,.04)' }}>
      <div style={{ height: 160, background: Array.isArray(product.images) && product.images[0] ? `url(${product.images[0]}) center/cover` : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
        {!(Array.isArray(product.images) && product.images[0]) && '🛍️'}
      </div>
      <div style={{ padding: '14px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{product.name}</div>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: primaryColor, marginBottom: 8 }}>{currency} {price.toLocaleString()}</div>
        {variants.length > 0 && (
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)} style={{ ...inputStyle, width: '100%', marginBottom: 8 }}>
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                {v.name}: {v.value} {v.stock <= 0 ? '(out of stock)' : ''}
              </option>
            ))}
          </select>
        )}
        <button
          disabled={outOfStock}
          onClick={() => onAdd(product, selectedVariant)}
          style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: outOfStock ? '#e2e8f0' : primaryColor, color: outOfStock ? '#94a3b8' : '#fff', fontWeight: 700, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
        >
          {outOfStock ? 'Out of stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
