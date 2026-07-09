---
layout: home
---

<script setup>
import { data as posts } from './.vitepress/posts.data.mts'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric' })
}
</script>

<div class="home-content">
  <div class="home-hero">
    <h1 class="hero-title">京城的博客</h1>
    <p class="hero-desc">个人技术与生活随笔</p>
  </div>

  <div class="post-list" v-if="posts.length">
    <div v-for="post in posts" :key="post.url" class="post-item">
      <a :href="post.url" class="post-link">{{ post.frontmatter.title }}</a>
      <span class="post-time">{{ formatDate(post.frontmatter.date) }}</span>
    </div>
  </div>
</div>

<style>
.home-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 64px 24px 48px;
}
.home-hero {
  text-align: center;
  margin-bottom: 48px;
}
.hero-title {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--vp-c-text-1);
  margin: 0 0 8px 0;
}
.hero-desc {
  font-size: 16px;
  color: var(--vp-c-text-2);
  margin: 0;
}
.post-list {
  border-top: 1px solid var(--vp-c-divider);
}
.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.post-link {
  font-size: 15px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.post-link:hover {
  color: var(--vp-c-brand-1);
}
.post-time {
  font-size: 13px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  margin-left: 16px;
}
@media (max-width: 600px) {
  .home-content { padding: 32px 16px 24px; }
  .hero-title { font-size: 28px; }
  .post-item { flex-direction: column; align-items: flex-start; gap: 4px; }
  .post-time { margin-left: 0; }
}
</style>
