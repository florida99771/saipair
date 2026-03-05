import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../../core'),
    },
  },
  plugins: [
    {
      name: 'js-jsx',
      async transform(code, id) {
        if (!/src\/.*\.js$/.test(id)) return null;
        return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
      },
    },
    react(),
    electron([
      {
        entry: 'electron/main.js',
      },
      {
        entry: 'electron/preload.js',
        onstart(args) {
          args.reload();
        },
      },
    ]),
    renderer(),
  ],
});
