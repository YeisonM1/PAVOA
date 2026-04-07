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
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react', 'react-icons'],
          'vendor-db':    ['@supabase/supabase-js'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
    // ✅ esbuild es más rápido que terser y ya está incluido en Vite — no requiere instalación
    minify: 'esbuild',
    sourcemap: false,
  },

  // ✅ Elimina console.log y debugger en producción
  esbuild: {
    drop: ['console', 'debugger'],
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