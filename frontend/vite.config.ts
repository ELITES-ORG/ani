import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // The API's contracts directory is the single definition of every
      // response shape. See backend/src/contracts/README.md.
      '@contracts': fileURLToPath(new URL('../backend/src/contracts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Proxying in dev keeps the browser on a single origin, so cookie-based
    // sessions behave the same locally as they will in production.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
  },
});
