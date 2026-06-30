import React from 'react';

export default function FeatureCard({ icon, title, description, link }) {
  const Card = link ? 'a' : 'div';
  return (
    <Card
      className="feature-card"
      href={link}
      style={link ? { textDecoration: 'none', color: 'inherit', cursor: 'pointer' } : {}}
    >
      <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--ifm-color-emphasis-600)', lineHeight: 1.6 }}>
        {description}
      </p>
    </Card>
  );
}
