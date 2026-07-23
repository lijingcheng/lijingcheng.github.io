import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "风行的博客",
  description: "个人技术与生活随笔",
  head: [
    ['link', { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  ],
  base: '/',
  cleanUrls: true,
  ignoreDeadLinks: ['http://localhost:1313', 'http://localhost:4000'],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '归档', link: '/posts/' },
      { text: '关于我', link: '/about/' }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/lijingcheng' }
    ],
    footer: {
      message: '风行的博客',
      copyright: 'Copyright © 2016-2026'
    }
  }
})