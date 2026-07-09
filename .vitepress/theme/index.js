import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import ImageGallery from './ImageGallery.vue'
import PostList from './PostList.vue'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('ImageGallery', ImageGallery)
    app.component('PostList', PostList)
  }
}
