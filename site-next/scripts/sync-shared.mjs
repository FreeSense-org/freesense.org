// Copies assets shared with the current site into this project's public/ before dev and build,
// so the NetSpider screenshots exist once in the repository.
import { cp, rm } from 'node:fs/promises';

const from = new URL('../../public/apps/', import.meta.url);
const to = new URL('../public/apps/', import.meta.url);

await rm(to, { recursive: true, force: true });
await cp(from, to, { recursive: true });
console.log('synced public/apps from the current site');
