import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Footer дээр харагдах build огноо — сайтад шинэ хувилбар орсон эсэхийг шалгахад
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ulaanbaatar' }).slice(0, 16)),
  },
  build: {
    rollupOptions: {
      output: {
        // Сан (vendor) кодыг тусад нь — апп шинэчлэгдэхэд хэрэглэгчийн кэш хэвээр үлдэнэ
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/three/')) return 'three';
          if (id.includes('firebase') || id.includes('re2js')) return 'firebase';
          if (id.includes('/react') || id.includes('/scheduler/')) return 'react';
        },
      },
    },
  },
})
