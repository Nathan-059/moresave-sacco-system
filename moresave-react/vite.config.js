import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Moresave SACCO',
        short_name: 'Moresave',
        description: 'Moresave SACCO Management System',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // Production build — API calls go to same Vercel domain, no proxy needed
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})