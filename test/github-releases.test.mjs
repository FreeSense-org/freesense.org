import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

import { createGithubReleasesHandler, normalizeReleases, stripDownloadsSection } from '../lib/github-releases.js';

const REPO = 'FreeSense-org/NetSpider';
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const asset = (tag, name) => ({
  name,
  size: 1024,
  browser_download_url: `https://github.com/${REPO}/releases/download/${tag}/${name}`,
});

const upstream = [
  {
    tag_name: 'v0.2.0-pre.1', name: 'NetSpider 0.2.0-pre.1', prerelease: true, draft: false,
    published_at: '2026-10-10T10:00:00Z', body: 'Early build', assets: [asset('v0.2.0-pre.1', 'a.zip')],
  },
  { tag_name: 'v0.1.1', name: 'Draft', draft: true, assets: [] },
  {
    tag_name: 'v0.1.0', name: 'FreeSense NetSpider 0.1.0', prerelease: false, draft: false,
    published_at: '2026-10-04T19:09:15Z',
    body: '## FreeSense NetSpider 0.1.0\r\n\r\n- First release (8159ab1)\r\n\r\n## Downloads\r\n\r\n| File | What |\r\n|---|---|\r\n\r\n## Thanks\r\nEveryone',
    assets: [
      asset('v0.1.0', 'FreeSense-NetSpider-0.1.0-win-x64-Setup.exe'),
      { name: 'evil.exe', size: 5, browser_download_url: 'https://example.com/evil.exe' },
    ],
  },
];

test('normalizes releases, skips drafts and foreign asset URLs', () => {
  const releases = normalizeReleases(upstream, REPO);
  assert.deepEqual(releases.map((r) => r.tag), ['v0.2.0-pre.1', 'v0.1.0']);
  const stable = releases[1];
  assert.equal(stable.version, '0.1.0');
  assert.equal(stable.url, `https://github.com/${REPO}/releases/tag/v0.1.0`);
  assert.deepEqual(stable.assets.map((a) => a.name), ['FreeSense-NetSpider-0.1.0-win-x64-Setup.exe']);
  assert.doesNotMatch(stable.notes, /Downloads|\| File/);
  assert.match(stable.notes, /First release/);
  assert.match(stable.notes, /## Thanks\nEveryone/);
});

test('strips a trailing downloads section', () => {
  assert.equal(stripDownloadsSection('- a\n\n## Downloads\n\n| x |'), '- a');
});

test('serves the latest non-prerelease with edge caching', async () => {
  let requested;
  globalThis.fetch = async (url) => {
    requested = url;
    return new Response(JSON.stringify(upstream), { status: 200 });
  };
  const handler = createGithubReleasesHandler(REPO);
  const response = await handler({ request: new Request('https://freesense.org/apps/netspider/releases.json'), env: {} });
  assert.equal(response.status, 200);
  assert.match(requested, /^https:\/\/api\.github\.com\/repos\/FreeSense-org\/NetSpider\/releases\?/);
  assert.match(response.headers.get('Cache-Control'), /max-age=600/);
  const feed = await response.json();
  assert.equal(feed.latest, 'v0.1.0');
  assert.equal(feed.releases.length, 2);
});

test('reports upstream failure without caching it', async () => {
  globalThis.fetch = async () => new Response('rate limited', { status: 403 });
  const handler = createGithubReleasesHandler(REPO);
  const response = await handler({ request: new Request('https://freesense.org/apps/netspider/releases.json'), env: {} });
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('rejects unknown repositories and non-GET methods', async () => {
  assert.throws(() => createGithubReleasesHandler('someone/else'));
  const handler = createGithubReleasesHandler(REPO);
  const response = await handler({ request: new Request('https://freesense.org/apps/netspider/releases.json', { method: 'POST' }) });
  assert.equal(response.status, 405);
});

test('the release route is invoked as a Pages Function', async () => {
  const routes = JSON.parse(await readFile(new URL('../public/_routes.json', import.meta.url), 'utf8'));
  assert.ok(routes.include.includes('/apps/netspider/releases.json'));
});
