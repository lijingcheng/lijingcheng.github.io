<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'

const { Layout: DefaultLayout } = DefaultTheme
const { frontmatter } = useData()

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <DefaultLayout>
    <template #doc-before>
      <div v-if="frontmatter.date" class="post-header">
        <h1 class="post-title">{{ frontmatter.title }}</h1>
        <time class="post-date">{{ formatDate(frontmatter.date) }}</time>
      </div>
    </template>
  </DefaultLayout>
</template>

<style>
.post-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.post-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 8px;
  color: var(--vp-c-text-1);
}
.post-date {
  font-size: 14px;
  color: var(--vp-c-text-2);
}
/* 隐藏 VitePress 默认渲染的标题 h1，避免与自定义 header 重复 */
.vp-doc > h1:first-child {
  display: none;
}
/* 去掉紧跟在 header 后的 h2 上边框，避免出现第二根线 */
.vp-doc > h2:first-of-type {
  border-top: none;
  margin-top: 0;
}
</style>
