'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch, setUpgradeHandler } from '../../lib/api';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Button from './Button';
import Modal from './Modal';
import { toast } from 'sonner';

export const WorkspaceContext = createContext(null);

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

function initials(name) {
  if (!name) return 'D';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function WorkspaceLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [orgPlan, setOrgPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [upgradePrompt, setUpgradePrompt] = useState(null);

  const [view, setView] = useState('home'); // home | category | search | module
  const [activeCategoryKey, setActiveCategoryKey] = useState(null);
  const [activeModuleSlug, setActiveModuleSlug] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [helpOpen, setHelpOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('dph-sidebar-collapsed') === 'true';
  });
  const [recentModules, setRecentModules] = useState(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('dph-recent-modules') || '[]'); }
    catch { return []; }
  });
  const [pinnedSlugs, setPinnedSlugs] = useState(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('dph-pinned-modules') || '[]'); }
    catch { return []; }
  });

  const [notifList, setNotifList] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifIntervalRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    setUpgradeHandler((data) => {
      setUpgradePrompt({
        title: data.limitReached ? 'Plan limit reached' : 'Upgrade required',
        message: data.error,
      });
    });
    return () => setUpgradeHandler(null);
  }, []);

  function toggleSidebarCollapsed() {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('dph-sidebar-collapsed', String(next));
      return next;
    });
  }

  function togglePin(slug) {
    setPinnedSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      window.localStorage.setItem('dph-pinned-modules', JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('dph-theme', theme);
  }, [theme]);

  // Sync theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('dph-theme');
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        const darkPreferred = window.matchMedia('(prefers-color-scheme:dark)').matches;
        setTheme(darkPreferred ? 'dark' : 'light');
      }
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'b') { e.preventDefault(); router.push('/billing'); return; }
        if (e.key === ',') { e.preventDefault(); router.push('/account'); return; }
        return;
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
        setHelpOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const meRes = await apiFetch('/api/v1/auth/me');
      setUser(meRes.user);
    } catch (err) {
      window.location.href = '/login';
      return;
    }

    try {
      const modulesRes = await apiFetch('/api/v1/modules');
      setCategories(modulesRes.categories || []);
      setOrgPlan(modulesRes.plan || null);
    } catch (err) {
      setLoadError(err.message || 'Could not load the workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Sync pathname to navigation state
  useEffect(() => {
    if (pathname === '/') {
      setView('home');
      setActiveCategoryKey(null);
      setActiveModuleSlug(null);
    } else {
      setView('module');
      // Infer module slug from pathname
      const slug = pathname.replace(/^\//, '');
      setActiveModuleSlug(slug);
    }
  }, [pathname]);

  // Notification polling
  useEffect(() => {
    function pollCount() {
      apiFetch('/api/v1/notifications/unread-count')
        .then((d) => setNotifCount(d.count || 0))
        .catch((e) => console.error(e));
    }
    pollCount();
    notifIntervalRef.current = setInterval(pollCount, 30000);
    return () => clearInterval(notifIntervalRef.current);
  }, []);

  function toggleNotifPanel() {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening && notifList.length === 0) {
      apiFetch('/api/v1/notifications')
        .then((d) => setNotifList(d.notifications || []))
        .catch((e) => console.error(e));
    }
  }

  function handleMarkRead(id) {
    apiFetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' }).catch((e) => console.error(e));
    setNotifList((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setNotifCount((c) => Math.max(0, c - 1));
  }

  function handleMarkAllRead() {
    apiFetch('/api/v1/notifications/mark-all-read', { method: 'POST' }).catch((e) => console.error(e));
    setNotifList((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setNotifCount(0);
  }

  async function handleSignOut() {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  }

  function isModuleLocked(slug) {
    if (!orgPlan) return false;
    if (orgPlan.allModules) return false;
    const freeSlugs = new Set(['crm', 'lead-generation', 'invoices']);
    if (freeSlugs.has(slug)) return false;
    for (const cat of categories) {
      const mod = cat.modules?.find((m) => m.slug === slug);
      if (mod) return !!mod.locked;
    }
    return false;
  }

  function openModule(slug) {
    if (isModuleLocked(slug)) {
      const modName = categories.flatMap((c) => c.modules || []).find((m) => m.slug === slug)?.name || 'This module';
      setUpgradePrompt({
        title: `${modName} needs a paid plan`,
        message: `${modName} isn't included in the Free plan. Upgrade to Starter or higher to unlock it, along with every other module.`,
      });
      setNavOpen(false);
      return;
    }

    // Add to recent modules
    setRecentModules((prev) => {
      const filtered = prev.filter((s) => s !== slug);
      const next = [slug, ...filtered].slice(0, 5);
      window.localStorage.setItem('dph-recent-modules', JSON.stringify(next));
      return next;
    });

    const extracted = {
      'crm': '/crm',
      'invoices': '/billing-invoices',
      'email-marketing': '/email-marketing',
      'project-management': '/project-management',
      'lead-generation': '/lead-generation',
      'website-builder': '/website-builder',
      'funnel-builder': '/funnel-builder',
      'hr': '/hr',
      'recruitment': '/recruitment',
      'inventory': '/inventory',
      'calendar': '/calendar',
      'knowledge-base': '/knowledge-base',
      'help-desk': '/help-desk',
      'expenses': '/expenses',
      'contracts': '/contracts',
      'quotations': '/quotations',
      'url-shortener': '/url-shortener',
      'task-management': '/tasks',
      'time-tracking': '/time-tracking',
      'notes': '/notes',
      'coupons': '/coupons',
      'forms': '/forms',
      'payroll': '/payroll',
      'accounting': '/accounting',
      'subscriptions': '/subscriptions',
      'appointment-booking': '/appointments',
      'affiliate-system': '/affiliates',
      'referral-program': '/referrals',
      'delivery-tracking': '/delivery-tracking',
      'password-manager': '/password-manager',
      'certificate-generator': '/certificates',
      'color-palette-generator': '/color-palettes',
      'custom-reports': '/custom-reports',
      'brand-kit': '/brand-kit',
      'digital-products': '/digital-products',
      'asset-management': '/asset-management',
      'document-management': '/documents',
      'commerce': '/commerce',
      'education': '/education',
      'marketing-automation': '/marketing-automation',
      'whatsapp-marketing': '/whatsapp-marketing',
      'sms-marketing': '/sms-marketing',
      'seo-audit': '/seo',
      'rank-tracking': '/seo',
      'keyword-research': '/seo',
      'backlink-monitoring': '/seo',
      'local-seo': '/seo',
      'page-speed': '/seo',
      'ai-content-optimizer': '/seo',
      'lead-scoring': '/lead-scoring',
      'pipeline-deals': '/pipeline-deals',
      'chatbot-builder': '/chatbot-builder',
      'community': '/community',
      'review-management': '/review-management',
      'digital-business-cards': '/digital-business-cards',
      'link-in-bio': '/link-in-bio',
      'qr-code-generator': '/qr-code-generator',
      'quiz-builder': '/quiz-builder',
      'survey-builder': '/survey-builder',
      'popup-builder': '/popup-builder',
      'social-media-scheduler': '/social-media-scheduler',
      'inbox': '/inbox',
      'business-dashboard': '/business-dashboard',
      'builder': '/builder',
      'ambassador-portal': '/ambassador-portal',
    };

    const targetPath = extracted[slug] || '/';
    router.push(targetPath);
    setNavOpen(false);
  }

  function openCategory(key) {
    setActiveCategoryKey(key);
    setView('category');
    router.push(`/?category=${key}`);
    setNavOpen(false);
  }

  function goHome() {
    setView('home');
    setActiveCategoryKey(null);
    router.push('/');
    setNavOpen(false);
  }

  function liveCount(cat) {
    return (cat.modules || []).filter((m) => m.status === 'active').length;
  }

  const moduleCategories = categories.filter((c) => c.tier === 1);
  const totalModules = moduleCategories.reduce((sum, c) => sum + (c.modules?.length || 0), 0);
  const activeModules = moduleCategories.reduce((sum, c) => sum + (c.modules?.filter(m => m.status === 'active').length || 0), 0);

  const pinnedModules = categories
    .flatMap((c) => c.modules || [])
    .filter((m) => pinnedSlugs.includes(m.slug));

  if (loading) {
    return (
      <div className="panel" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Loading workspace</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pulling your modules, navigation, and current workspace settings.</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="panel" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--danger, #ef4444)', marginBottom: 8 }}>Couldn&apos;t load the workspace</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>{loadError}</div>
          <Button onClick={loadWorkspace}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceContext.Provider value={{
      user,
      categories,
      orgPlan,
      totalModules,
      activeModules,
      pinnedModules,
      pinnedSlugs,
      togglePin,
      recentModules,
      openModule,
      openCategory,
      goHome,
      liveCount,
      theme,
      setTheme,
      notifCount,
      notifList,
      notifOpen,
      toggleNotifPanel,
      handleMarkRead,
      handleMarkAllRead,
    }}>
      <div>
        <Topbar
          title="Digitpen Hub"
          subtitle="Business Suite workspace"
          user={{ initials: initials(user?.fullName) }}
          onSignOut={handleSignOut}
          onAccountClick={() => router.push('/account')}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          theme={theme}
          notifCount={notifCount}
          notifOpen={notifOpen}
          notifList={notifList}
          onBellClick={toggleNotifPanel}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onToggleSidebar={() => setNavOpen((v) => !v)}
        />

        <div className={["app-shell", navOpen ? 'nav-open' : '', sidebarCollapsed ? 'sidebar-collapsed' : ''].filter(Boolean).join(' ')}>
          <Sidebar
            moduleCategories={moduleCategories}
            view={view}
            activeCategoryKey={activeCategoryKey}
            activeModuleSlug={activeModuleSlug}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapsed}
            onHome={goHome}
            onCategory={openCategory}
            onModule={openModule}
            liveCount={liveCount}
            onBilling={() => router.push('/billing')}
            onAccount={() => router.push('/account')}
            onWhiteLabel={() => router.push('/white-label')}
            pinnedSlugs={pinnedSlugs}
            onTogglePin={togglePin}
            expandedCats={{}}
            onToggleCategory={() => {}}
          />
          <div className={["sidebar-backdrop", navOpen ? 'show' : ''].filter(Boolean).join(' ')} onClick={() => setNavOpen(false)} />

          <div className="main" ref={mainRef}>
            {user && !user.emailVerified && (
              <div style={{ background: 'var(--warning-bg, #fef9c3)', color: 'var(--warning-text, #92400e)', padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', zIndex: 10 }}>
                <span>⚠️ Please verify your email address. Check your inbox (including spam) for the verification link.</span>
                <button className="btn btn-sm" style={{ fontSize: 12 }} onClick={async () => { try { await apiFetch('/api/v1/auth/me/resend-verification', { method: 'POST' }); toast.success('Verification email sent!'); } catch (e) { toast.error(e.message); } }}>Resend</button>
              </div>
            )}
            {children}
          </div>
        </div>

        {upgradePrompt && (
          <Modal isOpen title={upgradePrompt.title} onClose={() => setUpgradePrompt(null)}>
            <div style={{ padding: '4px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>{upgradePrompt.message}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Button onClick={() => setUpgradePrompt(null)} variant="ghost">Cancel</Button>
                <Button onClick={() => { setUpgradePrompt(null); router.push('/billing'); }}>View pricing plans</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </WorkspaceContext.Provider>
  );
}
