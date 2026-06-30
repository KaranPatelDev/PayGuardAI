import React, { useMemo } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';

const archNodes = [
  { id: 'browser', label: 'Browser', icon: '🌐', x: 350, y: 20, color: '#6366f1', desc: 'React 19 SPA' },
  { id: 'vercel', label: 'Vercel CDN', icon: '▲', x: 350, y: 130, color: '#000', desc: 'Static hosting + Edge' },
  { id: 'fastapi', label: 'FastAPI Backend', icon: '⚡', x: 350, y: 240, color: '#0A3B2C', desc: 'Python async API' },
  { id: 'auth', label: 'JWT Auth', icon: '🔐', x: 100, y: 240, color: '#d97706', desc: 'PyJWT + bcrypt' },
  { id: 'ai', label: 'AI Services', icon: '🤖', x: 600, y: 240, color: '#8b5cf6', desc: 'Claude + Rule-based' },
  { id: 'postgres', label: 'PostgreSQL', icon: '🐘', x: 200, y: 380, color: '#336791', desc: 'Neon Serverless' },
  { id: 'smtp', label: 'Gmail SMTP', icon: '📧', x: 500, y: 380, color: '#d73a49', desc: 'Password reset emails' },
  { id: 'logging', label: 'Structured Logs', icon: '📋', x: 350, y: 380, color: '#6b7280', desc: 'JSON rotating files' },
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
    <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: `2px solid ${data.color}`,
      borderRadius: '12px',
      padding: '12px 16px',
      minWidth: '140px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontSize: '24px', marginBottom: '4px' }}>{data.icon}</div>
      <div style={{ fontWeight: 700, fontSize: '13px', color: data.color }}>{data.label}</div>
      <div style={{ fontSize: '11px', color: 'var(--ifm-color-emphasis-500)', marginTop: '2px' }}>{data.desc}</div>
    </div>
  );
}

const nodeTypes = { archNode: ArchNode };

export default function ArchitectureDiagram() {
  const initialNodes = useMemo(() =>
    archNodes.map((n) => ({
      id: n.id,
      type: 'archNode',
      position: { x: n.x, y: n.y },
      data: { label: n.label, icon: n.icon, color: n.color, desc: n.desc },
    })), []);

  const initialEdges = useMemo(() =>
    archEdges.map((e) => ({
      ...e,
      type: 'smoothstep',
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
      labelStyle: { fill: 'var(--ifm-color-emphasis-600)', fontSize: '11px', fontWeight: 500 },
    })), []);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges_, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="diagram-container" style={{ height: '500px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges_}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Controls />
        <MiniMap zoomable pannable style={{ height: 80, width: 120 }} />
        <Background gap={16} />
      </ReactFlow>
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ifm-color-emphasis-500)', marginTop: '8px' }}>
        System architecture — scroll to zoom, drag to pan
      </p>
    </div>
  );
}
