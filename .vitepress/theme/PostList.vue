<script setup>
import { computed } from 'vue'

const props = defineProps({
  posts: { type: Array, required: true },
  limit: { type: Number, default: 0 }, // 0 = 显示全部
  groupByYear: { type: Boolean, default: true },
  showBadge: { type: Boolean, default: true },
  card: { type: Boolean, default: false },
  fullDate: { type: Boolean, default: false }
})

function parseDate(d) {
  if (!d) return new Date(NaN)
  // Safari 只认 ISO 8601, 把 'YYYY-MM-DD HH:mm:ss +0800' 转成标准格式
  let s = String(d).trim()
  s = s.replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T')
  s = s.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  return new Date(s)
}

function formatDate(d) {
  const dt = parseDate(d)
  if (isNaN(dt)) return ''
  return dt.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function formatFullDate(d) {
  const dt = parseDate(d)
  if (isNaN(dt)) return ''
  return dt.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

const visiblePosts = computed(() => {
  return props.limit > 0 ? props.posts.slice(0, props.limit) : props.posts
})

const groupedPosts = computed(() => {
  const map = {}
  visiblePosts.value.forEach(post => {
    const year = parseDate(post.frontmatter.date).getFullYear()
    if (!map[year]) map[year] = []
    map[year].push(post)
  })
  return Object.entries(map).sort((a, b) => Number(b[0]) - Number(a[0]))
})
</script>

<template>
  <div class="post-list-wrap" :class="{ 'card-style': card }">
    <!-- 按年分组模式 -->
    <template v-if="groupByYear">
      <template v-for="[year, posts] in groupedPosts" :key="year">
        <h2 class="year-heading">{{ year }}</h2>
        <div class="post-list">
          <div v-for="post in posts" :key="post.url" class="post-item" :class="{ card: card }">
            <a :href="post.url" class="post-link">
              {{ post.frontmatter.title }}
              <span v-if="showBadge && post.frontmatter.recommend" class="post-badge">荐</span>
            </a>
            <span class="post-time">{{ fullDate ? formatFullDate(post.frontmatter.date) : formatDate(post.frontmatter.date) }}</span>
          </div>
        </div>
      </template>
    </template>
    <!-- 不分年模式 -->
    <template v-else>
      <div class="post-list">
        <div v-for="post in visiblePosts" :key="post.url" class="post-item" :class="{ card: card }">
          <a :href="post.url" class="post-link">
            {{ post.frontmatter.title }}
            <span v-if="showBadge && post.frontmatter.recommend" class="post-badge">荐</span>
          </a>
          <span class="post-time">{{ fullDate ? formatFullDate(post.frontmatter.date) : formatDate(post.frontmatter.date) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.post-list-wrap {
  max-width: 720px;
  margin: 0 auto;
}
.year-heading {
  font-size: 20px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 40px 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--vp-c-brand-1);
}
.year-heading:first-child {
  margin-top: 0;
}
.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.post-item.card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.post-item.card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.post-item.card .post-link {
  font-size: 14px;
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
.post-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--vp-c-brand-1);
  border-radius: 3px;
  padding: 1px 5px;
  margin-left: 6px;
  vertical-align: middle;
  line-height: 1.4;
}
.post-time {
  font-size: 13px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  margin-left: 16px;
}
.card-style .post-time {
  font-size: 12px;
}
@media (max-width: 600px) {
  .post-item { flex-direction: column; align-items: flex-start; gap: 4px; }
  .post-time { margin-left: 0; }
  .post-item.card { padding: 14px 16px; }
}
</style>
