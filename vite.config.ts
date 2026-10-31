import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Relative URLs, so the same build works at a domain root or in a subfolder
  // (routing is hash-based, so no server rewrites are needed either).
  base: './',
  plugins: [
    react(),
    VitePWA({
      // A new version installs in the background and takes over the next time
      // the app is opened, rather than reloading mid-entry.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: './',
        name: 'Pebble',
        short_name: 'Pebble',
        description: 'Notice where your money goes, without the anxiety.',
        display: 'standalone',
        start_url: './',
        scope: './',
        theme_color: '#f6f4ef',
        background_color: '#f6f4ef',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    // A DST-observing zone, so date tests exercise the clock-change edge cases.
    env: { TZ: 'Europe/London' },
  },
})
