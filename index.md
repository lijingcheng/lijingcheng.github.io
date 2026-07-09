---
layout: home
---

<script setup>
import { data as posts } from './.vitepress/posts.data.mts'
import { computed } from 'vue'

const recommended = computed(() => posts.filter(p => p.frontmatter.recommend))
</script>

<div class="home-page">
  <div class="hero">
    <img class="hero-avatar" src="/images/avatar.png" alt="avatar" />
    <h1 class="hero-title">你好，我是风行</h1>
    <p class="hero-subtitle">iOS 开发者</p>
    <p class="hero-desc">
      写代码也看世界，十年来用文字记录技术思考与山川湖海。<br>
      这里是我的个人博客，分享 iOS 开发中的探索与实践，<br>
      也记录旅途中的风景与故事。
    </p>
  </div>

  <PostList :posts="recommended" :groupByYear="false" :showBadge="false" :card="true" :fullDate="true" />

  <div class="section-foot">
    <a href="/posts/" class="section-more">浏览全部文章 →</a>
  </div>
</div>

<style>
.home-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 80px 24px 64px;
}
.hero {
  text-align: center;
  margin-bottom: 48px;
}
.hero-avatar {
  display: block;
  margin: 0 auto 24px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid var(--vp-c-divider);
}
.hero-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--vp-c-text-1);
  margin: 0 0 10px;
  letter-spacing: -0.3px;
}
.hero-subtitle {
  font-size: 15px;
  color: var(--vp-c-text-2);
  margin: 0 0 20px;
}
.hero-desc {
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.8;
  margin: 0;
}
.section-foot {
  text-align: center;
  margin-top: 24px;
}
.section-more {
  font-size: 14px;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.section-more:hover {
  text-decoration: underline;
}
@media (max-width: 480px) {
  .home-page { padding: 48px 16px 32px; }
  .hero-avatar { width: 72px; height: 72px; }
  .hero-title { font-size: 26px; }
}
</style>
