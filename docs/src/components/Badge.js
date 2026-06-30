import React from 'react';

export default function Badge({ children, color = 'default', size = 'sm' }) {
  const colors = {
    default: { bg: 'var(--ifm-color-emphasis-200)', text: 'var(--ifm-color-emphasis-700)' },
    green: { bg: '#dcfce7', text: '#166534' },
    blue: { bg: '#dbeafe', text: '#1e40af' },
    orange: { bg: '#fed7aa', text: '#9a3412' },
    red: { bg: '#fecaca', text: '#991b1b' },
    purple: { bg: '#e9d5ff', text: '#6b21a8' },
  };
  const c = colors[color] || colors.default;
  const sizes = { sm: { padding: '2px 8px', fontSize: '11px' }, md: { padding: '4px 12px', fontSize: '13px' } };
  const s = sizes[size] || sizes.sm;
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: c.bg,
        color: c.text,
        borderRadius: '12px',
        fontWeight: 600,
        letterSpacing: '0.3px',
        ...s,
      }}
    >
      {children}
    </span>
  );
}
