import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'assets/icons/*.png'],
      manifest: {
        name: 'Valnor - RPG 3D',
        short_name: 'Valnor',
        description: 'Juego RPG 3D de fantasía épica',
        theme_color: '#030712',
        background_color: '#030712',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          {
            src: '/assets/icons/Logo_2.webp',
            sizes: '192x192',
            type: 'image/webp',
          },
          {
            src: '/assets/icons/Logo_2.webp',
            sizes: '512x512',
            type: 'image/webp',
          },
          {
            src: '/assets/icons/Logo_2.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],  // webp incluido para cachear iconos/texturas
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy para auth y API → backend en :8080
      // Así las cookies se envían correctamente (mismo origen)
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Evitar que el proxy intercepte rutas de frontend (peticiones de navegación)
        bypass: (req) => {
          if (req.headers.accept?.indexOf('text/html') !== -1) {
            return '/index.html';
          }
        },
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-physics': ['@react-three/rapier'],
          'vendor-state': ['zustand'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
});
