import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    // Windows-specific optimizations
    watch: {
      usePolling: false,
      interval: 100,
    },
  },
  // Optimize for Windows/Dropbox environments
  optimizeDeps: {
    force: false, // Set to true if you need to force re-optimization
    // Include react-window to ensure all exports are available
    include: ['react-window'],
    // Exclude problematic dependencies from pre-bundling if needed
    exclude: [],
  },
  // Cache configuration - use a more stable location for Dropbox
  cacheDir: 'node_modules/.vite',
  // Build optimizations
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
          'pdf-vendor': ['react-pdf'],
        },
      },
    },
    // Minify and optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production (keep console.error and console.warn)
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false, // Remove comments
      },
    },
    // Source maps for production debugging (optional - set to false for smaller builds)
    sourcemap: false,
    // Target modern browsers for smaller bundle
    target: 'esnext',
  },
})
