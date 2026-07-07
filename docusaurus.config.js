module.exports = {
  title: 'Visual Worktree',
  tagline: '以任务为单位管理多仓库 Git worktree',
  url: 'https://visual-worktree-docs.netlify.app',
  baseUrl: '/',
  organizationName: 'imberZsk',
  projectName: 'visual-worktree-docs',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: {
          routeBasePath: 'blog',
          showReadingTime: true,
          blogTitle: 'Visual Worktree 文章',
          blogDescription: '围绕多仓库任务开发、Git worktree 管理和桌面研发工具的实践文章。',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  themeConfig: {
    image: 'img/visual-worktree-overview.png',
    navbar: {
      title: 'Visual Worktree',
      items: [
        { to: '/', label: '首页', position: 'left' },
        { to: '/features', label: '功能', position: 'left' },
        { to: '/getting-started', label: '快速开始', position: 'left' },
        { to: '/blog/visual-worktree-product-tour', label: '功能文章', position: 'left' },
        { href: 'https://github.com/imberZsk/visual-worktree', label: '源码仓库', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '内容',
          items: [
            { label: '产品介绍', to: '/' },
            { label: '功能总览', to: '/features' },
            { label: '快速开始', to: '/getting-started' },
            { label: '数据与隐私', to: '/privacy-and-data' },
            { label: '功能文章', to: '/blog/visual-worktree-product-tour' },
          ],
        },
        {
          title: '项目',
          items: [
            { label: '源码仓库', href: 'https://github.com/imberZsk/visual-worktree' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Visual Worktree.`,
    },
  },
};
