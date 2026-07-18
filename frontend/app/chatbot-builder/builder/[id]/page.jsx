'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Play, ArrowLeft, Plus, Trash2, Settings, MessageSquare, HelpCircle, GitBranch, Zap, Clock, Bot, UserX, StopCircle } from 'lucide-react';

const nodeTypes = {
  message: { icon: MessageSquare, color: 'bg-blue-100 border-blue-300 text-blue-800' },
  question: { icon: HelpCircle, color: 'bg-purple-100 border-purple-300 text-purple-800' },
  condition: { icon: GitBranch, color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  action: { icon: Zap, color: 'bg-green-100 border-green-300 text-green-800' },
  delay: { icon: Clock, color: 'bg-orange-100 border-orange-300 text-orange-800' },
  ai: { icon: Bot, color: 'bg-indigo-100 border-indigo-300 text-indigo-800' },
  handoff: { icon: UserX, color: 'bg-red-100 border-red-300 text-red-800' },
  end: { icon: StopCircle, color: 'bg-gray-100 border-gray-300 text-gray-800' },
};

function CustomNode({ data }) {
  const nodeConfig = nodeTypes[data.type] || nodeTypes.message;
  const Icon = nodeConfig.icon;

  return (
    <div className={`px-4 py-3 shadow-md rounded-lg border-2 ${nodeConfig.color} min-w-[200px]`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <div className="font-semibold text-sm">{data.type}</div>
      </div>
      <div className="text-xs">
        {data.content && <div className="truncate">{data.content}</div>}
        {data.question && <div className="truncate">{data.question}</div>}
        {data.action && <div className="truncate">Action: {data.action}</div>}
        {!data.content && !data.question && !data.action && <div className="text-gray-500">Click to configure</div>}
      </div>
    </div>
  );
}

const customNodeTypes = {
  custom: CustomNode,
};

export default function FlowBuilder() {
  const router = useRouter();
  const params = useParams();
  const flowId = params.id;

  const [flow, setFlow] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);

  useEffect(() => {
    loadFlow();
  }, [flowId]);

  const loadFlow = async () => {
    try {
      const res = await fetch(`/api/v1/chatbot-builder/${flowId}`);
      if (res.ok) {
        const data = await res.json();
        setFlow(data.flow);
        
        // Convert stored nodes to React Flow format
        const flowNodes = (data.flow.nodes || []).map((node, index) => ({
          id: node.id,
          type: 'custom',
          position: node.position || { x: 250, y: index * 150 + 50 },
          data: { ...node },
        }));
        
        setNodes(flowNodes);
        
        // Generate edges from node connections
        const flowEdges = [];
        flowNodes.forEach((node, index) => {
          if (index < flowNodes.length - 1) {
            flowEdges.push({
              id: `e${node.id}-${flowNodes[index + 1].id}`,
              source: node.id,
              target: flowNodes[index + 1].id,
              type: 'smoothstep',
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed },
            });
          }
        });
        setEdges(flowEdges);
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
      // Convert React Flow nodes back to storage format
      const storageNodes = nodes.map(node => ({
        id: node.id,
        type: node.data.type,
        position: node.position,
        ...node.data,
      }));

      const res = await fetch(`/api/v1/chatbot-builder/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: storageNodes })
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

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );

  const addNode = (type) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        type,
        content: type === 'message' ? 'Enter your message here' : '',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    setShowNodeEditor(true);
  };

  const updateNodeData = (updates) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, ...updates } });
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setShowNodeEditor(false);
    setSelectedNode(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 z-10">
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
              <p className="text-sm text-gray-600">Visual Flow Builder</p>
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
            {Object.entries(nodeTypes).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => addNode(type)}
                  className={`w-full text-left p-3 border-2 rounded-lg hover:shadow-md transition-all ${config.color}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <div className="font-medium capitalize">{type}</div>
                  </div>
                  <div className="text-xs opacity-75">
                    {type === 'message' && 'Send a message'}
                    {type === 'question' && 'Ask for input'}
                    {type === 'condition' && 'Branch logic'}
                    {type === 'action' && 'Perform action'}
                    {type === 'delay' && 'Wait before next'}
                    {type === 'ai' && 'Generate with AI'}
                    {type === 'handoff' && 'Transfer to agent'}
                    {type === 'end' && 'End conversation'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={customNodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Node Editor Panel */}
        {showNodeEditor && selectedNode && (
          <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Node</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={deleteNode}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Delete Node"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowNodeEditor(false)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Node Type
                </label>
                <div className={`px-3 py-2 rounded-lg ${nodeTypes[selectedNode.data.type]?.color || 'bg-gray-100'}`}>
                  {selectedNode.data.type}
                </div>
              </div>

              {selectedNode.data.type === 'message' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Content
                  </label>
                  <textarea
                    value={selectedNode.data.content || ''}
                    onChange={(e) => updateNodeData({ content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    placeholder="Enter message content..."
                  />
                </div>
              )}

              {selectedNode.data.type === 'question' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.question || ''}
                      onChange={(e) => updateNodeData({ question: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What question do you want to ask?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.field || ''}
                      onChange={(e) => updateNodeData({ field: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Field name to store answer"
                    />
                  </div>
                </>
              )}

              {selectedNode.data.type === 'action' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type
                  </label>
                  <select
                    value={selectedNode.data.action || ''}
                    onChange={(e) => updateNodeData({ action: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select action...</option>
                    <option value="set_attribute">Set Attribute</option>
                    <option value="add_tag">Add Tag</option>
                    <option value="create_contact">Create CRM Contact</option>
                    <option value="trigger_automation">Trigger Automation</option>
                  </select>
                </div>
              )}

              {selectedNode.data.type === 'delay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay (seconds)
                  </label>
                  <input
                    type="number"
                    value={selectedNode.data.delaySeconds || 0}
                    onChange={(e) => updateNodeData({ delaySeconds: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Delay in seconds"
                  />
                </div>
              )}

              {selectedNode.data.type === 'ai' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Prompt
                  </label>
                  <textarea
                    value={selectedNode.data.prompt || ''}
                    onChange={(e) => updateNodeData({ prompt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    placeholder="AI prompt or context..."
                  />
                </div>
              )}

              {selectedNode.data.type === 'handoff' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Handoff Message
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.message || ''}
                    onChange={(e) => updateNodeData({ message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Message to agent"
                  />
                </div>
              )}

              {selectedNode.data.type === 'end' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Closing Message
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.message || ''}
                    onChange={(e) => updateNodeData({ message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Closing message"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
