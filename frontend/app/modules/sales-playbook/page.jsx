'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Plus, BookOpen, Swords, BarChart3 } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

export default function SalesPlaybook() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('playbooks');
  const [playbooks, setPlaybooks] = useState([]);
  const [battlecards, setBattlecards] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises = [fetchStatistics()];
      if (activeTab === 'playbooks') {
        promises.push(fetchPlaybooks());
      } else {
        promises.push(fetchBattlecards());
      }
      await Promise.all(promises);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaybooks = async () => {
    try {
      const data = await apiFetch('/api/v1/sales-playbook/playbooks');
      setPlaybooks(data.data || []);
    } catch (error) {
      console.error('Error fetching playbooks:', error);
    }
  };

  const fetchBattlecards = async () => {
    try {
      const data = await apiFetch('/api/v1/sales-playbook/battlecards');
      setBattlecards(data.data || []);
    } catch (error) {
      console.error('Error fetching battlecards:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await apiFetch('/api/v1/sales-playbook/statistics');
      if (data.success) setStatistics(data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await apiFetch(`/api/v1/sales-playbook/${type}/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Sales Playbook & Battlecard Library</h1>
        <p className="mt-2 text-gray-600">Manage sales playbooks and competitive battlecards</p>
      </div>

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Content</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{statistics.total_content || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Playbooks</p>
                <p className="mt-1 text-3xl font-bold text-blue-600">{statistics.playbooks?.total_playbooks || 0}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Battlecards</p>
                <p className="mt-1 text-3xl font-bold text-purple-600">{statistics.battlecards?.total_battlecards || 0}</p>
              </div>
              <Swords className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Views</p>
                <p className="mt-1 text-3xl font-bold text-green-600">{statistics.total_views || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6">
          <div className="flex items-center justify-between">
            <nav className="flex -mb-px space-x-6">
              <button
                onClick={() => setActiveTab('playbooks')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'playbooks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Playbooks
              </button>
              <button
                onClick={() => setActiveTab('battlecards')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'battlecards'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Swords className="w-4 h-4 inline mr-2" />
                Battlecards
              </button>
            </nav>
            <button
              onClick={() => router.push(
                activeTab === 'playbooks'
                  ? '/modules/sales-playbook/playbooks/create'
                  : '/modules/sales-playbook/battlecards/create'
              )}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              New {activeTab === 'playbooks' ? 'Playbook' : 'Battlecard'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'playbooks' ? (
            playbooks.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No playbooks yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Create your first sales playbook to document winning sales processes, objection handling, and deal strategies.
                </p>
                <button
                  onClick={() => router.push('/modules/sales-playbook/playbooks/create')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Create Playbook
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {playbooks.map((playbook) => (
                  <div
                    key={playbook.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => router.push(`/modules/sales-playbook/playbooks/${playbook.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{playbook.title}</h3>
                        {playbook.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{playbook.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          {playbook.category && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full">{playbook.category}</span>
                          )}
                          <span className={`px-2 py-1 rounded-full ${
                            playbook.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>{playbook.status}</span>
                          <span>{playbook.view_count || 0} views</span>
                          <span>{(parseFloat(playbook.avg_rating) || 0).toFixed(1)} ⭐</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            battlecards.length === 0 ? (
              <div className="text-center py-16">
                <Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No battlecards yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Create competitive battlecards to track competitor strengths, weaknesses, and winning strategies.
                </p>
                <button
                  onClick={() => router.push('/modules/sales-playbook/battlecards/create')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Create Battlecard
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {battlecards.map((card) => (
                  <div
                    key={card.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => router.push(`/modules/sales-playbook/battlecards/${card.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{card.competitor_name}</h3>
                        {card.overview && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{card.overview}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded-full ${
                            card.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>{card.status}</span>
                          <span>{card.view_count || 0} views</span>
                          <span>{(parseFloat(card.avg_rating) || 0).toFixed(1)} ⭐</span>
                          {card.strengths?.length > 0 && <span>💪 {card.strengths.length} strengths</span>}
                          {card.weaknesses?.length > 0 && <span>⚠️ {card.weaknesses.length} weaknesses</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
