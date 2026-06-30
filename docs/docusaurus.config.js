// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'PayGuard AI',
  tagline: 'AI-powered payment recovery for Indian MSMEs',
  favicon: 'img/favicon.ico',

  future: {
    v4: false,
  },

  url: 'https://docs.payguard.ai',
  baseUrl: '/',

  organizationName: 'payguard',
  projectName: 'payguard-ai',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'PayGuard AI',
        logo: {
          alt: 'PayGuard AI Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'left',
            label: 'Documentation',
          },
          {
            to: '/docs/api/authentication',
            label: 'API Reference',
            position: 'left',
          },
          {
            to: '/docs/pricing',
            label: 'Pricing',
            position: 'left',
          },
          {
            href: 'https://github.com/payguard/payguard-ai',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              { label: 'Getting Started', to: '/docs/' },
              { label: 'Architecture', to: '/docs/architecture/overview' },
              { label: 'API Reference', to: '/docs/api/authentication' },
              { label: 'Deployment', to: '/docs/deployment/production' },
            ],
          },
          {
            title: 'Product',
            items: [
              { label: 'Features', to: '/docs/features/dashboard' },
              { label: 'Pricing', to: '/docs/pricing' },
              { label: 'FAQ', to: '/docs/faq' },
              { label: 'Live App', href: 'https://app.payguard.ai' },
            ],
          },
          {
            title: 'Community',
            items: [
              { label: 'GitHub', href: 'https://github.com/payguard/payguard-ai' },
              { label: 'Support', href: 'mailto:support@payguard.ai' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} PayGuard AI. Built for Indian MSMEs.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'python'],
      },
    }),
};

export default config;
