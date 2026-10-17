// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Beta of the next freesense.org, deployed on Cloudflare Pages -> beta.freesense.org.
// News and app data are shared with the current site in ../src/data until cutover.
export default defineConfig({
  site: 'https://beta.freesense.org',
  build: { format: 'directory' },
  integrations: [sitemap()],
  vite: {
    server: { fs: { allow: ['..'] } },
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
        },
      },
    },
  },
});
