---
layout: home
---

<script setup>
import { data as posts } from './.vitepress/posts.data.mts'
import { computed } from 'vue'

const recommended = computed(() => posts.filter(p => p.frontmatter.recommend))
</script>

<div class="home-page">
  <div class="weather">
    <div class="rain">
      <span class="drop" style="left:29%;--size:0.44;--d:6.0s;--delay:2.9s">💧</span>
      <span class="drop" style="left:43%;--size:0.46;--d:3.1s;--delay:2.2s">💧</span>
      <span class="drop" style="left:85%;--size:0.47;--d:4.2s;--delay:1.4s">💧</span>
      <span class="drop" style="left:15%;--size:0.54;--d:5.1s;--delay:4.4s">💧</span>
      <span class="drop" style="left:13%;--size:0.52;--d:6.0s;--delay:4.6s">💧</span>
      <span class="drop" style="left:82%;--size:0.47;--d:3.9s;--delay:1.3s">💧</span>
      <span class="drop" style="left:80%;--size:0.48;--d:3.6s;--delay:2.5s">💧</span>
      <span class="drop" style="left:53%;--size:0.47;--d:3.1s;--delay:3.0s">💧</span>
      <span class="drop" style="left:73%;--size:0.46;--d:4.6s;--delay:3.3s">💧</span>
      <span class="drop" style="left:88%;--size:0.45;--d:4.6s;--delay:0.8s">💧</span>
      <span class="drop" style="left:56%;--size:0.4;--d:5.0s;--delay:1.9s">💧</span>
      <span class="drop" style="left:48%;--size:0.39;--d:5.9s;--delay:3.7s">💧</span>
      <span class="drop" style="left:68%;--size:0.43;--d:4.7s;--delay:1.6s">💧</span>
      <span class="drop" style="left:24%;--size:0.55;--d:6.0s;--delay:0.6s">💧</span>
      <span class="drop" style="left:74%;--size:0.36;--d:5.9s;--delay:2.9s">💧</span>
      <span class="drop" style="left:33%;--size:0.48;--d:5.5s;--delay:0.8s">💧</span>
      <span class="drop" style="left:15%;--size:0.51;--d:4.9s;--delay:1.9s">💧</span>
      <span class="drop" style="left:83%;--size:0.48;--d:5.5s;--delay:2.1s">💧</span>
      <span class="drop" style="left:56%;--size:0.42;--d:5.0s;--delay:3.1s">💧</span>
      <span class="drop" style="left:45%;--size:0.49;--d:4.8s;--delay:0.3s">💧</span>
      <span class="drop" style="left:6%;--size:0.53;--d:4.1s;--delay:4.5s">💧</span>
      <span class="drop" style="left:65%;--size:0.49;--d:3.5s;--delay:1.4s">💧</span>
      <span class="drop" style="left:84%;--size:0.45;--d:5.7s;--delay:4.2s">💧</span>
      <span class="drop" style="left:50%;--size:0.35;--d:3.8s;--delay:1.8s">💧</span>
      <span class="drop" style="left:81%;--size:0.45;--d:3.4s;--delay:0.4s">💧</span>
      <span class="drop" style="left:36%;--size:0.4;--d:4.3s;--delay:4.5s">💧</span>
      <span class="drop" style="left:75%;--size:0.44;--d:3.5s;--delay:2.3s">💧</span>
      <span class="drop" style="left:98%;--size:0.36;--d:3.3s;--delay:4.6s">💧</span>
      <span class="drop" style="left:77%;--size:0.5;--d:4.8s;--delay:3.2s">💧</span>
      <span class="drop" style="left:13%;--size:0.47;--d:4.4s;--delay:2.8s">💧</span>
      <span class="drop" style="left:69%;--size:0.49;--d:5.4s;--delay:0.2s">💧</span>
      <span class="drop" style="left:25%;--size:0.53;--d:3.4s;--delay:0.8s">💧</span>
      <span class="drop" style="left:63%;--size:0.5;--d:5.3s;--delay:3.4s">💧</span>
      <span class="drop" style="left:7%;--size:0.51;--d:5.0s;--delay:2.3s">💧</span>
      <span class="drop" style="left:8%;--size:0.42;--d:4.9s;--delay:3.4s">💧</span>
      <span class="drop" style="left:66%;--size:0.36;--d:4.8s;--delay:0.3s">💧</span>
      <span class="drop" style="left:11%;--size:0.54;--d:3.5s;--delay:2.8s">💧</span>
      <span class="drop" style="left:62%;--size:0.41;--d:3.8s;--delay:0.3s">💧</span>
      <span class="drop" style="left:89%;--size:0.46;--d:4.0s;--delay:1.0s">💧</span>
      <span class="drop" style="left:98%;--size:0.53;--d:5.6s;--delay:1.2s">💧</span>
      <span class="drop" style="left:74%;--size:0.43;--d:5.0s;--delay:1.1s">💧</span>
      <span class="drop" style="left:34%;--size:0.43;--d:6.0s;--delay:2.4s">💧</span>
      <span class="drop" style="left:37%;--size:0.44;--d:3.4s;--delay:0.1s">💧</span>
      <span class="drop" style="left:81%;--size:0.46;--d:3.5s;--delay:2.0s">💧</span>
      <span class="drop" style="left:50%;--size:0.36;--d:4.4s;--delay:0.0s">💧</span>
    </div>
    <div class="snow">
      <span class="flake" style="left:10%;--size:0.92;--d:16.5s;--delay:8.9s;--drift:12px">❄</span>
      <span class="flake" style="left:69%;--size:0.92;--d:19.0s;--delay:16.0s;--drift:13px">❄</span>
      <span class="flake" style="left:96%;--size:1.01;--d:21.6s;--delay:16.4s;--drift:13px">❄</span>
      <span class="flake" style="left:69%;--size:0.75;--d:17.8s;--delay:11.5s;--drift:12px">❄</span>
      <span class="flake" style="left:50%;--size:0.85;--d:15.1s;--delay:4.1s;--drift:3px">❄</span>
      <span class="flake" style="left:36%;--size:1.01;--d:13.6s;--delay:14.7s;--drift:23px">❄</span>
      <span class="flake" style="left:30%;--size:0.83;--d:14.3s;--delay:0.8s;--drift:-9px">❄</span>
      <span class="flake" style="left:66%;--size:0.94;--d:12.8s;--delay:8.0s;--drift:20px">❄</span>
      <span class="flake" style="left:41%;--size:0.96;--d:15.1s;--delay:4.9s;--drift:0px">❄</span>
      <span class="flake" style="left:93%;--size:1.07;--d:17.2s;--delay:11.7s;--drift:-31px">❄</span>
      <span class="flake" style="left:28%;--size:0.89;--d:15.8s;--delay:8.9s;--drift:-8px">❄</span>
      <span class="flake" style="left:67%;--size:1.07;--d:15.1s;--delay:5.1s;--drift:-19px">❄</span>
      <span class="flake" style="left:8%;--size:1.14;--d:13.1s;--delay:14.0s;--drift:33px">❄</span>
      <span class="flake" style="left:98%;--size:1.13;--d:21.8s;--delay:4.3s;--drift:-34px">❄</span>
      <span class="flake" style="left:70%;--size:1.12;--d:19.6s;--delay:8.2s;--drift:-26px">❄</span>
      <span class="flake" style="left:80%;--size:1.03;--d:13.0s;--delay:5.5s;--drift:-14px">❄</span>
      <span class="flake" style="left:49%;--size:0.87;--d:19.3s;--delay:5.9s;--drift:-31px">❄</span>
      <span class="flake" style="left:43%;--size:0.79;--d:22.0s;--delay:5.6s;--drift:-21px">❄</span>
      <span class="flake" style="left:13%;--size:0.79;--d:20.3s;--delay:10.7s;--drift:-24px">❄</span>
      <span class="flake" style="left:6%;--size:1.05;--d:18.2s;--delay:8.7s;--drift:-14px">❄</span>
      <span class="flake" style="left:34%;--size:0.94;--d:14.4s;--delay:11.8s;--drift:-25px">❄</span>
      <span class="flake" style="left:23%;--size:0.77;--d:16.3s;--delay:15.8s;--drift:10px">❄</span>
      <span class="flake" style="left:26%;--size:1.02;--d:15.0s;--delay:5.4s;--drift:-2px">❄</span>
      <span class="flake" style="left:39%;--size:1.15;--d:15.6s;--delay:2.2s;--drift:-14px">❄</span>
      <span class="flake" style="left:93%;--size:1.05;--d:17.5s;--delay:0.8s;--drift:29px">❄</span>
      <span class="flake" style="left:47%;--size:0.76;--d:12.5s;--delay:6.8s;--drift:29px">❄</span>
      <span class="flake" style="left:67%;--size:1.1;--d:14.0s;--delay:14.3s;--drift:21px">❄</span>
      <span class="flake" style="left:34%;--size:0.8;--d:13.1s;--delay:0.2s;--drift:34px">❄</span>
      <span class="flake" style="left:90%;--size:1.05;--d:14.8s;--delay:4.9s;--drift:-8px">❄</span>
      <span class="flake" style="left:46%;--size:0.79;--d:13.6s;--delay:7.4s;--drift:9px">❄</span>
      <span class="flake" style="left:3%;--size:0.86;--d:17.1s;--delay:6.0s;--drift:-8px">❄</span>
      <span class="flake" style="left:42%;--size:0.82;--d:13.5s;--delay:17.8s;--drift:-25px">❄</span>
      <span class="flake" style="left:2%;--size:1.13;--d:12.7s;--delay:10.8s;--drift:19px">❄</span>
      <span class="flake" style="left:70%;--size:0.97;--d:15.0s;--delay:9.3s;--drift:20px">❄</span>
      <span class="flake" style="left:80%;--size:0.9;--d:15.1s;--delay:9.5s;--drift:-30px">❄</span>
      <span class="flake" style="left:5%;--size:1.13;--d:15.0s;--delay:1.8s;--drift:18px">❄</span>
      <span class="flake" style="left:48%;--size:0.92;--d:12.3s;--delay:1.7s;--drift:-12px">❄</span>
      <span class="flake" style="left:98%;--size:1.11;--d:15.0s;--delay:3.7s;--drift:-1px">❄</span>
      <span class="flake" style="left:70%;--size:0.76;--d:14.5s;--delay:8.8s;--drift:-21px">❄</span>
      <span class="flake" style="left:82%;--size:0.81;--d:20.1s;--delay:3.8s;--drift:6px">❄</span>
      <span class="flake" style="left:54%;--size:0.82;--d:12.9s;--delay:11.9s;--drift:-11px">❄</span>
      <span class="flake" style="left:90%;--size:1.12;--d:18.6s;--delay:15.0s;--drift:8px">❄</span>
      <span class="flake" style="left:77%;--size:0.85;--d:15.6s;--delay:10.6s;--drift:16px">❄</span>
      <span class="flake" style="left:28%;--size:1.02;--d:15.9s;--delay:5.9s;--drift:9px">❄</span>
      <span class="flake" style="left:91%;--size:0.77;--d:21.6s;--delay:3.4s;--drift:31px">❄</span>
      <span class="flake" style="left:60%;--size:0.82;--d:21.2s;--delay:2.9s;--drift:-2px">❄</span>
      <span class="flake" style="left:83%;--size:0.77;--d:17.5s;--delay:13.8s;--drift:-2px">❄</span>
      <span class="flake" style="left:8%;--size:0.94;--d:14.3s;--delay:14.9s;--drift:8px">❄</span>
      <span class="flake" style="left:45%;--size:0.82;--d:15.1s;--delay:14.0s;--drift:-9px">❄</span>
      <span class="flake" style="left:37%;--size:1.08;--d:17.1s;--delay:12.9s;--drift:-28px">❄</span>
    </div>
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
  position: relative;
  z-index: 1;
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
.weather {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.rain { display: block; }
.snow { display: none; }
.dark .rain { display: none; }
.dark .snow { display: block; }

/* Rain drops */
.drop {
  position: absolute;
  top: -10px;
  display: block;
  font-size: calc(var(--size, 1) * 16px);
  color: rgba(80, 96, 115, 0.92);
  opacity: 0;
  animation: rain-fall var(--d, 3.5s) linear var(--delay, 0s) infinite;
}
@keyframes rain-fall {
  0%   { transform: translateY(-20px); opacity: 0; }
  10%  { opacity: 0.7; }
  90%  { opacity: 0.7; }
  100% { transform: translateY(105vh); opacity: 0; }
}

/* Snow flakes */
.flake {
  position: absolute;
  top: -10px;
  display: block;
  font-size: calc(var(--size, 1) * 16px);
  color: #fff;
  opacity: 0;
  animation: snow-fall var(--d, 8s) linear var(--delay, 0s) infinite;
}
@keyframes snow-fall {
  0%   { transform: translateY(-10px) translateX(0); opacity: 0; }
  10%  { opacity: 0.8; }
  50%  { transform: translateY(50vh) translateX(var(--drift, 20px)); opacity: 0.8; }
  90%  { opacity: 0.8; }
  100% { transform: translateY(105vh) translateX(calc(var(--drift, 20px) * -0.5)); opacity: 0; }
}

@media (max-width: 480px) {
  .home-page { padding: 32px 16px 32px; }
  .hero-avatar { width: 88px; height: 88px; }
  .hero-title { font-size: 26px; }
}
</style>
