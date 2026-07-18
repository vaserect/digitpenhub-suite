'use client';

import { useState, useEffect } from 'react';

export default function SalesPlaybook() {
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
      if (activeTab === 'playbooks') {
        await fetchPlaybooks();
      } else {
        await fetchBattlecards();
      }
      await fetchStatistics();
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaybooks = async () => {
    try {
      const response = await fetch('/api/v1/sales-playbook/playbooks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setPlaybooks(data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchBattlecards = async () => {
    try {
      const response = await fetch('/api/v1/sales-playbook/battlecards', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setBattlecards(data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/v1/sales-playbook/statistics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setStatistics(data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Playbook & Battlecard Library</h1>
          <p className="mt-2 text-gray-600">Manage sales playbooks and competitive battlecards</p>
        </div>

        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Total Content</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{statistics.total_content || 0}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Playbooks</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">{statistics.playbooks?.total_playbooks || 0}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Battlecards</div>
              <div className="mt-2 text-3xl font-bold text-purple-600">{statistics.battlecards?.total_battlecards || 0}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Total Views</div>
              <div className="mt-2 text-3xl font-bold text-green-600">{statistics.total_views || 0}</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('playbooks')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'playbooks'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Playbooks
              </button>
              <button
                onClick={() => setActiveTab('battlecards')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'battlecards'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Battlecards
              </button>
            </nav>
          </div>

          <div className="p-6">
            <div className="text-center py-12">
              <h3 className="text-sm font-medium text-gray-900">
                {activeTab === 'playbooks' ? 'No playbooks yet' : 'No battlecards yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating content.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
