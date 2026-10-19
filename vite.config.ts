import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/mada/', // Adicione esta linha (coloque o nome exato do repo no GitHub)
  server: {
    port: 3000,
    open: false,
  },
});
