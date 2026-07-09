---
layout: page
---

<script setup>
import { data as posts } from '../.vitepress/posts.data.mts'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric' })
}
</script>

<div class="post-list-page">
  <h1 class="page-heading">全部文章</h1>

  <div class="post-list" v-if="posts.length">
    <div v-for="post in posts" :key="post.url" class="post-item">
      <a :href="post.url" class="post-link">{{ post.frontmatter.title }}</a>
      <span class="post-time">{{ formatDate(post.frontmatter.date) }}</span>
    </div>
  </div>
</div>

<style scoped>
.post-list-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px 48px;
}
.page-heading {
  font-size: 28px;
  font-weight: 700;
  margin: 32px 0 24px;
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
  .post-item { flex-direction: column; align-items: flex-start; gap: 4px; }
  .post-time { margin-left: 0; }
}
</style>
