import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'gamehub-model': resolve(__dirname, '../gamehub-model/dist/esm'),
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': '{}',
    'process.argv': '[]',
    'process': '{"argv":[],"env":{}}',
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})