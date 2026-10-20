import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Where the app is published, for search engines and link previews, and the
// personal site it links back to. Override with RG_SITE_URL / RG_HOME_URL.
const SITE_URL = process.env.RG_SITE_URL ?? 'https://dawsonhorvath.com/resume-generator/';
const HOME_URL = process.env.RG_HOME_URL ?? 'https://dawsonhorvath.com/';

/** Fills %SITE_URL% and %HOME_URL% in index.html. */
function siteUrls(): Plugin {
  return {
    name: 'site-urls',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL).replaceAll('%HOME_URL%', HOME_URL),
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  // Relative asset paths so the build works at dawsonhorvath.com/resume-generator/
  // and anywhere else it's copied. Nested under resume-generator/ because the
  // Cloudflare Worker serves dist/ by path (see wrangler.jsonc).
  base: './',
  build: {
    outDir: 'dist/resume-generator',
    emptyOutDir: true,
  },
  define: {
    __HOME_URL__: JSON.stringify(HOME_URL),
  },
  plugins: [react(), siteUrls()],
});
