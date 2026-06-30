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

const tables = [
  {
    id: 'users',
    label: 'users',
    x: 50, y: 100,
    color: '#0A3B2C',
    columns: ['id (PK)', 'full_name', 'email (UQ)', 'phone', 'business_name', 'business_type', 'gst_number', 'password_hash', 'created_at', 'updated_at'],
  },
  {
    id: 'settings',
    label: 'settings',
    x: 350, y: 10,
    color: '#6366f1',
    columns: ['id (PK)', 'user_id (FK)', 'default_payment_terms', 'default_followup_tone', 'default_reminder_days', 'reminder_channels', 'currency', 'ai_provider', 'updated_at'],
  },
  {
    id: 'customers',
    label: 'customers',
    x: 50, y: 400,
    color: '#0891b2',
    columns: ['id (PK)', 'user_id (FK)', 'business_name', 'contact_person', 'email', 'phone', 'address', 'city', 'state', 'gst_number', 'payment_terms', 'credit_limit', 'risk_score', 'risk_category', 'created_at'],
  },
  {
    id: 'invoices',
    label: 'invoices',
    x: 350, y: 300,
    color: '#d97706',
    columns: ['id (PK)', 'user_id (FK)', 'customer_id (FK)', 'invoice_number', 'invoice_date', 'due_date', 'amount', 'tax_amount', 'total_amount', 'paid_amount', 'pending_amount', 'status', 'created_at'],
  },
  {
    id: 'payments',
    label: 'payments',
    x: 650, y: 300,
    color: '#16a34a',
    columns: ['id (PK)', 'invoice_id (FK)', 'customer_id (FK)', 'user_id (FK)', 'amount', 'payment_date', 'payment_mode', 'reference_number', 'created_at'],
  },
  {
    id: 'followups',
    label: 'followups',
    x: 650, y: 100,
    color: '#dc2626',
    columns: ['id (PK)', 'invoice_id (FK)', 'customer_id (FK)', 'user_id (FK)', 'followup_type', 'message', 'channel', 'tone', 'status', 'promised_payment_date', 'created_at'],
  },
];

const edges = [
  { id: 'settings-user', source: 'users', target: 'settings', label: '1:1', sourceHandle: 'right', targetHandle: 'left' },
  { id: 'customers-user', source: 'users', target: 'customers', label: '1:N', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'invoices-user', source: 'users', target: 'invoices', label: '1:N', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'invoices-customer', source: 'customers', target: 'invoices', label: '1:N', sourceHandle: 'right', targetHandle: 'left' },
  { id: 'payments-invoice', source: 'invoices', target: 'payments', label: '1:N', sourceHandle: 'right', targetHandle: 'left' },
  { id: 'payments-user', source: 'users', target: 'payments', label: '1:N', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 'followups-invoice', source: 'invoices', target: 'followups', label: '1:N', sourceHandle: 'top', targetHandle: 'bottom' },
  { id: 'followups-user', source: 'users', target: 'followups', label: '1:N', sourceHandle: 'right', targetHandle: 'left' },
];

function TableNode({ data }) {
  return (
    <div
      className={`flow-card er-table ${data.isActive ? 'is-active' : ''} ${data.isDimmed ? 'is-dimmed' : ''}`}
      style={{ '--node-color': data.color }}
    >
      <Handle id="top" type="source" position={Position.Top} />
      <Handle id="top" type="target" position={Position.Top} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="bottom" type="target" position={Position.Bottom} />
      <Handle id="left" type="source" position={Position.Left} />
      <Handle id="left" type="target" position={Position.Left} />
      <Handle id="right" type="source" position={Position.Right} />
      <Handle id="right" type="target" position={Position.Right} />
      <div className="flow-card__glow" />
      <div className="er-table__header">
        <span className="er-table__glyph">DB</span>
        <span>{data.label}</span>
        <span className="flow-live-dot" />
      </div>
      <div className="er-table__columns">
        {data.columns.map((col, index) => (
          <div
            key={col}
            className={`er-table__column ${index === 0 || col.includes('(FK)') ? 'is-key' : ''}`}
          >
            {col}
          </div>
        ))}
      </div>
    </div>
  );
}

const nodeTypes = { tableNode: TableNode };

export default function ERDiagram() {
  const [activeTable, setActiveTable] = useState(null);

  const initialNodes = useMemo(() =>
    tables.map((t) => ({
      id: t.id,
      type: 'tableNode',
      position: { x: t.x, y: t.y },
      data: { label: t.label, color: t.color, columns: t.columns },
    })), []);

  const initialEdges = useMemo(() =>
    edges.map((e) => ({
      ...e,
      type: 'smoothstep',
      animated: true,
      interactionWidth: 28,
      style: { stroke: '#14b8a6', strokeWidth: 2.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#14b8a6' },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 8,
      labelBgStyle: { fill: 'var(--ifm-background-surface-color)', fillOpacity: 0.92 },
      labelStyle: { fill: 'var(--ifm-color-emphasis-700)', fontSize: '11px', fontWeight: 800 },
    })), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges_, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const focusTable = useCallback((tableId) => {
    setActiveTable(tableId);
    const connected = new Set(
      edges
        .filter((edge) => edge.source === tableId || edge.target === tableId)
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
        const isActive = edge.source === tableId || edge.target === tableId;
        return {
          ...edge,
          animated: true,
          style: {
            ...edge.style,
            stroke: isActive ? '#f97316' : '#94a3b8',
            strokeWidth: isActive ? 4 : 1.5,
            opacity: isActive ? 1 : 0.32,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? '#f97316' : '#94a3b8' },
        };
      })
    );
  }, [setEdges, setNodes]);

  const clearFocus = useCallback(() => {
    setActiveTable(null);
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: { ...node.data, isActive: false, isDimmed: false },
      }))
    );
    setEdges(initialEdges);
  }, [initialEdges, setEdges, setNodes]);

  return (
    <div className="diagram-container live-diagram" style={{ height: '700px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges_}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeMouseEnter={(_, node) => focusTable(node.id)}
        onNodeClick={(_, node) => focusTable(node.id)}
        onPaneClick={clearFocus}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
      >
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="diagram-minimap"
          style={{ height: 100, width: 150 }}
        />
        <Background gap={20} color="rgba(20, 184, 166, 0.25)" />
      </ReactFlow>
      <div className="diagram-statusbar">
        <span>{activeTable ? `Focused: ${activeTable}` : 'Live relational map'}</span>
        <span>Drag tables · hover to isolate relationships · scroll to zoom</span>
      </div>
    </div>
  );
}
