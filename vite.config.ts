import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Relative asset paths so the build works at dawsonhorvath.com/resume-generator/
  // (GitHub Pages serves the docs/ folder) and anywhere else it's copied.
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  plugins: [react()],
});
