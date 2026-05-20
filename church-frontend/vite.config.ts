import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Force fresh deploy - v2
export default defineConfig({
  plugins: [react()],
  base: '/',
})