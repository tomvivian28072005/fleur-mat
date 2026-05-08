import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fsPlugin } from './plugins/fs-plugin';

export default defineConfig({
  plugins: [react(), fsPlugin()],
  server: {
    port: 5173,
    open: true,
  },
});
