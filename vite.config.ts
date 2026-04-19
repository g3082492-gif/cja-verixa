import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Increase the limit to 1000kb to suppress warnings for large analytical libraries
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Splitting large vendor libraries into their own chunks for better caching and performance
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['date-fns', 'lucide-react', 'clsx', 'tailwind-merge']
        }
      }
    }
  }
})
