<template>
  <div class="gallery-container">
    <!-- 缩略照片墙 -->
    <img 
      v-for="(src, index) in galleryImages" 
      :key="index" 
      :src="src" 
      class="gallery-img"
      @click="openLightbox(index)"
      loading="lazy"
    />
    
    <!-- 纯原生自建灯箱遮罩层（支持左右翻页） -->
    <div v-if="activeIndex !== null" class="lightbox" @click.self="closeLightbox">
      <!-- 左切换按钮 -->
      <button class="nav-btn prev" @click="prevImage" v-if="galleryImages.length > 1">‹</button>
      
      <!-- 大图展示 -->
      <img :src="galleryImages[activeIndex]" class="lightbox-img" />
      
      <!-- 右切换按钮 -->
      <button class="nav-btn next" @click="nextImage" v-if="galleryImages.length > 1">›</button>
      
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="closeLightbox">×</button>
      
      <!-- 页码提示 -->
      <div class="counter">{{ activeIndex + 1 }} / {{ galleryImages.length }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  dir: { type: String, required: true }
})

// 自动扫描目录
const allImages = import.meta.glob('/public/images/**/*.{png,jpg,jpeg,GIF,webp,PNG,JPG,JPEG}', { eager: true })

const galleryImages = computed(() => {
  const targetDir = `/public${props.dir}`
  return Object.keys(allImages)
    .filter(path => path.startsWith(targetDir))
    .map(path => path.replace('/public', ''))
})

// 灯箱状态控制
const activeIndex = ref(null)

const openLightbox = (index) => { activeIndex.value = index }
const closeLightbox = () => { activeIndex.value = null }

const prevImage = () => {
  if (activeIndex.value > 0) {
    activeIndex.value--
  } else {
    activeIndex.value = galleryImages.value.length - 1 // 循环到最后一张
  }
}

const nextImage = () => {
  if (activeIndex.value < galleryImages.value.length - 1) {
    activeIndex.value++
  } else {
    activeIndex.value = 0 // 循环回第一张
  }
}
</script>

<style scoped>
.gallery-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin: 20px 0;
}
.gallery-img {
  width: calc(33.33% - 6px);
  min-width: 120px;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
  cursor: zoom-in;
  transition: transform 0.2s;
}
.gallery-img:hover {
  transform: scale(1.02);
}

/* 灯箱黑幕背景 */
.lightbox {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex; justify-content: center; align-items: center;
  z-index: 9999;
}
.lightbox-img {
  max-width: 85%;
  max-height: 85%;
  border-radius: 4px;
  user-select: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

/* 翻页按钮样式 */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: white;
  font-size: 48px;
  cursor: pointer;
  padding: 20px;
  user-select: none;
  transition: color 0.2s;
}
.nav-btn:hover { color: #3eaf7c; }
.prev { left: 20px; }
.next { right: 20px; }

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 20px; right: 30px;
  background: transparent;
  border: none;
  color: white;
  font-size: 36px;
  cursor: pointer;
}
.close-btn:hover { color: #3eaf7c; }

/* 页码计数器 */
.counter {
  position: absolute;
  bottom: 20px;
  color: #888;
  font-size: 14px;
}

@media (max-width: 600px) {
  .gallery-img { width: calc(50% - 4px); }
  .nav-btn { font-size: 36px; padding: 10px; }
}
</style>