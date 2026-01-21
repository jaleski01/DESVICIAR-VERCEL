import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // MUDANÇA CRÍTICA: De 'injectManifest' para 'generateSW' para evitar erros de parseAst no Rollup
      registerType: 'autoUpdate', 
      strategies: 'generateSW', 
      
      // Configurações de Cache e Workbox automáticas
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },

      // Opções de Desenvolvimento
      devOptions: {
        enabled: true,
      },

      // Assets críticos para inclusão no cache
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],

      // Manifesto da Aplicação
      manifest: {
        name: 'DSVC',
        short_name: 'DSVC',
        description: 'A high-performance, dark-themed secure application.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'https://i.imgur.com/nyLkCgz.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'https://i.imgur.com/j9b02I4.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000
  }
})