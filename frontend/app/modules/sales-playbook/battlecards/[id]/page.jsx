'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Plus, X } from 'lucide-react';
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
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');
  const [newDifferentiator, setNewDifferentiator] = useState('');

  useEffect(() => {
    if (params.id !== 'create') {
      fetchBattlecard();
    } else {
      setLoading(false);
    }
  }, [params.id]);

  const fetchBattlecard = async () => {
    try {
      const data = await apiFetch(`/api/v1/sales-playbook/battlecards/${params.id}`);
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
      console.error('Error fetching battlecard:', error);
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

      const data = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (data.success) {
        if (params.id === 'create') {
          router.push(`/modules/sales-playbook/battlecards/${data.data.id}`);
        } else {
          fetchBattlecard();
        }
      }
    } catch (error) {
      console.error('Error saving battlecard:', error);
    } finally {
      setSaving(false);
    }
  };

  const addListItem = (field, inputValue, setter) => {
    const value = inputValue.trim();
    if (value && !formData[field].includes(value)) {
      setFormData({ ...formData, [field]: [...formData[field], value] });
      setter('');
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
              className="text-purple-600 hover:text-purple-700 mb-2 inline-flex items-center gap-1"
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Competitor Name *</label>
            <input
              type="text"
              value={formData.competitor_name}
              onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Competitor X"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe their market position..."
            />
          </div>

          {/* Strengths */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Strengths</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addListItem('strengths', newStrength, setNewStrength)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Add a strength..."
              />
              <button
                onClick={() => addListItem('strengths', newStrength, setNewStrength)}
                className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.strengths.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                  💪 {item}
                  <button onClick={() => removeListItem('strengths', i)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weaknesses</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newWeakness}
                onChange={(e) => setNewWeakness(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addListItem('weaknesses', newWeakness, setNewWeakness)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Add a weakness..."
              />
              <button
                onClick={() => addListItem('weaknesses', newWeakness, setNewWeakness)}
                className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.weaknesses.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                  ⚠️ {item}
                  <button onClick={() => removeListItem('weaknesses', i)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Differentiators */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Our Differentiators</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newDifferentiator}
                onChange={(e) => setNewDifferentiator(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addListItem('differentiators', newDifferentiator, setNewDifferentiator)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder="Add a differentiator..."
              />
              <button
                onClick={() => addListItem('differentiators', newDifferentiator, setNewDifferentiator)}
                className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.differentiators.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  🎯 {item}
                  <button onClick={() => removeListItem('differentiators', i)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {battlecard && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
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
