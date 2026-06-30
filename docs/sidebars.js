/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/quick-start',
        'getting-started/local-setup',
        'getting-started/demo-credentials',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/tech-stack',
        'architecture/database-schema',
        'architecture/auth-flow',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/dashboard',
        'features/customers',
        'features/invoices',
        'features/payments',
        'features/ai-followups',
        'features/cashflow',
        'features/risk-scoring',
        'features/recovery-reports',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/authentication',
        'api/customers',
        'api/invoices',
        'api/payments',
        'api/followups',
        'api/ai-services',
        'api/dashboard',
        'api/cashflow',
        'api/settings',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/production',
        'deployment/environment-vars',
        'deployment/gmail-smtp',
      ],
    },
    'pricing',
    'faq',
  ],
};

export default sidebars;
