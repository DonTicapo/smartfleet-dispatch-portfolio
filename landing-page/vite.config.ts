import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/smartfleet-dispatch-portfolio/',
  server: {
    port: 5173,
  },
});
