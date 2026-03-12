import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://localhost:7076',
        changeOrigin: true,
        secure: false
      },
      '/collaborationHub': {
        target: 'https://localhost:7076',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})