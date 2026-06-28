// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static site, deployed on Cloudflare Pages -> freesense.org / www.freesense.org
export default defineConfig({
  site: 'https://freesense.org',
  build: { format: 'directory' },
  integrations: [sitemap()],
});
