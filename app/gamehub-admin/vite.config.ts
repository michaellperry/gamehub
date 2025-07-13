import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on mode
    const env = loadEnv(mode, process.cwd(), 'VITE_');

    return {
        plugins: [react()],
        base: env.VITE_BASE_NAME || '/', // Use VITE_BASE_NAME from env files
        resolve: {
            alias: {
                '@model': resolve(__dirname, '../gamehub-model/dist/esm'),
                '@': resolve(__dirname, './src'),
            },
        },
        define: {
            global: 'globalThis',
            'process.env': '{}',
            'process.argv': '[]',
            process: '{"argv":[],"env":{}}',
        },
        server: {
            port: 3000,
            open: true,
        },
        build: {
            outDir: 'dist',
            sourcemap: true,
        },
    };
});
