'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';

export default function BattlecardEditor() {
  const params = useParams();
  const router = useRouter();
  const [battlecard, setBattlecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    competitor_name: '',
    overview: '',
    strengths: [],
    weaknesses: [],
    differentiators: [],
    pricing_comparison: {},
    feature_comparison: {},
    win_strategies: [],
    objection_handling: [],
    market_position: '',
    status: 'draft'
  });

  useEffect(() => {
    if (params.id !== 'create') {
      fetchBattlecard();
    } else {
      setLoading(false);
    }
  }, [params.id]);

  const fetchBattlecard = async () => {
    try {
      const response = await fetch(`/api/v1/sales-playbook/battlecards/${params.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setBattlecard(data.data);
        setFormData({
          competitor_name: data.data.competitor_name,
          overview: data.data.overview || '',
          strengths: data.data.strengths || [],
          weaknesses: data.data.weaknesses || [],
          differentiators: data.data.differentiators || [],
          pricing_comparison: data.data.pricing_comparison || {},
          feature_comparison: data.data.feature_comparison || {},
          win_strategies: data.data.win_strategies || [],
          objection_handling: data.data.objection_handling || [],
          market_position: data.data.market_position || '',
          status: data.data.status
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = params.id === 'create'
        ? '/api/v1/sales-playbook/battlecards'
        : `/api/v1/sales-playbook/battlecards/${params.id}`;
      
      const method = params.id === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        if (params.id === 'create') {
          router.push(`/modules/sales-playbook/battlecards/${data.data.id}`);
        } else {
          fetchBattlecard();
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const addListItem = (field, value) => {
    if (value.trim()) {
      setFormData({ ...formData, [field]: [...formData[field], value] });
    }
  };

  const removeListItem = (field, index) => {
    setFormData({ 
      ...formData, 
      [field]: formData[field].filter((_, i) => i !== index) 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push('/modules/sales-playbook')}
              className="text-purple-600 hover:text-purple-700 mb-2"
            >
              ← Back to Battlecards
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {params.id === 'create' ? 'Create Battlecard' : 'Edit Battlecard'}
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Competitor Name *</label>
            <input
              type="text"
              value={formData.competitor_name}
              onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overview</label>
            <RichTextEditor
              value={formData.overview}
              onChange={(html) => setFormData({ ...formData, overview: html })}
              placeholder="Competitor overview..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Market Position</label>
            <textarea
              value={formData.market_position}
              onChange={(e) => setFormData({ ...formData, market_position: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {battlecard && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    battlecard.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {battlecard.status}
                  </span>
                </div>
                <div><span className="font-medium">Views:</span> {battlecard.view_count || 0}</div>
                <div><span className="font-medium">Rating:</span> {parseFloat(battlecard.avg_rating || 0).toFixed(1)} ⭐</div>
                <div><span className="font-medium">Favorites:</span> {battlecard.favorite_count || 0}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
