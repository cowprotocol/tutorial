import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    global: 'window',
    process: '{ env: {} }',
  },
  server: {
    fs: {
      strict: false
    }
  }
});
