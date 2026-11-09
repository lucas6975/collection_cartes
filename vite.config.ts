/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages sert le site sous /<nom-du-dépôt>/.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/collection_cartes/' : '/',
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 600 },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
