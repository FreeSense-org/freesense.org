// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The freesense.org website, deployed on Cloudflare Pages.
// News and app data live in ../src/data and ../public/apps, shared with the root Functions.
export default defineConfig({
  site: 'https://freesense.org',
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
