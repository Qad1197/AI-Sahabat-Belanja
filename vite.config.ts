
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
    target: 'esnext',
    // Perbaikan untuk pesan "- Adjust chunk size limit..."
    chunkSizeWarningLimit: 1600, 
    rollupOptions: {
      output: {
        // Strategi manualChunks untuk memisahkan library besar (Code Splitting)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('@google/genai')) return 'vendor-ai';
            return 'vendor-base'; // React & yang lainnya
          }
        }
      }
    }
  }
});
