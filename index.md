---
title: "首页"
layout: home
---

# 📝 随笔与技术文章

<script setup>
import { data as posts } from './.vitepress/posts.data.mts'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<div class="post-list" style="margin-top: 24px;">
  <div v-for="post in posts" :key="post.url" style="padding: 12px 0; border-bottom: 1px solid var(--vp-c-divider); display: flex; justify-content: space-between; align-items: center;">
    <a :href="post.url" style="font-weight: 500; color: var(--vp-c-brand-1); text-decoration: none;">
      {{ post.frontmatter.title }}
    </a>
    <span style="font-size: 14px; color: var(--vp-c-text-2);">
      {{ formatDate(post.frontmatter.date) }}
    </span>
  </div>
</div>