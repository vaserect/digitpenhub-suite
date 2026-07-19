'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';

export default function PlaybookEditor() {
  const params = useParams();
  const router = useRouter();
  const [playbook, setPlaybook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    content: {},
    status: 'draft'
  });

  useEffect(() => {
    if (params.id !== 'create') {
      fetchPlaybook();
    } else {
      setLoading(false);
    }
  }, [params.id]);

  const fetchPlaybook = async () => {
    try {
      const response = await fetch(`/api/v1/sales-playbook/playbooks/${params.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setPlaybook(data.data);
        setFormData({
          title: data.data.title,
          description: data.data.description || '',
          category: data.data.category || '',
          content: data.data.content || {},
          status: data.data.status
        });
      }
    } catch (error) {
      console.error('Error fetching playbook:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = params.id === 'create'
        ? '/api/v1/sales-playbook/playbooks'
        : `/api/v1/sales-playbook/playbooks/${params.id}`;
      
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
          router.push(`/modules/sales-playbook/playbooks/${data.data.id}`);
        } else {
          fetchPlaybook();
        }
      }
    } catch (error) {
      console.error('Error saving playbook:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/v1/sales-playbook/playbooks/${params.id}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchPlaybook();
      }
    } catch (error) {
      console.error('Error publishing playbook:', error);
    } finally {
      setSaving(false);
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push('/modules/sales-playbook')}
              className="text-blue-600 hover:text-blue-700 mb-2"
            >
              ← Back to Playbooks
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {params.id === 'create' ? 'Create Playbook' : 'Edit Playbook'}
            </h1>
          </div>
          <div className="flex gap-3">
            {playbook && playbook.status === 'draft' && (
              <button
                onClick={handlePublish}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter playbook title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of this playbook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Product Launch, Sales Process, Objection Handling"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <RichTextEditor
              value={formData.content.body || ''}
              onChange={(html) => setFormData({ 
                ...formData, 
                content: { ...formData.content, body: html }
              })}
              placeholder="Write your playbook content here..."
            />
          </div>

          {playbook && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    playbook.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {playbook.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Views:</span> {playbook.view_count || 0}
                </div>
                <div>
                  <span className="font-medium">Rating:</span> {parseFloat(playbook.avg_rating || 0).toFixed(1)} ⭐
                </div>
                <div>
                  <span className="font-medium">Favorites:</span> {playbook.favorite_count || 0}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
