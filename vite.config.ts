import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['theme/icon-192.png', 'theme/icon-512.png'],
      manifest: {
        name: 'Shot Tracker',
        short_name: 'Slate',
        description:
          'On-set video production tracker: scenes, shots, takes, and digital clapperboard sync.',
        theme_color: '#0a0a0d',
        background_color: '#0a0a0d',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait',
        id: './',
        scope: './',
        start_url: './',
        icons: [
          { src: 'theme/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'theme/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: './index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
