import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 引入全局样式
import './styles/globals.css'
import './styles/theme.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
