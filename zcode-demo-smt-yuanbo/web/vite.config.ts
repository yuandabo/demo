import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 三入口多页应用：portal(PC 前台) / admin(管理后台) / m(小程序 H5)，共享 src/shared 层
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        portal: fileURLToPath(new URL('./portal.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
        m: fileURLToPath(new URL('./m.html', import.meta.url)),
      },
    },
  },
  server: {
    proxy: {
      // 开发态后端在 3000（server/，INFRA-01 交付）；生产态 Express 直接托管 dist + /api
      '/api': 'http://localhost:3000',
    },
  },
})
