import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

import { REPOS, mergeActivity, normalizeCommits, onRequest } from '../lib/github-activity.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

const commit = (sha, message, date) => ({ sha: sha.repeat(40), commit: { message, committer: { date } } });

test('keeps only the subject line and drops merge commits and bad shas', () => {
  const items = normalizeCommits('freesense', [
    commit('a', 'Add VXLAN interfaces (#86)\n\nlong body', '2026-10-04T10:33:34Z'),
    commit('b', "Merge branch 'main' into x", '2026-10-04T10:00:00Z'),
    { sha: 'nope', commit: { message: 'x', committer: { date: '2026-10-04T10:00:00Z' } } },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].message, 'Add VXLAN interfaces (#86)');
  assert.equal(items[0].url, `https://github.com/FreeSense-org/freesense/commit/${'a'.repeat(40)}`);
  assert.equal('author' in items[0], false);
});

test('merges repositories newest first', () => {
  const merged = mergeActivity([
    normalizeCommits('freesense', [commit('a', 'old', '2026-10-01T00:00:00Z')]),
    normalizeCommits('NetSpider', [commit('b', 'new', '2026-10-04T00:00:00Z')]),
  ]);
  assert.deepEqual(merged.map((i) => i.repo), ['NetSpider', 'freesense']);
});

test('serves partial results with a short cache when one repository fails', async () => {
  globalThis.fetch = async (url) => (String(url).includes('/NetSpider/')
    ? new Response('rate limited', { status: 403 })
    : new Response(JSON.stringify([commit('c', 'work', '2026-10-04T00:00:00Z')]), { status: 200 }));
  const response = await onRequest({ request: new Request('https://freesense.org/activity.json'), env: {} });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=120');
  const body = await response.json();
  assert.equal(body.complete, false);
  assert.equal(body.items.length, REPOS.length - 1);
});

test('fails without caching when every repository fails', async () => {
  globalThis.fetch = async () => new Response('', { status: 500 });
  const response = await onRequest({ request: new Request('https://freesense.org/activity.json'), env: {} });
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('the activity route is invoked as a Pages Function', async () => {
  const routes = JSON.parse(await readFile(new URL('../public/_routes.json', import.meta.url), 'utf8'));
  assert.ok(routes.include.includes('/activity.json'));
});
