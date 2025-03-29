import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar()
  ],
  base: '/stream/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true
  },
  assetsInclude: ['**/*.mp4', '**/*.webm'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      external: ['hls.js'],
    }
  }
})
