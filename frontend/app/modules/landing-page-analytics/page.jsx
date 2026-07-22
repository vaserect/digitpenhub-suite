'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import { Eye, MousePointer2, BarChart3, Settings, HelpCircle } from 'lucide-react';

const TABS = [
  { key: 'recordings', label: 'Session Recordings', icon: Eye },
  { key: 'pages', label: 'Tracked Pages', icon: BarChart3 },
  { key: 'heatmap', label: 'Heatmap', icon: MousePointer2 },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Tracking Setup', icon: Settings },
];

export default function LandingPageAnalytics() {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const [activeTab, setActiveTab] = useState('recordings');
  const [recordings, setRecordings] = useState([]);
  const [pages, setPages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [filters, setFilters] = useState({
    pageUrl: '',
    deviceType: '',
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [heatmapType, setHeatmapType] = useState('click');
  const [heatDensity, setHeatDensity] = useState(0);

  useEffect(() => {
    if (activeTab === 'recordings') loadRecordings();
    else if (activeTab === 'pages') loadPages();
    else if (activeTab === 'analytics') loadAnalytics();
    else if (activeTab === 'heatmap') loadHeatmap();
  }, [activeTab, filters]);

  useEffect(() => {
    if (activeTab === 'heatmap' && heatmapData.length > 0 && canvasRef.current) {
      renderHeatmap();
    }
  }, [heatmapData, heatmapType, activeTab]);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.pageUrl) params.append('pageUrl', filters.pageUrl);
      if (filters.deviceType) params.append('deviceType', filters.deviceType);

      const data = await apiFetch(`/api/v1/heatmaps?${params}`);
      setRecordings(data.recordings || []);
    } catch (err) {
      console.error('Error loading recordings:', err);
    }
    setLoading(false);
  };

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/v1/heatmaps/pages');
      setPages(data.pages || []);
    } catch (err) {
      console.error('Error loading pages:', err);
    }
    setLoading(false);
  };

  const loadAnalytics = async () => {
    if (!filters.pageUrl) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageUrl: filters.pageUrl,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });
      const data = await apiFetch(`/api/v1/heatmaps/analytics?${params}`);
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
    setLoading(false);
  };

  const loadHeatmap = useCallback(async () => {
    if (!filters.pageUrl) return;
    setHeatmapLoading(true);
    try {
      const params = new URLSearchParams({
        pageUrl: filters.pageUrl,
        type: heatmapType,
        viewportWidth: '1920',
        viewportHeight: '1080'
      });
      const data = await apiFetch(`/api/v1/heatmaps/heatmap?${params}`);
      if (data.heatmap?.points) {
        setHeatmapData(data.heatmap.points);
      } else if (data.heatmap?.raw_points) {
        setHeatmapData(data.heatmap.raw_points);
      } else {
        // Try fetching click events directly
        const clickRes = await apiFetch(`/api/v1/heatmaps?pageUrl=${encodeURIComponent(filters.pageUrl)}&limit=200`);
        const allClicks = [];
        (clickRes.recordings || []).forEach(rec => {
          if (rec.events) {
            try {
              const events = typeof rec.events === 'string' ? JSON.parse(rec.events) : rec.events;
              events.forEach(ev => {
                if (ev.type === 'click' && ev.x && ev.y) {
                  allClicks.push({ x: ev.x, y: ev.y, weight: 1 });
                }
              });
            } catch (e) { /* skip parse errors */ }
          }
        });
        setHeatmapData(allClicks);
      }
      setHeatDensity(data.heatmap?.total_points || heatmapData.length);
    } catch (err) {
      console.error('Error loading heatmap:', err);
    }
    setHeatmapLoading(false);
  }, [filters.pageUrl, heatmapType]);

  const renderHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas || heatmapData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw grid
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw click points as a heat gradient
    const maxIntensity = Math.max(1, heatmapData.length);
    const radius = 25;

    // Draw each click as a radial gradient dot
    heatmapData.forEach(point => {
      const intensity = (point.weight || 1) / maxIntensity;
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, radius
      );
      gradient.addColorStop(0, `rgba(255, 0, 0, ${Math.min(0.8, 0.2 + intensity * 0.6)})`);
      gradient.addColorStop(0.4, `rgba(255, 100, 0, ${Math.min(0.5, 0.1 + intensity * 0.4)})`);
      gradient.addColorStop(0.7, `rgba(255, 200, 0, ${Math.min(0.2, 0.05 + intensity * 0.15)})`);
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw point density circles for high-traffic areas
    const gridSize = 40;
    const grid = {};
    heatmapData.forEach(point => {
      const gx = Math.floor(point.x / gridSize);
      const gy = Math.floor(point.y / gridSize);
      const key = `${gx},${gy}`;
      if (!grid[key]) grid[key] = { x: gx * gridSize + gridSize / 2, y: gy * gridSize + gridSize / 2, count: 0 };
      grid[key].count++;
    });

    const maxCount = Math.max(1, ...Object.values(grid).map(g => g.count));
    Object.values(grid).forEach(cell => {
      if (cell.count < 2) return;
      const ratio = cell.count / maxCount;
      const r = 5 + ratio * 15;
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 38, 38, ${0.1 + ratio * 0.4})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.2 + ratio * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Landing Page Analytics</h1>
        <p className="text-gray-600">Track visitor behavior with heatmaps and session recordings</p>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters — hide filter row on settings tab */}
      {activeTab !== 'settings' && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Page URL</label>
              <input
                type="text"
                value={filters.pageUrl}
                onChange={(e) => setFilters({...filters, pageUrl: e.target.value})}
                placeholder="Filter by URL"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Device</label>
              <select
                value={filters.deviceType}
                onChange={(e) => setFilters({...filters, deviceType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">All Devices</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading || heatmapLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'recordings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Session Recordings</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recordings.length === 0 ? (
                  <div className="p-12 text-center">
                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4 max-w-md mx-auto">
                      No recordings found. Install the tracking script on your pages to start collecting visitor behavior data.
                    </p>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Setup Instructions →
                    </button>
                  </div>
                ) : (
                  recordings.map(rec => (
                    <div key={rec.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{rec.page_title || 'Untitled Page'}</h3>
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{rec.page_url}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                            <span>⏱️ {rec.duration_secs || 0}s</span>
                            <span>🖱️ {rec.click_count || 0} clicks</span>
                            <span>📱 {rec.device_type || 'unknown'}</span>
                            <span>📄 {rec.events ? (typeof rec.events === 'string' ? JSON.parse(rec.events).length : rec.events.length) : 0} events</span>
                            {rec.has_rage_clicks && <span className="text-red-600 font-medium">⚠️ Rage clicks</span>}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 ml-4 shrink-0">
                          {new Date(rec.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">Tracked Pages</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {pages.length === 0 ? (
                  <div className="p-12 text-center">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No pages tracked yet. Install the tracking script first.</p>
                  </div>
                ) : (
                  pages.map(page => (
                    <div key={page.page_url} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">{page.page_title || 'Untitled'}</h3>
                          <p className="text-sm text-gray-500 truncate">{page.page_url}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-blue-600">{page.session_count}</div>
                          <div className="text-xs text-gray-500">sessions</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'heatmap' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <select
                  value={heatmapType}
                  onChange={(e) => setHeatmapType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="click">Click Heatmap</option>
                  <option value="scroll">Scroll Depth</option>
                  <option value="mouse">Mouse Movement</option>
                </select>
                <span className="text-xs text-gray-500">
                  {heatmapData.length > 0 ? `${heatmapData.length} data points` : 'No data'}
                </span>
                <button
                  onClick={loadHeatmap}
                  className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Refresh
                </button>
                {!filters.pageUrl && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 ml-2">
                    <HelpCircle className="w-4 h-4" />
                    Enter a page URL above to view heatmap
                  </div>
                )}
              </div>

              {!filters.pageUrl ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                  <MousePointer2 className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-amber-700">Enter a page URL in the filter bar above and select a heatmap type to visualize click patterns.</p>
                </div>
              ) : heatmapData.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <MousePointer2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-1">No heatmap data for this page yet</p>
                  <p className="text-sm text-gray-400">Data appears after visitors interact with the page while the tracking script is installed.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {filters.pageUrl} — {heatmapData.length} clicks shown
                    </span>
                    <span className="text-xs text-gray-400">Grid: 40px</span>
                  </div>
                  <div className="relative bg-gray-50">
                    <canvas
                      ref={canvasRef}
                      width={1200}
                      height={800}
                      className="w-full"
                      style={{ minHeight: '400px' }}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                      <span className="w-3 h-3 rounded-full bg-red-500/30 inline-block"></span>
                      High
                      <span className="w-3 h-3 rounded-full bg-orange-300/30 inline-block ml-2"></span>
                      Medium
                      <span className="w-3 h-3 rounded-full bg-yellow-200/30 inline-block ml-2"></span>
                      Low
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {!filters.pageUrl ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
                  <BarChart3 className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-amber-700">Enter a page URL in the filter bar to view analytics.</p>
                </div>
              ) : analytics ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Sessions</div>
                      <div className="text-2xl font-bold mt-1 text-gray-900">{analytics.total_sessions || 0}</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Visitors</div>
                      <div className="text-2xl font-bold mt-1 text-blue-600">{analytics.unique_visitors || 0}</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Avg Duration</div>
                      <div className="text-2xl font-bold mt-1 text-gray-900">{Math.round(analytics.avg_session_duration || 0)}s</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Avg Scroll</div>
                      <div className="text-2xl font-bold mt-1 text-green-600">{Math.round(analytics.avg_scroll_depth || 0)}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Clicks</div>
                          <div className="text-2xl font-bold mt-1 text-gray-900">{analytics.total_clicks || 0}</div>
                        </div>
                        <MousePointer2 className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Rage Clicks</div>
                          <div className="text-2xl font-bold mt-1 text-red-600">{analytics.rage_clicks || 0}</div>
                        </div>
                        <HelpCircle className="w-8 h-8 text-red-400" />
                      </div>
                      <div className="mt-1 text-xs text-gray-400">3+ clicks in 1s within 50px</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Form Submits</div>
                          <div className="text-2xl font-bold mt-1 text-green-600">{analytics.form_submits || 0}</div>
                        </div>
                        <BarChart3 className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No analytics data available for this page.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Tracking Script Installation
              </h2>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <h3 className="font-medium mb-3">Step 1: Add the tracking script</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Add this code just before the closing <code className="bg-gray-200 px-1 rounded text-xs">&lt;/body&gt;</code> tag on every page you want to track:
                  </p>
                  <pre className="bg-gray-900 text-green-300 p-4 rounded-lg text-xs overflow-x-auto leading-relaxed">
{`<script src="/tracking.js"></script>
<script>
  DigitpenTracker.init({
    orgId: '${user?.orgId || 'YOUR_ORG_ID'}',
    trackClicks: true,
    trackScrolls: true,
    trackMouse: false,
    trackForms: true,
    trackErrors: true,
    samplingRate: 100,
    privacyMode: 'balanced'
  });
</script>`}
                  </pre>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <h3 className="font-medium mb-3">Step 2: Verify tracking</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Visit a page with the tracking script installed, then check the Session Recordings tab. Events will appear within seconds.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Clicks are recorded with X/Y coordinates and CSS selector</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Scroll depth is tracked with percentage and pixel depth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Rage clicks (3+ fast clicks in same area) are auto-detected</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Form submissions are tracked (password fields excluded)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Events are sent via navigator.sendBeacon — no data loss on page navigation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Do Not Track is respected — no data collected when enabled</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Configurable consent manager integration (Cookiebot, etc.)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <h3 className="font-medium mb-3">Configuration Options</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Option</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Type</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Default</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr><td className="py-2 px-3 font-mono text-xs">orgId</td><td className="py-2 px-3">string</td><td className="py-2 px-3">required</td><td className="py-2 px-3 text-gray-600">Your organization UUID</td></tr>
                        <tr><td className="py-2 px-3 font-mono text-xs">trackClicks</td><td className="py-2 px-3">boolean</td><td className="py-2 px-3">true</td><td className="py-2 px-3 text-gray-600">Track click events with coordinates</td></tr>
                        <tr><td className="py-2 px-3 font-mono text-xs">trackScrolls</td><td className="py-2 px-3">boolean</td><td className="py-2 px-3">true</td><td className="py-2 px-3 text-gray-600">Track scroll depth (throttled at 300ms)</td></tr>
                        <tr><td className="py-2 px-3 font-mono text-xs">trackMouse</td><td className="py-2 px-3">boolean</td><td className="py-2 px-3">false</td><td className="py-2 px-3 text-gray-600">Track mouse moves (sampled at 200ms)</td></tr>
                        <tr><td className="py-2 px-3 font-mono text-xs">trackForms</td><td className="py-2 px-3">boolean</td><td className="py-2 px-3">true</td><td className="py-2 px-3 text-gray-600">Track form submissions</td></tr>
                        <tr><td className="py-2 px-3 font-mono text-xs">samplingRate</td><td className="py-2 px-3">number</td><td className="py-2 px-3">100</td><td className="py-2 px-3 text-gray-600">Percentage of visitors to track (0-100)</td></tr>
                        <tr><td className="py-2 px-3 font-mono text-xs">privacyMode</td><td className="py-2 px-3">string</td><td className="py-2 px-3">balanced</td><td className="py-2 px-3 text-gray-600">balanced | strict | relaxed</td></tr>
                        <tr><td className="py-2 px-3 font-mono text-xs">consentManager</td><td className="py-2 px-3">function</td><td className="py-2 px-3">null</td><td className="py-2 px-3 text-gray-600">Custom consent check</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
