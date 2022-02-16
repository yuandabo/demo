import { defineConfig } from 'vite'
const path = require('path')

import vue from '@vitejs/plugin-vue'

function _resolve(dir) {
  return path.resolve(__dirname, dir);
}

// import Components from 'unplugin-vue-components/vite'
// import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// import vue from '@vitejs/plugin-vue';
import styleImport, { VantResolve } from 'vite-plugin-style-import';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    styleImport({
      resolves: [VantResolve()],
    })
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
