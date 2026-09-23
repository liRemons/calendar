import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** 运行时依赖：external 化，交由消费方安装，避免重复打包 */
const EXTERNAL_IDS = ['react', 'react-dom', 'antd', '@ant-design/icons', 'dayjs', 'lunar-javascript'];

const isExternal = (id: string) =>
  EXTERNAL_IDS.some((dep) => id === dep || id.startsWith(`${dep}/`));

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'RemonsCalendar',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: isExternal,
      output: {
        exports: 'named',
        // 组件样式统一输出为 dist/style.css
        assetFileNames: (assetInfo) => (assetInfo.name?.endsWith('.css') ? 'style.css' : assetInfo.name!),
      },
    },
    cssCodeSplit: false,
  },
});