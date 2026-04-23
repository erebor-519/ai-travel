import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/amap': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amap/, '')
      }
    }
  }
})
