import React from 'react';

const METHOD_COLORS = {
  GET: '#22863a',
  POST: '#0366d6',
  PUT: '#e36209',
  DELETE: '#d73a49',
};

export default function ApiEndpoint({ method, path, description, auth = true, body, response, curl }) {
  return (
    <div className="api-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span
          className={`method-badge method-${method.toLowerCase()}`}
          style={{ backgroundColor: METHOD_COLORS[method] }}
        >
          {method}
        </span>
        <code style={{ fontSize: '14px', fontWeight: 600 }}>{path}</code>
        {auth && (
          <span style={{ fontSize: '11px', color: '#e36209', fontWeight: 500 }}>
            🔒 Auth Required
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 12px', color: 'var(--ifm-color-emphasis-700)', fontSize: '14px' }}>
        {description}
      </p>
      {body && (
        <details style={{ marginBottom: '8px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: '13px', color: 'var(--ifm-color-emphasis-600)' }}>
            Request Body
          </summary>
          <pre style={{ marginTop: '8px', fontSize: '12px', borderRadius: '6px' }}>
            <code>{body}</code>
          </pre>
        </details>
      )}
      {response && (
        <details style={{ marginBottom: '8px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: '13px', color: 'var(--ifm-color-emphasis-600)' }}>
            Response
          </summary>
          <pre style={{ marginTop: '8px', fontSize: '12px', borderRadius: '6px' }}>
            <code>{response}</code>
          </pre>
        </details>
      )}
      {curl && (
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: '13px', color: 'var(--ifm-color-emphasis-600)' }}>
            cURL Example
          </summary>
          <pre style={{ marginTop: '8px', fontSize: '12px', borderRadius: '6px' }}>
            <code>{curl}</code>
          </pre>
        </details>
      )}
    </div>
  );
}
