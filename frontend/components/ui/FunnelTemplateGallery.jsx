'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import SearchInput from './SearchInput';
import EmptyState from './EmptyState';
import { SkeletonRows } from './Skeleton';
import { toast } from 'sonner';

export default function FunnelTemplateGallery({ isOpen, onClose, onUsed }) {
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usingId, setUsingId] = useState(null);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([
      apiFetch('/api/v1/funnel-templates/categories'),
      apiFetch('/api/v1/funnel-templates'),
    ]).then(([catRes, listRes]) => {
      setCategories(catRes.categories || []);
      setList(listRes.templates || []);
    }).catch(() => toast.error('Failed to load templates'))
    .finally(() => setLoading(false));
  }, [isOpen]);

  async function handleUseTemplate(id) {
    setUsingId(id);
    try {
      await apiFetch(`/api/v1/funnel-templates/${id}/use`, { method: 'POST' });
      toast.success('Funnel created from template!');
      onUsed?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUsingId(null);
    }
  }

  const filtered = list.filter((t) => {
    if (category && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCats = categories.reduce((s, c) => s + Number(c.count), 0);

  return (
    <Modal isOpen={isOpen} wide title="Choose a funnel template" description="A multi-step funnel with pre-built pages — customize every step after applying." onClose={onClose}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search funnel templates…" />
        </div>
        <select className="toolbar-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories ({totalCats})</option>
          {categories.map((c) => <option key={c.category} value={c.category}>{c.category} ({c.count})</option>)}
        </select>
      </div>
      {loading ? <SkeletonRows rows={4} /> : filtered.length === 0 ? (
        <EmptyState icon="🔗" title="No funnel templates match" description="Try a different category or search term." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14, maxHeight: '55vh', overflowY: 'auto', padding: 2 }}>
          {filtered.map((t) => (
            <div key={t.id} className="card-shell" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Badge variant="neutral">{t.category}</Badge>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{t.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>{t.description}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{t.step_count || 0} steps</div>
              <Button size="sm" loading={usingId === t.id} onClick={() => handleUseTemplate(t.id)}>Create funnel</Button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
