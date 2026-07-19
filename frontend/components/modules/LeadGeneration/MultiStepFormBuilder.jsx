'use client';
import { useState } from 'react';
import Button from '../../ui/Button';

export default function MultiStepFormBuilder({ draft, setDraft, fields, showToast }) {
  const [activePageIndex, setActivePageIndex] = useState(0);

  function addPage() {
    const newPage = {
      id: `page_${Date.now()}`,
      title: `Page ${(draft.pages || []).length + 1}`,
      description: '',
      fields: []
    };
    setDraft(prev => ({
      ...prev,
      isMultiStep: true,
      pages: [...(prev.pages || []), newPage]
    }));
    setActivePageIndex((draft.pages || []).length);
  }

  function updatePage(pageId, key, value) {
    setDraft(prev => ({
      ...prev,
      pages: (prev.pages || []).map(p => p.id === pageId ? { ...p, [key]: value } : p)
    }));
  }

  function deletePage(pageId) {
    if ((draft.pages || []).length <= 1) {
      showToast('Cannot delete the last page');
      return;
    }
    setDraft(prev => ({
      ...prev,
      pages: (prev.pages || []).filter(p => p.id !== pageId)
    }));
    setActivePageIndex(0);
  }

  function movePage(pageId, direction) {
    const pages = draft.pages || [];
    const idx = pages.findIndex(p => p.id === pageId);
    if (idx < 0) return;
    
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= pages.length) return;

    const newPages = [...pages];
    [newPages[idx], newPages[newIdx]] = [newPages[newIdx], newPages[idx]];
    
    setDraft(prev => ({ ...prev, pages: newPages }));
    setActivePageIndex(newIdx);
  }

  function toggleFieldInPage(pageId, fieldId) {
    setDraft(prev => {
      const pages = prev.pages || [];
      const page = pages.find(p => p.id === pageId);
      if (!page) return prev;

      const fieldIds = page.fields || [];
      const newFieldIds = fieldIds.includes(fieldId)
        ? fieldIds.filter(id => id !== fieldId)
        : [...fieldIds, fieldId];

      return {
        ...prev,
        pages: pages.map(p => p.id === pageId ? { ...p, fields: newFieldIds } : p)
      };
    });
  }

  function convertToMultiStep() {
    if (draft.isMultiStep) return;
    
    // Create initial page with all current fields
    const initialPage = {
      id: `page_${Date.now()}`,
      title: 'Page 1',
      description: '',
      fields: fields.map(f => f.id)
    };
    
    setDraft(prev => ({
      ...prev,
      isMultiStep: true,
      pages: [initialPage]
    }));
    setActivePageIndex(0);
  }

  function convertToSingleStep() {
    setDraft(prev => ({
      ...prev,
      isMultiStep: false,
      pages: []
    }));
  }

  if (!draft.isMultiStep) {
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>Multi-Step Form</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Break your form into multiple pages to improve completion rates and user experience.
        </p>
        <Button variant="secondary" onClick={convertToMultiStep}>
          Convert to Multi-Step Form
        </Button>
      </div>
    );
  }

  const pages = draft.pages || [];
  const activePage = pages[activePageIndex];

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, margin: 0 }}>Multi-Step Form ({pages.length} pages)</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="ctag" onClick={addPage}>+ Add Page</button>
          <button type="button" className="ctag" onClick={convertToSingleStep}>Convert to Single Page</button>
        </div>
      </div>

      {/* Page Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {pages.map((page, idx) => (
          <button
            key={page.id}
            type="button"
            onClick={() => setActivePageIndex(idx)}
            style={{
              padding: '8px 16px',
              border: `2px solid ${activePageIndex === idx ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 8,
              background: activePageIndex === idx ? 'rgba(37,99,235,0.05)' : 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activePageIndex === idx ? 700 : 400
            }}
          >
            {idx + 1}. {page.title}
          </button>
        ))}
      </div>

      {/* Active Page Editor */}
      {activePage && (
        <div className="card" style={{ background: 'var(--surface-muted)', padding: 16 }}>
          <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12 }}>Page Title</label>
              <input
                value={activePage.title}
                onChange={e => updatePage(activePage.id, 'title', e.target.value)}
                placeholder="e.g., Contact Information"
                style={{ fontSize: 13, padding: '8px 10px' }}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 12 }}>Page Description (optional)</label>
              <input
                value={activePage.description}
                onChange={e => updatePage(activePage.id, 'description', e.target.value)}
                placeholder="Brief description of this step"
                style={{ fontSize: 13, padding: '8px 10px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Fields on this page ({(activePage.fields || []).length})
            </label>
            {fields.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Add fields to the form first, then assign them to pages
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {fields.map(field => {
                  const isSelected = (activePage.fields || []).includes(field.id);
                  return (
                    <label
                      key={field.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 6,
                        background: isSelected ? 'rgba(37,99,235,0.05)' : 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFieldInPage(activePage.id, field.id)}
                      />
                      <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>
                        {field.label}
                      </span>
                      <span style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'var(--surface-muted)',
                        color: 'var(--text-muted)'
                      }}>
                        {field.type}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {activePageIndex > 0 && (
                <button
                  type="button"
                  className="ctag"
                  onClick={() => movePage(activePage.id, -1)}
                >
                  ← Move Left
                </button>
              )}
              {activePageIndex < pages.length - 1 && (
                <button
                  type="button"
                  className="ctag"
                  onClick={() => movePage(activePage.id, 1)}
                >
                  Move Right →
                </button>
              )}
            </div>
            {pages.length > 1 && (
              <button
                type="button"
                className="ctag"
                style={{ color: 'var(--danger)' }}
                onClick={() => deletePage(activePage.id)}
              >
                Delete Page
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 12, background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', padding: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)' }}>💡 Multi-Step Best Practices:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
            <li>Keep each page focused on one topic (e.g., contact info, company details, preferences)</li>
            <li>Show progress indicator so users know how many steps remain</li>
            <li>Put required fields early to catch incomplete submissions sooner</li>
            <li>Save progress between pages so users can return later</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
