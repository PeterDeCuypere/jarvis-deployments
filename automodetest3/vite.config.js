import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['plotly.js-dist-min', 'react-plotly.js'],
          utils: ['papaparse', 'zustand']
        }
      }
    }
  },
  server: {
    port: process.env.PORT || 3000,
    host: true,
      allowedHosts: true
  }
});
