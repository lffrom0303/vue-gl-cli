import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('calcite-')
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['@arcgis/core/assets', '@arcgis/core/layers', '@arcgis/core/widgets'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 2000, // ArcGIS 包比较大，增加警告限制
    rollupOptions: {
      output: {
        manualChunks: {
          arcgis: ['@arcgis/core']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}); 