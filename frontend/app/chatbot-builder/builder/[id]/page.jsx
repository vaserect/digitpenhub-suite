'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, Play, ArrowLeft, Plus, Trash2, Settings } from 'lucide-react';

export default function FlowBuilder() {
  const router = useRouter();
  const params = useParams();
  const flowId = params.id;

  const [flow, setFlow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFlow();
  }, [flowId]);

  const loadFlow = async () => {
    try {
      const res = await fetch(`/api/v1/chatbot-builder/${flowId}`);
      if (res.ok) {
        const data = await res.json();
        setFlow(data.flow);
        setNodes(data.flow.nodes || []);
      }
    } catch (error) {
      console.error('Error loading flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFlow = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/chatbot-builder/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes })
      });

      if (res.ok) {
        alert('Flow saved successfully!');
      }
    } catch (error) {
      console.error('Error saving flow:', error);
      alert('Error saving flow');
    } finally {
      setSaving(false);
    }
  };

  const addNode = (type) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      content: type === 'message' ? 'Enter your message here' : '',
      position: { x: 100, y: nodes.length * 100 + 100 }
    };
    setNodes([...nodes, newNode]);
  };

  const updateNode = (nodeId, updates) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  };

  const deleteNode = (nodeId) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/chatbot-builder')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{flow?.name}</h1>
              <p className="text-sm text-gray-600">Flow Builder</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveFlow}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => alert('Test mode coming soon!')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Play className="w-4 h-4" />
              Test
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Library Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Add Nodes</h3>
          <div className="space-y-2">
            {[
              { type: 'message', label: 'Message', desc: 'Send a message' },
              { type: 'question', label: 'Question', desc: 'Ask for input' },
              { type: 'condition', label: 'Condition', desc: 'Branch logic' },
              { type: 'action', label: 'Action', desc: 'Perform action' },
              { type: 'delay', label: 'Delay', desc: 'Wait before next' },
              { type: 'ai', label: 'AI Response', desc: 'Generate with AI' },
              { type: 'handoff', label: 'Handoff', desc: 'Transfer to agent' },
              { type: 'end', label: 'End', desc: 'End conversation' }
            ].map(({ type, label, desc }) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-600">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            {nodes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No nodes yet</h3>
                <p className="text-gray-600">Add nodes from the sidebar to build your flow</p>
              </div>
            ) : (
              nodes.map((node, index) => (
                <div key={node.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {node.type}
                      </span>
                      <span className="text-sm text-gray-600">Node {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {/* TODO: Open settings modal */}}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteNode(node.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {node.type === 'message' && (
                    <textarea
                      value={node.content || ''}
                      onChange={(e) => updateNode(node.id, { content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Enter message content..."
                    />
                  )}

                  {node.type === 'question' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={node.question || ''}
                        onChange={(e) => updateNode(node.id, { question: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="What question do you want to ask?"
                      />
                      <input
                        type="text"
                        value={node.field || ''}
                        onChange={(e) => updateNode(node.id, { field: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Field name to store answer"
                      />
                    </div>
                  )}

                  {node.type === 'condition' && (
                    <div className="text-sm text-gray-600">
                      Condition logic configuration (advanced settings)
                    </div>
                  )}

                  {node.type === 'action' && (
                    <select
                      value={node.action || ''}
                      onChange={(e) => updateNode(node.id, { action: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select action...</option>
                      <option value="set_attribute">Set Attribute</option>
                      <option value="add_tag">Add Tag</option>
                      <option value="create_contact">Create CRM Contact</option>
                      <option value="trigger_automation">Trigger Automation</option>
                    </select>
                  )}

                  {node.type === 'delay' && (
                    <input
                      type="number"
                      value={node.delaySeconds || 0}
                      onChange={(e) => updateNode(node.id, { delaySeconds: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Delay in seconds"
                    />
                  )}

                  {node.type === 'ai' && (
                    <textarea
                      value={node.prompt || ''}
                      onChange={(e) => updateNode(node.id, { prompt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="AI prompt or context..."
                    />
                  )}

                  {node.type === 'handoff' && (
                    <input
                      type="text"
                      value={node.message || ''}
                      onChange={(e) => updateNode(node.id, { message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Handoff message to agent"
                    />
                  )}

                  {node.type === 'end' && (
                    <input
                      type="text"
                      value={node.message || ''}
                      onChange={(e) => updateNode(node.id, { message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Closing message"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
