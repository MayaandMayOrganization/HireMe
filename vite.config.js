import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: '**/*.{jsx,js,tsx,ts}',
    }),
  ],
  root: resolve(__dirname, 'frontend'),
  css: {
    postcss: resolve(__dirname, 'frontend/postcss.config.js'),
  },
})
