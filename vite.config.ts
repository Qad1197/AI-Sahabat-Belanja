
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Menjamin process.env.API_KEY tetap bekerja seperti pada instruksi
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    // Target es2022 mendukung native DOMException secara default di level runtime modern
    target: 'es2022',
    chunkSizeWarningLimit: 2000, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('@google/genai')) return 'vendor-ai';
            return 'vendor-base';
          }
        }
      }
    }
  }
});
