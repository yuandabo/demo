import { defineConfig } from 'vite'
const path = require('path')

import vue from '@vitejs/plugin-vue'

function _resolve(dir) {
  return path.resolve(__dirname, dir);
}

import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': _resolve('src'),
    }
  },
  server: {
    cors: true,
    open: true,
    // proxy: {
    //   '/api': {
    //     target: 'http://192.168.99.223:3000',   //代理接口
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, '')
    //   }
    // }
  }
})
