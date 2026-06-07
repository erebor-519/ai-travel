import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './locales'

// 引入全局样式
import './styles/globals.css'
import './styles/theme.css'

const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')
