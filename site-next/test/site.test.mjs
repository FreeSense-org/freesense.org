import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

async function sources(dir) {
  const out = [];
  for (const entry of await readdir(new URL(`../${dir}/`, import.meta.url), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...await sources(path));
    else if (/\.(astro|js|ts|css|scss)$/.test(entry.name)) out.push(path);
  }
  return out;
}

test('the header has a Products menu with FreeSense and NetSpider, also in the mobile menu', async () => {
  const nav = await read('src/components/Nav.astro');
  const products = await read('src/components/ProductItems.astro');
  assert.match(nav, /data-bs-toggle="dropdown"[\s\S]*Products/);
  assert.equal(nav.match(/<ProductItems \/>/g).length, 2);
  assert.match(products, /href="\/freesense\/"/);
  assert.match(products, /href="\/netspider\/"/);
});

test('scripts, styles and fonts are self-hosted: no CDN or Google Fonts', async () => {
  for (const path of await sources('src')) {
    const text = await read(path);
    assert.doesNotMatch(text, /cdn\.jsdelivr|code\.jquery\.com|unpkg\.com|fonts\.googleapis|fonts\.gstatic/, path);
  }
});

test('the site is indexable', async () => {
  assert.match(await read('public/robots.txt'), /Allow: \//);
  assert.match(await read('public/robots.txt'), /Sitemap: https:\/\/freesense\.org\/sitemap-index\.xml/);
  assert.doesNotMatch(await read('public/robots.txt'), /Disallow: \//);
  assert.doesNotMatch(await read('public/_headers'), /noindex/);
  assert.doesNotMatch(await read('src/layouts/Base.astro'), /noindex/);
});

test('the product page advertises cloud images and both supported filesystems', async () => {
  const page = await read('src/pages/freesense.astro');
  assert.match(page, /ZFS recommended · UFS supported/);
  assert.match(page, /Official cloud images/);
  assert.match(page, /image=ufs&amp;format=qcow2/);
  assert.match(page, /NoCloud, ConfigDrive, and OpenStack/);
});

test('the download page is a guided picker driven by the release documents', async () => {
  const page = await read('src/pages/download.astro');
  const script = await read('src/scripts/download.js');
  assert.match(page, /id="download-picker"/);
  for (const id of ['architecture-select', 'release-select', 'image-select', 'format-select']) assert.match(script, new RegExp(`id="${id}"`));
  assert.match(script, /availableChannels\(channels\)/);
  assert.match(script, /artifactType\(artifact\) === requestedType/);
  assert.match(script, /\/releases\/\$\{key\}\.json\?architecture=/);
});

test('page scripts use no jQuery APIs removed in jQuery 4', async () => {
  for (const path of (await sources('src/scripts'))) {
    const text = await read(path);
    assert.doesNotMatch(text, /\$\.(trim|isArray|isFunction|isNumeric|type|parseJSON|now|proxy|camelCase|isWindow|nodeName|unique)\(/, path);
  }
});

test('Pages Functions reuse the handlers of the current site', async () => {
  const fns = ['functions/releases/stable.json.js', 'functions/releases/devel.json.js', 'functions/activity.json.js', 'functions/apps/netspider/releases.json.js'];
  for (const fn of fns) {
    const mod = await import(new URL(`../${fn}`, import.meta.url));
    assert.equal(typeof mod.onRequest, 'function', fn);
    assert.match(await read(fn), /\.\.\/lib\//, fn);
  }
  const routes = JSON.parse(await read('public/_routes.json'));
  assert.deepEqual(routes.include.sort(), ['/activity.json', '/apps/netspider/releases.json', '/releases/devel.json', '/releases/stable.json']);
});

test('the compare page exists, is in the nav and footer, and every product cites a source', async () => {
  const page = await read('src/pages/compare.astro');
  // Only the products block needs a source each; the central-management table has its own list of sources.
  const data = (await read('src/data/compare.ts')).split('export const centralCols')[0];
  assert.match(page, /id="sources"/);
  assert.match(page, /trademarks of/);
  assert.match(page, /planned for early 2027/);
  assert.match(await read('src/components/ProductItems.astro'), /href="\/compare\/"/);
  assert.equal((await read('src/components/Nav.astro')).match(/href="\/compare\/"/g).length, 2);
  assert.match(page, /id="central"/);
  assert.match(await read('src/data/compare.ts'), /centralSources/);
  assert.match(await read('src/components/Footer.astro'), /href="\/compare\/"/);
  const ids = [...data.matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
  assert.ok(ids.length >= 10);
  for (const id of ids) {
    const block = data.slice(data.indexOf(`id: '${id}'`)).split(/\n  \},/)[0];
    assert.match(block, /source: \[\s*\{ label: '[^']+', href: 'https:\/\//, id);
  }
});

test('the packages page lists the 34 catalog packages and ships its Threat Shield images', async () => {
  const data = await read('src/data/packages.ts');
  const names = [...data.matchAll(/\{ name: '([^']+)', doc: '([^']+)'/g)];
  assert.equal(names.length, 34);
  assert.equal(new Set(names.map((m) => m[1])).size, 34, 'package names are unique');
  for (const [, src] of [...data.matchAll(/src: '(\/packages\/[^']+)'/g)]) {
    await read(`public${src}`).catch(() => assert.fail(`${src} is missing`));
  }
  assert.match(await read('src/components/Nav.astro'), /href="\/packages\/"/);
  assert.match(await read('src/components/ThemeSwitch.astro'), /dropdown theme-menu/);
});

test('the compare page says FreeSense imports both pfSense and OPNsense configurations', async () => {
  const page = await read('src/pages/compare.astro');
  assert.doesNotMatch(page, /no official migration/i);
  assert.match(page, /FreeSense imports both/);
  assert.match(page, /OPNsense configuration is converted/);
  assert.match(page, /docs\.freesense\.org\/guides\/migrating\//);
});
