---
layout: home
---

<script setup>
import { data as posts } from './.vitepress/posts.data.mts'
import { computed } from 'vue'

const recommended = computed(() => posts.filter(p => p.frontmatter.recommend))
</script>

<div class="home-page">
  <div class="clover-left">
    <span class="clover" style="top:12%;font-size:22px;opacity:.35;transform:rotate(-15deg)">🍀</span>
    <span class="clover" style="top:32%;font-size:16px;opacity:.25;transform:rotate(20deg)">🍀</span>
    <span class="clover" style="top:55%;font-size:20px;opacity:.3;transform:rotate(-10deg)">🍀</span>
    <span class="clover" style="top:75%;font-size:14px;opacity:.2;transform:rotate(25deg)">🍀</span>
  </div>
  <div class="clover-right">
    <span class="clover" style="top:18%;font-size:18px;opacity:.3;transform:rotate(15deg)">🍀</span>
    <span class="clover" style="top:40%;font-size:24px;opacity:.35;transform:rotate(-20deg)">🍀</span>
    <span class="clover" style="top:62%;font-size:15px;opacity:.25;transform:rotate(10deg)">🍀</span>
    <span class="clover" style="top:82%;font-size:20px;opacity:.28;transform:rotate(-15deg)">🍀</span>
  </div>
  <div class="hero">
    <img class="hero-avatar" src="/images/avatar.png" alt="avatar" />
    <h1 class="hero-title">风行</h1>
    <p class="hero-desc">
      Bug 的不焚者，移动全栈的执掌者<br>
      掌控三秒区的制空者，跨越群山与雪线的行者<br>
      即将驶向全球海域、用代码丈量世界的独立出海人
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
  padding: 48px 24px 64px;
}
.hero {
  text-align: center;
  margin-bottom: 48px;
}
.hero-avatar {
  display: block;
  margin: 0 auto 24px;
  width: 120px;
  height: 120px;
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
  .home-page { padding: 32px 16px 32px; }
  .hero-avatar { width: 88px; height: 88px; }
  .hero-title { font-size: 26px; }
}
</style>
