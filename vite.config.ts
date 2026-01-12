
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
    // Meningkatkan limit warning menjadi 1MB (1000kb)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Memecah library besar menjadi file terpisah (Vendor Splitting)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('@google/genai')) return 'vendor-ai';
            return 'vendor';
          }
        }
      }
    }
  }
});
