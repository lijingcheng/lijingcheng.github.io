import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: "风行的博客",
  description: "独立开发者风行的个人博客，分享 iOS 开发、移动应用出海、架构设计与行走随笔。",
  head: [
    ['meta', { name: 'keywords', content: 'iOS, Swift, 独立开发, 移动应用, 架构, 技术博客, 行走随笔' }],
    ['meta', { property: 'og:site_name', content: '风行的博客' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  ],
  base: '/',
  cleanUrls: true,
  ignoreDeadLinks: ['http://localhost:1313', 'http://localhost:4000'],
  sitemap: {
    hostname: 'https://lijingcheng.github.io'
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '归档', link: '/posts/' },
      { text: '关于我', link: '/about/' }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/lijingcheng' }
    ],
    lastUpdated: true,
    search: {
      provider: 'local',
      options: {
        detailedView: true
      }
    },
    footer: {
      message: '风行的博客',
      copyright: 'Copyright © 2016-2026'
    }
  }
})