import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Add headers to help with privacy extension blocking
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
  },
  build: {
    // Ensure proper chunking for lazy-loaded components
    rollupOptions: {
      output: {
        manualChunks: {
          'privacy-policy': ['./src/pages/PrivacyPolicy'],
        },
      },
    },
  },
})
