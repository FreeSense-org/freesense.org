import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const downloadPage = new URL('../src/pages/download.astro', import.meta.url);

test('guided picker replaces parallel artifact cards', async () => {
  const source = await readFile(downloadPage, 'utf8');

  assert.match(source, /id="download-picker"/);
  assert.match(source, /id="release-select"/);
  assert.match(source, /id="image-select"/);
  assert.match(source, /id="format-select"/);
  assert.match(source, /imageSelect\.addEventListener\('change', \(\) => refreshFormats/);
  assert.match(source, /const matchingChannel = available\.find/);
  assert.match(source, /artifactType\(artifact\) === requestedType/);
  assert.match(source, /Cloud deployment guidance/);
  assert.match(source, /id="architecture-select"/);
  assert.match(source, /ARM64 experimental/);
  assert.doesNotMatch(source, /class="channels"/);
  assert.doesNotMatch(source, /class="artifact-group"/);
  assert.doesNotMatch(source, /function channelCard/);
});

test('homepage advertises cloud images and both supported filesystems', async () => {
  const source = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

  assert.match(source, /ZFS recommended · UFS supported/);
  assert.match(source, /Official cloud images/);
  assert.match(source, /image=ufs&amp;format=qcow2/);
  assert.match(source, /NoCloud, ConfigDrive, and OpenStack/);
});

test('Stable notice follows the release line and never offers Raspberry Pi images', async () => {
  const source = await readFile(downloadPage, 'utf8');

  assert.doesNotMatch(source, /1\.0\.x line/);
  assert.match(source, /function releaseLine\(version\)/);
  assert.match(source, /noticeBlock\(key, release\)/);
  assert.match(source, /release\.channel === 'stable' && artifact\.kind === 'appliance'/);
  assert.match(source, /\/1\.2\/getting-started\/raspberry-pi\//);
});

test('an empty Stable change list links to the release notes, not a maintenance rebuild', async () => {
  const source = await readFile(new URL('../src/scripts/live.ts', import.meta.url), 'utf8');

  assert.match(source, /function emptyChanges\(channel/);
  assert.match(source, /\$\{DOCS\}\/releases\/stable\//);
  assert.match(source, /: emptyChanges\(channel\)\)/);
});
