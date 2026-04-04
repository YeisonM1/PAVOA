import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Acelera la carga separando las librerías pesadas del código de tu app
    rollupOptions: {
      output: {
        manualChunks: {
          // Chunk 1: El motor de React (rara vez cambia, excelente para caché)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Chunk 2: Los íconos (Aquí atacamos el problema de los 82 KiB de lucide-react)
          'vendor-icons': ['lucide-react', 'react-icons'],
          // Chunk 3: El cliente de base de datos
          'vendor-db': ['@supabase/supabase-js']
        }
      }
    },
    // Ajuste de límite de advertencia de tamaño (para que Vite no se queje)
    chunkSizeWarningLimit: 600,
  },
  // Elimina automáticamente todos los console.log() en producción para ahorrar peso
  esbuild: {
    drop: ['console', 'debugger'],
  }
})