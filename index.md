---
layout: home
---

<script setup>
import { data as posts } from './.vitepress/posts.data.mts'
import { computed } from 'vue'

const recommended = computed(() => posts.filter(p => p.frontmatter.recommend))
</script>

<div class="home-page">
  <div class="clovers">
    <span class="clover" style="left:18%;top:14%;--r:3deg">🍀</span>
    <span class="clover" style="left:77%;top:7%;--r:12deg">🍀</span>
    <span class="clover" style="left:19%;top:66%;--r:-34deg">🍀</span>
    <span class="clover" style="left:66%;top:8%;--r:-34deg">🍀</span>
    <span class="clover" style="left:75%;top:23%;--r:-1deg">🍀</span>
    <span class="clover" style="left:30%;top:50%;--r:20deg">🍀</span>
    <span class="clover" style="left:71%;top:41%;--r:-8deg">🍀</span>
    <span class="clover" style="left:10%;top:51%;--r:24deg">🍀</span>
    <span class="clover" style="left:68%;top:18%;--r:-33deg">🍀</span>
    <span class="clover" style="left:92%;top:49%;--r:1deg">🍀</span>
    <span class="clover" style="left:16%;top:4%;--r:-21deg">🍀</span>
    <span class="clover" style="left:22%;top:17%;--r:-29deg">🍀</span>
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
.clovers {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: -1;
}
.clover {
  position: absolute;
  display: block;
  font-size: 20px;
  opacity: .8;
  animation: clover-float 7s ease-in-out infinite both;
  transform: rotate(var(--r, 0deg));
}
.clover:nth-child(odd) { animation-delay: -3s; animation-duration: 6s; }
.clover:nth-child(even) { animation-delay: -1s; animation-duration: 8s; }
.clover:nth-child(5n+1) { animation-delay: -5s; }
.clover:nth-child(7n+3) { animation-delay: -2s; }
@keyframes clover-float {
  0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
  50% { transform: translateY(-6px) rotate(var(--r, 0deg)); }
}
@media (max-width: 860px) {
  .clovers { display: none; }
}
@media (max-width: 480px) {
  .home-page { padding: 32px 16px 32px; }
  .hero-avatar { width: 88px; height: 88px; }
  .hero-title { font-size: 26px; }
}
</style>
