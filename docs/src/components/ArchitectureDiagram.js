import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

const archNodes = [
  { id: 'browser', label: 'Browser', icon: '🌐', x: 350, y: 20, color: '#2563eb', desc: 'React 19 SPA', metric: 'UI events' },
  { id: 'vercel', label: 'Vercel CDN', icon: '▲', x: 350, y: 145, color: '#111827', desc: 'Static hosting + Edge', metric: 'edge cache' },
  { id: 'fastapi', label: 'FastAPI Backend', icon: '⚡', x: 350, y: 280, color: '#0A3B2C', desc: 'Python async API', metric: '/api/*' },
  { id: 'auth', label: 'JWT Auth', icon: '🔐', x: 55, y: 285, color: '#d97706', desc: 'PyJWT + bcrypt', metric: '7d tokens' },
  { id: 'ai', label: 'AI Services', icon: '🤖', x: 650, y: 285, color: '#7c3aed', desc: 'Claude + rules', metric: 'fallback ready' },
  { id: 'postgres', label: 'PostgreSQL', icon: '🐘', x: 135, y: 445, color: '#336791', desc: 'Neon Serverless', metric: 'async SQL' },
  { id: 'smtp', label: 'Gmail SMTP', icon: '📧', x: 565, y: 445, color: '#dc2626', desc: 'Reset emails', metric: '15m links' },
  { id: 'logging', label: 'Structured Logs', icon: '📋', x: 350, y: 465, color: '#64748b', desc: 'JSON rotating files', metric: 'audit trail' },
];

const archEdges = [
  { id: 'e1', source: 'browser', target: 'vercel', label: 'HTTPS', animated: true },
  { id: 'e2', source: 'vercel', target: 'fastapi', label: 'API Proxy', animated: true },
  { id: 'e3', source: 'fastapi', target: 'auth', label: 'Validate' },
  { id: 'e4', source: 'fastapi', target: 'ai', label: 'Generate' },
  { id: 'e5', source: 'fastapi', target: 'postgres', label: 'SQL' },
  { id: 'e6', source: 'fastapi', target: 'smtp', label: 'Email' },
  { id: 'e7', source: 'fastapi', target: 'logging', label: 'Logs' },
];

function ArchNode({ data }) {
  return (
    <div
      className={`flow-card arch-card ${data.isActive ? 'is-active' : ''} ${data.isDimmed ? 'is-dimmed' : ''}`}
      style={{ '--node-color': data.color }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <div className="flow-card__glow" />
      <div className="arch-card__topline">
        <span className="arch-card__icon">{data.icon}</span>
        <span className="flow-live-dot" />
      </div>
      <div className="flow-card__title">{data.label}</div>
      <div className="flow-card__desc">{data.desc}</div>
      <div className="flow-card__metric">{data.metric}</div>
    </div>
  );
}

const nodeTypes = { archNode: ArchNode };

export default function ArchitectureDiagram() {
  const [activeNode, setActiveNode] = useState(null);

  const initialNodes = useMemo(() =>
    archNodes.map((n) => ({
      id: n.id,
      type: 'archNode',
      position: { x: n.x, y: n.y },
      data: { label: n.label, icon: n.icon, color: n.color, desc: n.desc, metric: n.metric },
    })), []);

  const initialEdges = useMemo(() =>
    archEdges.map((e) => ({
      ...e,
      type: 'smoothstep',
      animated: true,
      interactionWidth: 28,
      style: { stroke: '#38bdf8', strokeWidth: 2.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#38bdf8' },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 8,
      labelBgStyle: { fill: 'var(--ifm-background-surface-color)', fillOpacity: 0.9 },
      labelStyle: { fill: 'var(--ifm-color-emphasis-700)', fontSize: '11px', fontWeight: 700 },
    })), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges_, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const focusNode = useCallback((nodeId) => {
    setActiveNode(nodeId);
    const connected = new Set(
      archEdges
        .filter((edge) => edge.source === nodeId || edge.target === nodeId)
        .flatMap((edge) => [edge.source, edge.target])
    );

    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isActive: connected.has(node.id),
          isDimmed: !connected.has(node.id),
        },
      }))
    );

    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const isActive = edge.source === nodeId || edge.target === nodeId;
        return {
          ...edge,
          animated: true,
          style: {
            ...edge.style,
            stroke: isActive ? '#f59e0b' : '#94a3b8',
            strokeWidth: isActive ? 4 : 1.5,
            opacity: isActive ? 1 : 0.35,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? '#f59e0b' : '#94a3b8' },
        };
      })
    );
  }, [setEdges, setNodes]);

  const clearFocus = useCallback(() => {
    setActiveNode(null);
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: { ...node.data, isActive: false, isDimmed: false },
      }))
    );
    setEdges(initialEdges);
  }, [initialEdges, setEdges, setNodes]);

  return (
    <div className="diagram-container live-diagram" style={{ height: '620px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges_}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeMouseEnter={(_, node) => focusNode(node.id)}
        onNodeClick={(_, node) => focusNode(node.id)}
        onPaneClick={clearFocus}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
      >
        <Controls />
        <MiniMap zoomable pannable className="diagram-minimap" style={{ height: 92, width: 140 }} />
        <Background gap={20} color="rgba(56, 189, 248, 0.25)" />
      </ReactFlow>
      <div className="diagram-statusbar">
        <span>{activeNode ? `Focused: ${activeNode}` : 'Live architecture map'}</span>
        <span>Drag nodes · hover to trace traffic · scroll to zoom</span>
      </div>
    </div>
  );
}
