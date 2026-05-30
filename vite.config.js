import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { devLivekitTokenPlugin } from './vite/dev-livekit-token.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: '**/*.{jsx,js,tsx,ts}',
    }),
    devLivekitTokenPlugin(),
  ],
  root: resolve(__dirname, 'frontend'),
  css: {
    postcss: resolve(__dirname, 'frontend/postcss.config.js'),
  },
  server: {
    // Avoid browser CORS on GetAvatarContext Lambda (duplicate Allow-Origin headers).
    proxy: {
      '/api/avatar-context': {
        target: 'https://tiqv7tglmz2hb4qmpjrimr5pge0anuak.lambda-url.us-east-1.on.aws',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/avatar-context\/?/, '/'),
      },
    },
  },
})
