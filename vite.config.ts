import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { assetManifest } from './scripts/vite-asset-manifest.ts';

export default defineConfig(({ mode }) => ({
  server: { host: true },
  plugins: [
    assetManifest(),
    // `npm run dev:https` serves a self-signed cert so the mic works on the tablet.
    ...(mode === 'https' ? [basicSsl()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Helper Town',
        short_name: 'Helper Town',
        description: "Help Pops fix things in his workshop.",
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#5b3a24',
        theme_color: '#5b3a24',
        start_url: '.',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,mp3,ogg,m4a,wav,webmanifest}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));
