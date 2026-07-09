'use client';

import { create } from 'zustand';
import { apiFetch } from '../lib/api';

// ── Shared store for the signed-in workspace ──────────────────────────────────
// Replaces AppShell's top-level useState for auth, modules, theme, and
// notifications so extracted page files can access them without prop drilling.
//
// Load order:
//   1. User + session (from /auth/me)
//   2. Categories + modules (from /modules)
//   3. Notifications (polled every 30s)

const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
  orgPlan: null,
  loading: true,
  loadError: null,

  setUser: (user) => set({ user }),
  setOrgPlan: (plan) => set({ orgPlan: plan }),
  setLoading: (loading) => set({ loading }),
  setLoadError: (err) => set({ loadError: err, loading: false }),

  // ── Modules ───────────────────────────────────────────────────────────────
  categories: [],
  setCategories: (categories) => set({ categories }),

  // ── Navigation ────────────────────────────────────────────────────────────
  // The monolith uses view='account' / view='billing' / view='module'.
  // Extracted pages use real routes; this state remains for the inline
  // modules that haven't been extracted yet.
  view: 'home',
  activeCategoryKey: null,
  activeModuleSlug: null,
  sidebarSearch: '',
  expandedCats: {},
  pinnedSlugs: [],

  setView: (view) => set({ view }),
  setActiveCategoryKey: (key) => set({ activeCategoryKey: key }),
  setActiveModuleSlug: (slug) => set({ activeModuleSlug: slug }),
  setSidebarSearch: (q) => set({ sidebarSearch: q }),
  setExpandedCats: (fn) => set((s) => ({ expandedCats: typeof fn === 'function' ? fn(s.expandedCats) : fn })),
  setPinnedSlugs: (fn) => set((s) => ({ pinnedSlugs: typeof fn === 'function' ? fn(s.pinnedSlugs) : fn })),

  goHome: () => set({ view: 'home', activeCategoryKey: null, activeModuleSlug: null }),
  openCategory: (key) => set({ view: 'category', activeCategoryKey: key, activeModuleSlug: null }),
  openModule: (slug) => set({ view: 'module', activeModuleSlug: slug, activeCategoryKey: null }),

  // ── Theme ─────────────────────────────────────────────────────────────────
  theme: 'dark',
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('dph-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifCount: 0,
  notifOpen: false,
  notifList: [],
  setNotifCount: (count) => set({ notifCount: count }),
  setNotifOpen: (open) => set({ notifOpen: open }),
  setNotifList: (list) => set({ notifList: list }),

  toggleNotifPanel: () => set((s) => ({ notifOpen: !s.notifOpen })),

  // ── Toast (legacy — new code should use sonner's toast() directly) ────────
  toastMessage: '',
  setToast: (msg) => set({ toastMessage: msg }),
  clearToast: () => set({ toastMessage: '' }),

  // ── Init: load user + modules ─────────────────────────────────────────────
  init: async () => {
    try {
      const meRes = await apiFetch('/api/v1/auth/me');
      set({ user: meRes.user });

      const modRes = await apiFetch('/api/v1/modules');
      set({ categories: modRes.categories || [], orgPlan: modRes.plan || null });
    } catch (err) {
      if (err.message === 'Not signed in.' || err.message.includes('401')) {
        window.location.href = '/login';
        return;
      }
      set({ loadError: err.message || 'Could not load workspace.' });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useStore;
