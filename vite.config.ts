import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Pebble',
        short_name: 'Pebble',
        description: 'Notice where your money goes, without the anxiety.',
        display: 'standalone',
        start_url: '/',
        theme_color: '#f6f4ef',
        background_color: '#f6f4ef',
      },
    }),
  ],
  test: {
    environment: 'node',
    // A DST-observing zone, so date tests exercise the clock-change edge cases.
    env: { TZ: 'Europe/London' },
  },
})
