import React, { useCallback, useMemo } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, MarkerType } from 'reactflow';
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
    <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: `2px solid ${data.color}`,
      borderRadius: '8px',
      overflow: 'hidden',
      minWidth: '200px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <div style={{
        background: data.color,
        color: 'white',
        padding: '8px 12px',
        fontWeight: 700,
        fontSize: '13px',
        fontFamily: 'monospace',
      }}>
        {data.label}
      </div>
      <div style={{ padding: '6px 0' }}>
        {data.columns.map((col) => (
          <div key={col} style={{
            padding: '3px 12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'var(--ifm-color-emphasis-700)',
            borderBottom: '1px solid var(--ifm-color-emphasis-100)',
          }}>
            {col}
          </div>
        ))}
      </div>
    </div>
  );
}

const nodeTypes = { tableNode: TableNode };

export default function ERDiagram() {
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
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
      labelStyle: { fill: 'var(--ifm-color-emphasis-600)', fontSize: '11px', fontWeight: 600 },
    })), []);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges_, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="diagram-container" style={{ height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges_}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
          style={{ height: 100, width: 150 }}
        />
        <Background gap={16} />
      </ReactFlow>
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ifm-color-emphasis-500)', marginTop: '8px' }}>
        Interactive ER diagram — drag to pan, scroll to zoom, click tables to highlight connections
      </p>
    </div>
  );
}
