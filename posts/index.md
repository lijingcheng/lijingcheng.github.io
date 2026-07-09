---
layout: page
---

<script setup>
import { data as posts } from '../.vitepress/posts.data.mts'
</script>

<div class="post-list-page">
  <h1 class="page-heading">全部文章</h1>
  <PostList :posts="posts" />
</div>

<style scoped>
.post-list-page {
  padding: 0 24px 48px;
}
.page-heading {
  max-width: 720px;
  margin: 32px auto 24px;
  font-size: 28px;
  font-weight: 700;
}
</style>
