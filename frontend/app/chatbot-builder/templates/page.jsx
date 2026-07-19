'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus } from 'lucide-react';

export default function Templates() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/v1/chatbot-builder/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFromTemplate = async (templateId) => {
    try {
      const name = prompt('Enter a name for your new chatbot:');
      if (!name) return;

      const res = await fetch(`/api/v1/chatbot-builder/templates/${templateId}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/chatbot-builder/builder/${data.flow.id}`);
      }
    } catch (error) {
      console.error('Error creating from template:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chatbot Templates</h1>
        <p className="text-gray-600 mt-1">Start with pre-built templates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
              {template.is_system && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  System
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{template.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{template.category}</span>
              <button
                onClick={() => createFromTemplate(template.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
