'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TemplateCard from '../../components/templates/TemplateCard';
import MarketingNav from '../../components/marketing/MarketingNav';
import MarketingFooter from '../../components/marketing/MarketingFooter';

export default function TemplatesLibrary() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [industry, setIndustry] = useState('all');
  const [premiumOnly, setPremiumOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/builder/templates?limit=200', { credentials: 'include' });
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (e) { console.error('Failed to load templates', e); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    let f = [...templates];
    if (query.trim()) {
      const q = query.toLowerCase();
      f = f.filter(t => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q) || t.industry?.toLowerCase().includes(q));
    }
    if (category !== 'all') f = f.filter(t => t.category === category);
    if (industry !== 'all') f = f.filter(t => t.industry === industry);
    if (premiumOnly) f = f.filter(t => t.is_premium);
    setFiltered(f);
  }, [templates, query, category, industry, premiumOnly]);

  const categories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))].sort();
  const industries = ['all', ...new Set(templates.map(t => t.industry).filter(Boolean))].sort();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--text)' }}>
      <MarketingNav />

      <div style={{ flex: 1, maxWidth: 1120, margin: '0 auto', padding: 'var(--space-6)', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--text)', margin: '0 0 var(--space-2)' }}>
            Website Templates
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.85rem, 1.1vw, 0.95rem)', margin: 0 }}>
            {loading ? 'Loading...' : `${filtered.length} of ${templates.length} professionally designed templates`}
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'end',
        }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', marginBottom: 4, display: 'block' }}>Search</label>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search templates..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }} />
          </div>
          <div style={{ flex: '0 1 160px' }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', marginBottom: 4, display: 'block' }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}>
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c.replace(/-/g, ' ').replace(/\b\w/g, s => s.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '0 1 160px' }}>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', marginBottom: 4, display: 'block' }}>Industry</label>
            <select value={industry} onChange={e => setIndustry(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}>
              {industries.map(i => (
                <option key={i} value={i}>{i === 'all' ? 'All industries' : i}</option>
              ))}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', padding: '8px 0', color: 'var(--text)' }}>
            <input type="checkbox" checked={premiumOnly} onChange={e => setPremiumOnly(e.target.checked)} style={{ width: 16, height: 16 }} />
            Premium only
          </label>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading templates...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>No templates match your filters.</p>
            <button onClick={() => { setQuery(''); setCategory('all'); setIndustry('all'); setPremiumOnly(false); }}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--primary)', fontSize: 13, cursor: 'pointer' }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(t => (
              <TemplateCard key={t.id} template={t}
                onPreview={(id) => router.push(`/templates/preview/${id}`)}
                onUse={(id) => router.push(`/templates/preview/${id}`)} />
            ))}
          </div>
        )}
      </div>

      <MarketingFooter />
    </div>
  );
}
