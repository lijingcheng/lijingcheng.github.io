import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "风行的博客",
  description: "个人技术与生活随笔",
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  base: '/',
  cleanUrls: true,
  ignoreDeadLinks: ['http://localhost:1313', 'http://localhost:4000'],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' }
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