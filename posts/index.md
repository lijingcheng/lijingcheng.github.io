---
title: "文章列表"
layout: page
---

<script setup>
import { data as posts } from '../.vitepress/posts.data.mts'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

# 📝 全部文章

<div class="post-list">
  <div v-for="post in posts" :key="post.url" class="post-item">
    <a :href="post.url" class="post-title">{{ post.frontmatter.title }}</a>
    <span class="post-date">{{ formatDate(post.frontmatter.date) }}</span>
  </div>
</div>

<style scoped>
.post-list {
  margin-top: 24px;
}
.post-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.post-title {
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.post-title:hover {
  text-decoration: underline;
}
.post-date {
  font-size: 14px;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  margin-left: 16px;
}
</style>
