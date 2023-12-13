import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    global: 'window',
    process: '{ env: {} }',
  },
  resolve: {
    alias: {
      stream: 'stream-browserify'
    }
  },
  server: {
    fs: {
      strict: false
    }
  }
});
