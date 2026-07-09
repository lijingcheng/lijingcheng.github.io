import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import ImageGallery from './ImageGallery.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('ImageGallery', ImageGallery)
  }
}
