# Digitpen Hub Suite — Design System

## Colors

### Light Mode (`:root`)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#f4f7fb` | Page background |
| `--surface` | `#ffffff` | Cards, panels, inputs |
| `--surface-elevated` | `#f8fafc` | Sidebar, hover states |
| `--surface-muted` | `#eef2f7` | Muted backgrounds, badge bases |
| `--border` | `#dfe7f1` | Borders |
| `--border-strong` | `#c7d2e0` | Hover/strong borders |
| `--text` | `#0f172a` | Primary text |
| `--text-muted` | `#64748b` | Secondary/muted text |
| `--primary` | `#2563eb` | Primary actions, links |
| `--primary-strong` | `#1d4ed8` | Primary hover |
| `--accent` | `#38bdf8` | Accent highlights |
| `--success` | `#16a34a` | Success states |
| `--warning` | `#f59e0b` | Warning states |
| `--danger` | `#dc2626` | Error states |

### Dark Mode (`html[data-theme='dark']`)

Same tokens, mapped to dark values. Dark mode is activated by the `data-theme='dark'` attribute on `<html>`, set via an inline script in `layout.jsx` before React hydration.

**Rule**: Never use hardcoded color values. Always use CSS custom properties from this system.

---

## Typography

| Token | Font | Weight | Usage |
|---|---|---|---|
| `--font-sans` | Inter | 400, 500 | Body text, inputs, navigation |
| `--font-display` | Sora | 500, 600, 700 | Headings (h1, h2, h3), module names |

Loaded from Google Fonts in `app/layout.jsx`. Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com` for performance.

---

## Spacing Scale

| Token | Pixels | Usage |
|---|---|---|
| `--space-1` | 4px | Small gaps |
| `--space-2` | 8px | Tight spacing |
| `--space-3` | 12px | Element gaps |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Section padding |
| `--space-6` | 24px | Large padding |
| `--space-8` | 32px | Section margins |

---

## Shadows & Radii

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 10px 28px rgba(...)` | Cards, tiles |
| `--shadow-md` | `0 20px 56px rgba(...)` | Modals, elevated cards |
| `--radius-sm` | 10px | Inputs, badges |
| `--radius-md` | 12px | Buttons, stat cards |
| `--radius-lg` | 18px | Modals, main cards |

---

## Z-Index Layers

| Value | Usage |
|---|---|
| 30 | Sticky nav (marketing nav) |
| 45 | Sidebar |
| 50 | Topbar |
| 60 | Modal backdrop |
| 70 | Toast notifications |
| 75 | Menu / dropdown panels |
| 80 | Tooltips |
| 100 | Search modal overlay |
| 150 | Mobile nav drawer |
| 200 | Mobile menu overlay |

---

## Component API Contracts

### Button
**File**: `components/ui/Button.jsx`
```jsx
<Button variant="primary|secondary|danger|ghost" size="sm|md|lg" loading={bool}>
  Label
</Button>
```

### Card / CardHeader
**File**: `components/ui/Card.jsx`
```jsx
<Card>
  <CardHeader title="..." subtitle="..." action={<Button>...</Button>} />
  ... children ...
</Card>
```

### Modal
**File**: `components/ui/Modal.jsx`
```jsx
<Modal isOpen={bool} onClose={fn} title="..." description="..." wide={bool}>
  ... form or content ...
</Modal>
```

### EmptyState
**File**: `components/ui/EmptyState.jsx`
```jsx
<EmptyState icon="..." title="..." description="..." action={<Button>...</Button>} />
```

### TabBar
**File**: `components/ui/TabBar.jsx`
```jsx
<TabBar tabs={[{key: 'tab1', label: 'Tab 1', icon: <svg>}]} activeKey={key} onChange={fn} size="md|sm" />
```

### Badge
**File**: `components/ui/Badge.jsx`
```jsx
<Badge variant="neutral|success|warning|danger|info|active">Label</Badge>
```

### Table
**File**: `components/ui/Table.jsx`
```jsx
<Table
  columns={[{key, header, render, sortable}]}
  rows={data}
  getRowKey={(r) => r.id}
  selected={selectedIds}
  onSelectionChange={fn}
  loading={bool}
  emptyState={<EmptyState .../>}
/>
```

### Input
**File**: `components/ui/Input.jsx`
```jsx
<Input label="..." value={...} onChange={fn} error="..." helper="..." type="..." />
```

### Select
**File**: `components/ui/Select.jsx`
```jsx
<Select label="..." value={...} onChange={fn} options={[{value, label}]} error="..." />
```

### Pagination
**File**: `components/ui/Pagination.jsx`
```jsx
<Pagination page={n} pageCount={n} total={n} pageSize={n} onPageChange={fn} />
```

### Skeleton / SkeletonRows
**File**: `components/ui/Skeleton.jsx`
```jsx
<SkeletonRows rows={4} />
<Skeleton className="..." style={{...}} />
```

### ConfirmDialog
**File**: `components/ui/ConfirmDialog.jsx`
```jsx
<ConfirmDialog
  isOpen={bool} onClose={fn} onConfirm={fn}
  title="Delete?" description="This cannot be undone."
  confirmLabel="Delete" cancelLabel="Cancel" danger={bool} loading={bool}
/>
```

---

## Layout Conventions

### Module Page Pattern
Every module follows this structure:
```
.panel
  button.back-link  ← "← Back to workspace" (or ModulePage `back` prop)
  .module-head
    h1              ← Module name (or ModulePage `title` prop)
    p.module-sub    ← Module description (or ModulePage `description` prop)
    (optional primary action button)
  .stats-row        ← Stat cards (or ModulePage `stats` prop)
  .toolbar-row      ← Search/filter bar (or ModulePage `toolbar` prop)
  ... content       ← Table, kanban, grid, form
```

Use `<ModulePage>` from `components/ui/ModulePage.jsx` for consistency.

### Auth Page Pattern
```
div.auth-view
  div.auth-shell (grid: 1.05fr brand intro : minmax(360px, 460px) form card)
    div.auth-intro ← Branding, tagline, feature points
    div.auth-card  ← Form title, form, optional footer
```

### Marketing Page Pattern
```
div (min-height: 100vh, flex column)
  MarketingNav
  section (hero with gradient background)
  section (trust bar / stats)
  section (feature showcase)
  section (testimonials)
  section (pricing preview)
  section (FAQ)
  MarketingCTA (gradient band)
  MarketingFooter
```

---

## Migration Guide

To convert a hand-rolled module to use ModulePage:

1. Import `<ModulePage>` from `components/ui/ModulePage`
2. Replace `.panel > .back-link + .module-head > h1 + .module-sub` → `<ModulePage back title description>`
3. Extract stats into `stats` prop array `[{label, value}]`
4. Extract toolbar into `toolbar` prop
5. Wrap remaining content as children
6. Replace raw `<button>` → `<Button>` component
7. Replace raw `<table>` → `<Table>` component
8. Replace `form-input` class → `<Input>` component or `field-input` class

---

## CSS Class Reference

### Utility
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost` — button variants
- `.btn-sm`, `.btn-md`, `.btn-lg` — button sizes
- `.card`, `.card-shell` — card surface
- `.badge-pill`, `.badge-{variant}` — badge
- `.field`, `.field-label`, `.field-input`, `.field-select`, `.field-textarea`, `.field-helper`, `.field-error` — form fields
- `.modal-backdrop`, `.modal-card`, `.modal-header`, `.modal-body`, `.modal-close`, `.modal-actions` — modal structure
- `.tile`, `.tile-grid`, `.tile-icon`, `.tile-name`, `.tile-status` — module tile grid
- `.state-viewport`, `.state-panel`, `.state-icon`, `.state-title`, `.state-description`, `.state-action` — error/loading states
- `.skeleton`, `.skeleton-row`, `.skeleton-stack` — loading placeholders
