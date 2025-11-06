import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Build configuration for production
  build: {
    target: 'es2015', // Browser compatibility target
    minify: 'terser', // Use terser for better minification
    sourcemap: false, // Disable sourcemaps in production for security

    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Editor chunk (large dependency)
          editor: ['react-quill-new', 'quill'],
        },
      },
    },

    // Optimize bundle size
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
  },

  // Development server configuration
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend in development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // Preview server configuration (for testing production build)
  preview: {
    port: 5173,
  },
})
