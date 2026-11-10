/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages sert le site sous /<nom-du-dépôt>/.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/collection_cartes/' : '/',
  plugins: [react(), tailwindcss()],
  // Date de construction, affichée dans « Mes inscriptions » pour vérifier la version.
  define: { __VERSION__: JSON.stringify(new Date().toISOString()) },
  build: { chunkSizeWarningLimit: 600 },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
