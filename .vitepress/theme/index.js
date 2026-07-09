import DefaultTheme from 'vitepress/theme'
import ImageGallery from './ImageGallery.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 只注册我们的相册组件，不引用任何第三方插件
    app.component('ImageGallery', ImageGallery)
  }
}