import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true, // Demo preview only; production startup is disabled.
    watch: { ignored: ['**/playwright-report/**', '**/test-results/**'] },
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
  preview: { host: '0.0.0.0', port: 3000, allowedHosts: true },
});
