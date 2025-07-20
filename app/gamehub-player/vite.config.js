import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
// https://vitejs.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    // Load env file based on mode
    var env = loadEnv(mode, process.cwd(), 'VITE_');
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
            port: 3001, // Different port from admin to avoid conflicts
            open: true,
        },
        build: {
            outDir: 'dist',
            sourcemap: true,
        },
    };
});
