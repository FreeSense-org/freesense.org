import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const downloadPage = new URL('../src/pages/download.astro', import.meta.url);

test('artifact groups do not inherit page-section spacing', async () => {
  const source = await readFile(downloadPage, 'utf8');

  assert.doesNotMatch(source, /<section class="artifact-group"/);
  assert.match(source, /<div class="artifact-group"/);
  assert.match(
    source,
    /:global\(\.artifact-group\)\s*\{[^}]*padding:\s*0;/,
  );
  assert.match(source, /\.channels\s*\{[^}]*align-items:\s*start;/);
});
