import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// Force fresh deploy - v3
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        fs.copyFileSync(
          resolve(__dirname, 'public/_redirects'),
          resolve(__dirname, 'dist/_redirects')
        )
        console.log('✅ _redirects copied to dist/')
      }
    }
  ],
  base: '/',
})