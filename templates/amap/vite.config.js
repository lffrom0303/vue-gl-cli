import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ command, mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀。
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [vue()],
    server: {
      port: 3000,
      open: true
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            amap: ['@amap/amap-jsapi-loader']
          }
        }
      }
    },
    define: {
      // 在这里定义全局常量
      __AMAP_KEY__: JSON.stringify(env.VITE_AMAP_KEY)
    }
  };
}); 