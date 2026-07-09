<template>
  <div class="gallery-container">
    <img
      v-for="(src, index) in galleryImages"
      :key="index"
      :src="src"
      class="gallery-img"
      @click="openLightbox(index)"
      loading="lazy"
    />

    <Teleport to="body">
      <div v-if="activeIndex !== null" class="lightbox" @click.self="closeLightbox">
        <button class="nav-btn prev" @click="prevImage" v-if="galleryImages.length > 1">
          ‹
        </button>
        <img :src="galleryImages[activeIndex]" class="lightbox-img" />
        <button class="nav-btn next" @click="nextImage" v-if="galleryImages.length > 1">
          ›
        </button>
        <button class="close-btn" @click="closeLightbox">×</button>
        <div class="counter">{{ activeIndex + 1 }} / {{ galleryImages.length }}</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import manifest from '../image-manifest.json'

const props = defineProps({
  dir: { type: String, required: true }
})

const galleryImages = computed(() => {
  // 去掉尾部斜杠，统一 key 格式
  const key = props.dir.replace(/\/$/, '')
  return manifest[key] || manifest[key + '/'] || []
})

const activeIndex = ref(null)

const openLightbox = (index) => {
  activeIndex.value = index
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  activeIndex.value = null
  document.body.style.overflow = ''
}

const prevImage = () => {
  const len = galleryImages.value.length
  activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : len - 1
}

const nextImage = () => {
  const len = galleryImages.value.length
  activeIndex.value = activeIndex.value < len - 1 ? activeIndex.value + 1 : 0
}

// 键盘事件
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (activeIndex.value === null) return
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowLeft') prevImage()
    if (e.key === 'ArrowRight') nextImage()
  })
}
</script>

<style scoped>
.gallery-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin: 24px 0;
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
  transform: scale(1.03);
}

.lightbox {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.lightbox-img {
  max-width: 85%;
  max-height: 85%;
  border-radius: 4px;
  user-select: none;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
}
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #fff;
  font-size: 52px;
  cursor: pointer;
  padding: 20px;
  user-select: none;
  transition: color 0.2s;
  line-height: 1;
}
.nav-btn:hover { color: #3eaf7c; }
.prev { left: 16px; }
.next { right: 16px; }
.close-btn {
  position: absolute;
  top: 20px; right: 28px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 40px;
  cursor: pointer;
  line-height: 1;
}
.close-btn:hover { color: #3eaf7c; }
.counter {
  position: absolute;
  bottom: 24px;
  color: #888;
  font-size: 14px;
}

@media (max-width: 600px) {
  .gallery-img { width: calc(50% - 4px); }
  .nav-btn { font-size: 36px; padding: 12px; }
  .prev { left: 4px; }
  .next { right: 4px; }
}
</style>
