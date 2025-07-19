import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/player/',
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@model': resolve(__dirname, '../gamehub-model/src')
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: true
    },
    server: {
        port: 3001,
        host: true
    }
})
