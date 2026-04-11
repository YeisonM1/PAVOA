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
        // ✅ Vite 8 (rolldown) requiere función, no objeto
        manualChunks: (id) => {
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('lucide-react') || id.includes('react-icons')) {
            return 'vendor-icons';
          }
        },
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
  },

  // ✅ Vite 8 usa oxc por defecto — eliminamos console.log en producción
  oxc: {
    transform: {
      drop: ['console', 'debugger'],
    }
  },

  // ✅ Alias para imports más limpios
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