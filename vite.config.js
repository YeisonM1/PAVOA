import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('@fontsource')) {
            return 'fonts';
          }
          if (id.includes('src/sections/Categorias') || id.includes('src/sections/Productos')) {
            return 'home-above';
          }
          if (id.includes('src/sections/Filosofia') || id.includes('src/sections/Instagram') || id.includes('src/sections/Ticker')) {
            return 'home-below';
          }
        },
      }
    },
    modulePreload: {
      polyfill: false,
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
  },

  oxc: {
    transform: {
      drop: ['console', 'debugger'],
    }
  },

  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@hooks': '/src/hooks',
      '@assets': '/src/assets',
    }
  }
})