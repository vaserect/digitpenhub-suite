'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPageAnalytics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('recordings');
  const [recordings, setRecordings] = useState([]);
  const [pages, setPages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    pageUrl: '',
    deviceType: '',
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'recordings') loadRecordings();
    else if (activeTab === 'pages') loadPages();
    else if (activeTab === 'analytics') loadAnalytics();
  }, [activeTab, filters]);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.pageUrl) params.append('pageUrl', filters.pageUrl);
      if (filters.deviceType) params.append('deviceType', filters.deviceType);
      
      const res = await fetch(`/api/v1/heatmaps?${params}`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setRecordings(data.recordings || []);
    } catch (err) {
      console.error('Error loading recordings:', err);
    }
    setLoading(false);
  };

  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/heatmaps/pages', {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
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
      const res = await fetch(`/api/v1/heatmaps/analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Landing Page Analytics</h1>
        <p className="text-gray-600">Track visitor behavior with heatmaps and session recordings</p>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          {['recordings', 'pages', 'analytics', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Page URL</label>
            <input
              type="text"
              value={filters.pageUrl}
              onChange={(e) => setFilters({...filters, pageUrl: e.target.value})}
              placeholder="Filter by URL"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Device</label>
            <select
              value={filters.deviceType}
              onChange={(e) => setFilters({...filters, deviceType: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">All Devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'recordings' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Session Recordings</h2>
              </div>
              <div className="divide-y">
                {recordings.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No recordings found. Install the tracking script on your pages to start collecting data.
                  </div>
                ) : (
                  recordings.map(rec => (
                    <div key={rec.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{rec.page_title || 'Untitled Page'}</h3>
                          <p className="text-sm text-gray-600 mt-1">{rec.page_url}</p>
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>⏱️ {rec.duration_secs}s</span>
                            <span>🖱️ {rec.click_count} clicks</span>
                            <span>📱 {rec.device_type}
</span>
                            {rec.has_rage_clicks && <span className="text-red-600">⚠️ Rage clicks</span>}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(rec.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'pages' && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Tracked Pages</h2>
              </div>
              <div className="divide-y">
                {pages.map(page => (
                  <div key={page.page_url} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{page.page_title || 'Untitled'}</h3>
                        <p className="text-sm text-gray-600">{page.page_url}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{page.session_count}</div>
                        <div className="text-sm text-gray-500">sessions</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {!filters.pageUrl ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">Please select a page URL to view analytics</p>
                </div>
              ) : analytics ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-sm text-gray-600">Total Sessions</div>
                      <div className="text-2xl font-bold mt-1">{analytics.total_sessions || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-sm text-gray-600">Unique Visitors</div>
                      <div className="text-2xl font-bold mt-1">{analytics.unique_visitors || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-sm text-gray-600">Avg Duration</div>
                      <div className="text-2xl font-bold mt-1">{Math.round(analytics.avg_session_duration || 0)}s</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-sm text-gray-600">Avg Scroll Depth</div>
                      <div className="text-2xl font-bold mt-1">{Math.round(analytics.avg_scroll_depth || 0)}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-sm text-gray-600">Total Clicks</div>
                      <div className="text-2xl font-bold mt-1">{analytics.total_clicks || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-sm text-gray-600">Rage Clicks</div>
                      <div className="text-2xl font-bold mt-1 text-red-600">{analytics.rage_clicks || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                      <div className="text-sm text-gray-600">Form Submits</div>
                      <div className="text-2xl font-bold mt-1 text-green-600">{analytics.form_submits || 0}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">No analytics data available</div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Tracking Settings</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Installation</h3>
                  <p className="text-sm text-gray-700 mb-3">Add this script to your pages to start tracking:</p>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<script src="https://suite.digitpenhub.com/tracking.js"></script>
<script>
  DigitpenTracker.init({
    orgId: '${user?.orgId || 'YOUR_ORG_ID'}',
    trackClicks: true,
    trackScrolls: true,
    trackMouse: true
  });
</script>`}
                  </pre>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Configure tracking settings per page pattern in the API or contact support for advanced configuration.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
