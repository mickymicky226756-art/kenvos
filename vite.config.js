import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // During `npm run dev`, forward API calls to the Node server (npm run server)
    proxy: { '/api': 'http://localhost:3001' },
  },
});
