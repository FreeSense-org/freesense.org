import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const verifier = new URL('../scripts/verify-release-feeds.sh', import.meta.url);

test('release feed verifier recognizes UFS and ZFS bundle artifacts', async () => {
  const source = await readFile(verifier, 'utf8');

  assert.doesNotMatch(source, /\[\.artifacts\[\]\.format\]/);
  assert.match(source, /freesense\.download\/v3/);
  for (const tuple of [
    '["cloud", "ufs", "qcow2"]',
    '["cloud", "ufs", "raw"]',
    '["cloud", "zfs", "qcow2"]',
    '["cloud", "zfs", "raw"]',
    '["installer", null, "iso"]',
  ]) {
    assert.ok(source.includes(tuple), `missing artifact tuple ${tuple}`);
  }
});
