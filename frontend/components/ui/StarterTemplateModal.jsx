'use client';

import { useEffect, useMemo, useState } from 'react';
import Badge from './Badge';
import Button from './Button';
import EmptyState from './EmptyState';
import Modal from './Modal';
import SearchInput from './SearchInput';

export default function StarterTemplateModal({
  isOpen,
  onClose,
  title,
  description,
  templates,
  onUse,
  useLabel = 'Use this template',
  searchPlaceholder = 'Search templates…',
  emptyTitle = 'No templates match',
  emptyDescription = 'Try a different search term or category.',
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setCategory('');
    }
  }, [isOpen]);

  const categories = useMemo(
    () => Array.from(new Set((templates || []).map((template) => template.category).filter(Boolean))),
    [templates]
  );

  const visibleTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (templates || []).filter((template) => {
      if (category && template.category !== category) return false;
      if (!needle) return true;
      const haystack = [
        template.name,
        template.description,
        template.category,
        ...(template.highlights || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [category, query, templates]);

  return (
    <Modal isOpen={isOpen} wide title={title} description={description} onClose={onClose}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
        {categories.length > 0 ? (
          <select
            className="toolbar-select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories ({templates.length})</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        ) : null}
      </div>

      {visibleTemplates.length === 0 ? (
        <EmptyState icon="🗂️" title={emptyTitle} description={emptyDescription} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14, maxHeight: '55vh', overflowY: 'auto', padding: 2 }}>
          {visibleTemplates.map((template) => (
            <div key={template.id} className="card-shell" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {template.category ? <Badge variant="neutral">{template.category}</Badge> : null}
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{template.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{template.description}</div>
              {template.highlights?.length ? (
                <div style={{ display: 'grid', gap: 4, fontSize: '0.76rem', color: 'var(--muted)' }}>
                  {template.highlights.map((highlight) => (
                    <div key={highlight}>• {highlight}</div>
                  ))}
                </div>
              ) : null}
              <div style={{ marginTop: 'auto' }}>
                <Button size="sm" onClick={() => onUse(template)}>{useLabel}</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
