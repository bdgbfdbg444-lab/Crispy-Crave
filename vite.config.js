import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Crispy-Crave/',
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 650,
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        // Exclude heavy vendors from index.html modulepreload
        // This speeds up initial mobile FCP drastically!
        return deps.filter(dep => 
          !dep.includes('firebase-vendor') && 
          !dep.includes('three-vendor') && 
          !dep.includes('leaflet-vendor') &&
          !dep.includes('motion-vendor')
        );
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'motion-vendor';
            }
            if (id.includes('three')) {
              return 'three-vendor';
            }
            if (id.includes('leaflet')) {
              return 'leaflet-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-vendor';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-core';
            }
          }
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger']
  }
})
