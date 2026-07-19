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
import { Save, Play, ArrowLeft, Trash2, MessageSquare, HelpCircle, GitBranch, Zap, Clock, Bot, UserX, StopCircle, Shuffle, ArrowRight, Send, CreditCard, FileText, Image, Link } from 'lucide-react';

const nodeTypes = {
  message: { icon: MessageSquare, color: 'bg-blue-100 border-blue-300 text-blue-800' },
  question: { icon: HelpCircle, color: 'bg-purple-100 border-purple-300 text-purple-800' },
  condition: { icon: GitBranch, color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  action: { icon: Zap, color: 'bg-green-100 border-green-300 text-green-800' },
  delay: { icon: Clock, color: 'bg-orange-100 border-orange-300 text-orange-800' },
  ai: { icon: Bot, color: 'bg-indigo-100 border-indigo-300 text-indigo-800' },
  handoff: { icon: UserX, color: 'bg-red-100 border-red-300 text-red-800' },
  end: { icon: StopCircle, color: 'bg-gray-100 border-gray-300 text-gray-800' },
  split: { icon: Shuffle, color: 'bg-pink-100 border-pink-300 text-pink-800' },
  goto: { icon: ArrowRight, color: 'bg-teal-100 border-teal-300 text-teal-800' },
  broadcast: { icon: Send, color: 'bg-cyan-100 border-cyan-300 text-cyan-800' },
  payment: { icon: CreditCard, color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  form: { icon: FileText, color: 'bg-violet-100 border-violet-300 text-violet-800' },
  mediaGallery: { icon: Image, color: 'bg-rose-100 border-rose-300 text-rose-800' },
  integration: { icon: Link, color: 'bg-amber-100 border-amber-300 text-amber-800' },
};

function CustomNode({ data }) {
  const nodeConfig = nodeTypes[data.type] || nodeTypes.message;
  const Icon = nodeConfig.icon;

  return (
    <div className={`px-4 py-3 shadow-md rounded-lg border-2 ${nodeConfig.color} min-w-[200px]`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <div className="font-semibold text-sm capitalize">{data.type.replace(/([A-Z])/g, ' $1').trim()}</div>
      </div>
      <div className="text-xs">
        {data.content && <div className="truncate">{data.content}</div>}
        {data.question && <div className="truncate">{data.question}</div>}
        {data.action && <div className="truncate">Action: {data.action}</div>}
        {data.splitType && <div className="truncate">Split: {data.splitType}</div>}
        {data.targetNode && <div className="truncate">Go to: {data.targetNode}</div>}
        {data.broadcastName && <div className="truncate">Broadcast: {data.broadcastName}</div>}
        {data.amount && <div className="truncate">Amount: ${data.amount}</div>}
        {data.formFields && <div className="truncate">{data.formFields.length} fields</div>}
        {data.mediaItems && <div className="truncate">{data.mediaItems.length} items</div>}
        {data.integrationType && <div className="truncate">Integration: {data.integrationType}</div>}
        {!data.content && !data.question && !data.action && !data.splitType && !data.targetNode && !data.broadcastName && !data.amount && !data.formFields && !data.mediaItems && !data.integrationType && <div className="text-gray-500">Click to configure</div>}
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
        
        const flowNodes = (data.flow.nodes || []).map((node, index) => ({
          id: node.id,
          type: 'custom',
          position: node.position || { x: 250, y: index * 150 + 50 },
          data: { ...node },
        }));
        
        setNodes(flowNodes);
        
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
        formFields: type === 'form' ? [] : undefined,
        mediaItems: type === 'mediaGallery' ? [] : undefined,
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
      <div className="bg-white border-b border-gray-200 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/chatbot-builder')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{flow?.name}</h1>
              <p className="text-sm text-gray-600">Visual Flow Builder - 15 Node Types</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={saveFlow} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => alert('Test mode coming soon!')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              <Play className="w-4 h-4" />
              Test
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Add Nodes (15 Types)</h3>
          <div className="space-y-2">
            {Object.entries(nodeTypes).map(([type, config]) => {
              const Icon = config.icon;
              const descriptions = {
                message: 'Send a message',
                question: 'Ask for input',
                condition: 'Branch logic',
                action: 'Perform action',
                delay: 'Wait before next',
                ai: 'Generate with AI',
                handoff: 'Transfer to agent',
                end: 'End conversation',
                split: 'A/B test split',
                goto: 'Jump to node',
                broadcast: 'Mass message',
                payment: 'Collect payment',
                form: 'Multi-field form',
                mediaGallery: 'Image carousel',
                integration: 'External API',
              };
              return (
                <button key={type} onClick={() => addNode(type)} className={`w-full text-left p-3 border-2 rounded-lg hover:shadow-md transition-all ${config.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <div className="font-medium capitalize text-xs">{type.replace(/([A-Z])/g, ' $1').trim()}</div>
                  </div>
                  <div className="text-xs opacity-75">{descriptions[type]}</div>
                </button>
              );
            })}
          </div>
        </div>

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

        {showNodeEditor && selectedNode && (
          <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Node</h3>
              <div className="flex items-center gap-2">
                <button onClick={deleteNode} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Node">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setShowNodeEditor(false)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">✕</button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Node Type</label>
                <div className={`px-3 py-2 rounded-lg ${nodeTypes[selectedNode.data.type]?.color || 'bg-gray-100'}`}>
                  {selectedNode.data.type}
                </div>
              </div>

              {selectedNode.data.type === 'message' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                  <textarea value={selectedNode.data.content || ''} onChange={(e) => updateNodeData({ content: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="4" placeholder="Enter message content..." />
                </div>
              )}

              {selectedNode.data.type === 'question' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                    <input type="text" value={selectedNode.data.question || ''} onChange={(e) => updateNodeData({ question: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="What question do you want to ask?" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                    <input type="text" value={selectedNode.data.field || ''} onChange={(e) => updateNodeData({ field: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Field name to store answer" />
                  </div>
                </>
              )}

              {selectedNode.data.type === 'action' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                  <select value={selectedNode.data.action || ''} onChange={(e) => updateNodeData({ action: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delay (seconds)</label>
                  <input type="number" value={selectedNode.data.delaySeconds || 0} onChange={(e) => updateNodeData({ delaySeconds: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Delay in seconds" />
                </div>
              )}

              {selectedNode.data.type === 'ai' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AI Prompt</label>
                  <textarea value={selectedNode.data.prompt || ''} onChange={(e) => updateNodeData({ prompt: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="4" placeholder="AI prompt or context..." />
                </div>
              )}

              {selectedNode.data.type === 'handoff' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Handoff Message</label>
                  <input type="text" value={selectedNode.data.message || ''} onChange={(e) => updateNodeData({ message: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Message to agent" />
                </div>
              )}

              {selectedNode.data.type === 'end' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Message</label>
                  <input type="text" value={selectedNode.data.message || ''} onChange={(e) => updateNodeData({ message: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Closing message" />
                </div>
              )}

              {selectedNode.data.type === 'split' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Split Type</label>
                    <select value={selectedNode.data.splitType || 'ab_test'} onChange={(e) => updateNodeData({ splitType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="ab_test">A/B Test</option>
                      <option value="random">Random</option>
                      <option value="weighted">Weighted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Traffic Split (%)</label>
                    <input type="number" min="0" max="100" value={selectedNode.data.trafficSplit || 50} onChange={(e) => updateNodeData({ trafficSplit: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="50" />
                  </div>
                </>
              )}

              {selectedNode.data.type === 'goto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Node ID</label>
                  <input type="text" value={selectedNode.data.targetNode || ''} onChange={(e) => updateNodeData({ targetNode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="node_123" />
                </div>
              )}

              {selectedNode.data.type === 'broadcast' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Broadcast Name</label>
                    <input type="text" value={selectedNode.data.broadcastName || ''} onChange={(e) => updateNodeData({ broadcastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Campaign name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea value={selectedNode.data.broadcastMessage || ''} onChange={(e) => updateNodeData({ broadcastMessage: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="3" placeholder="Broadcast message" />
                  </div>
                </>
              )}

              {selectedNode.data.type === 'payment' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                    <input type="number" step="0.01" value={selectedNode.data.amount || 0} onChange={(e) => updateNodeData({ amount: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input type="text" value={selectedNode.data.productName || ''} onChange={(e) => updateNodeData({ productName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Product or service name" />
                  </div>
                </>
              )}

              {selectedNode.data.type === 'form' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Fields (JSON)</label>
                  <textarea value={JSON.stringify(selectedNode.data.formFields || [], null, 2)} onChange={(e) => { try { updateNodeData({ formFields: JSON.parse(e.target.value) }); } catch {} }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs" rows="6" placeholder='[{"name":"email","type":"email","required":true}]' />
                </div>
              )}

              {selectedNode.data.type === 'mediaGallery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Media Items (JSON)</label>
                  <textarea value={JSON.stringify(selectedNode.data.mediaItems || [], null, 2)} onChange={(e) => { try { updateNodeData({ mediaItems: JSON.parse(e.target.value) }); } catch {} }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs" rows="6" placeholder='[{"url":"https://...","caption":"..."}]' />
                </div>
              )}

              {selectedNode.data.type === 'integration' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Integration Type</label>
                    <select value={selectedNode.data.integrationType || 'webhook'} onChange={(e) => updateNodeData({ integrationType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="webhook">Webhook</option>
                      <option value="crm">CRM</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint/Config</label>
                    <input type="text" value={selectedNode.data.integrationConfig || ''} onChange={(e) => updateNodeData({ integrationConfig: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://api.example.com/webhook" />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
