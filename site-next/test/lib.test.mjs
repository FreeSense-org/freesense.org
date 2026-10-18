import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  escapeHtml, channelView, emptyChanges, freebsdPin, provenanceHtml, artifactsForRelease, artifactType,
  availableChannels, noticeBlock, releaseLine, changesBlock, guideFor, renderNotes, imagesOf, netspiderAsset, NETSPIDER_PACKAGES,
} from '../src/scripts/lib.js';

const sha = (c) => c.repeat(40);

test('escapeHtml escapes markup characters', () => {
  assert.equal(escapeHtml('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  assert.equal(escapeHtml(null), '');
});

test('an empty Stable change list links to the release notes, not a maintenance rebuild', () => {
  const html = emptyChanges('stable', '1.1.9');
  assert.match(html, /https:\/\/docs\.freesense\.org\/releases\/stable\//);
  assert.match(html, /REST API/);
  assert.doesNotMatch(html, /Maintenance rebuild/);
  assert.match(emptyChanges('stable', '9.9.0'), /described in the <a href="https:\/\/docs\.freesense\.org\/releases\/stable\/">/);
  assert.match(emptyChanges('devel', '1.2.0'), /Maintenance rebuild/);
});

test('a Stable release without a baseline shows no zero-change statistics', () => {
  const release = {
    version: '1.1.0', published_at: '2026-10-13T00:00:00Z', artifacts: [],
    release_notes: { freesense: [], platform: { freebsd: { changed: false, ports_changed: false }, packages: { counts: { updated: 0, added: 0, removed: 0 }, updated: [] } } },
  };
  assert.equal(channelView(release, 'stable').statsHtml, '');
  const withCounts = { ...release, release_notes: { ...release.release_notes, platform: { ...release.release_notes.platform, packages: { counts: { updated: 3, added: 1, removed: 0 }, updated: [] } } } };
  assert.match(channelView(withCounts, 'stable').statsHtml, /<b>3<\/b><span>packages updated/);
});

test('channel cards drop merge commits, cap the list and top it up with package updates', () => {
  const changes = [{ type: 'fix', title: 'Merge pull request #1 from x' }, { type: 'feature', title: 'Add thing (#42)' }];
  const view = channelView({
    version: '1.2.0', artifacts: [],
    release_notes: { freesense: changes, platform: { packages: { counts: { updated: 1, added: 0, removed: 0 }, updated: [{ name: 'curl', from: '8.1', to: '8.2' }] } } },
  }, 'devel');
  assert.equal(view.label, '1.2.0 dev');
  assert.doesNotMatch(view.changesHtml, /Merge pull request/);
  assert.match(view.changesHtml, /\/freesense\/pull\/42/);
  assert.match(view.changesHtml, /curl <code>8\.1<\/code>/);
});

test('the FreeBSD pin comes from the release notes, then provenance, and must be a commit', () => {
  assert.equal(freebsdPin({ release_notes: { platform: { freebsd: { to_commit: sha('a') } } } }), sha('a'));
  assert.equal(freebsdPin({ provenance: { freebsd: sha('b') } }), sha('b'));
  assert.equal(freebsdPin({ provenance: { freebsd: '<script>' } }), null);
});

test('provenance links only full commit hashes', () => {
  const html = provenanceHtml({ source: sha('c'), ports: 'not-a-sha', freebsd: sha('d') });
  assert.match(html, /freesense\/commit\/c{40}/);
  assert.match(html, /freebsd-src\/commit\/d{40}/);
  assert.doesNotMatch(html, /not-a-sha/);
});

test('Stable never offers Raspberry Pi appliance images', () => {
  const artifacts = [
    { kind: 'installer', format: 'img', url: 'https://x/i.img', sha256: '1' },
    { kind: 'appliance', platform: 'arm64-rpi4b', format: 'img', url: 'https://x/p.img', sha256: '2' },
  ];
  const stable = { schema_version: 'freesense.download/v4', channel: 'stable', artifacts };
  const devel = { schema_version: 'freesense.download/v4', channel: 'devel', artifacts };
  assert.equal(artifactsForRelease(stable).length, 1);
  assert.equal(artifactsForRelease(devel).length, 2);
  assert.equal(artifactType(artifacts[1]), 'rpi4');
  assert.deepEqual(imagesOf(devel), ['ARM64 installer', 'Pi 4B']);
});

test('a v1 document becomes a single installer ISO artifact', () => {
  const list = artifactsForRelease({ schema_version: 'freesense.download/v1', url: 'https://x/a.iso', iso: 'a.iso', sha256: 'f' });
  assert.deepEqual(list.map(artifactType), ['installer']);
});

test('the picker only offers a supported Stable document', () => {
  const doc = (channel, extra = {}) => ({ schema_version: 'freesense.download/v4', channel, artifacts: [{ kind: 'installer', format: 'iso', url: 'https://x/a.iso' }], ...extra });
  assert.deepEqual(availableChannels({ stable: doc('stable'), devel: doc('devel') }), ['devel']);
  assert.deepEqual(availableChannels({ stable: doc('stable', { support_tier: 'supported' }), devel: null }), ['stable']);
});

test('the Stable notice follows the release line', () => {
  assert.equal(releaseLine('1.1.9'), '1.1.x');
  assert.match(noticeBlock('stable', { version: '1.1.9' }), /throughout the 1\.1\.x line/);
  assert.match(noticeBlock('devel', {}), /Experimental/);
  assert.match(changesBlock({ channel: 'stable', changes: [] }), /Stable release notes/);
});

test('guides point to the right documentation', () => {
  assert.equal(guideFor('rpi5').path, '/1.2/getting-started/raspberry-pi/');
  assert.equal(guideFor('ufs').label, 'Cloud deployment guidance');
});

test('release notes Markdown is escaped before markup is added', () => {
  const html = renderNotes('# Title\n- **bold** <b>x</b> (abc1234)\nText [link](https://e.org)', 'FreeSense-org/NetSpider', 'Title');
  assert.doesNotMatch(html, /<b>x<\/b>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /NetSpider\/commit\/abc1234/);
  assert.match(html, /<a href="https:\/\/e\.org"/);
});

test('NetSpider assets match version, architecture and package', () => {
  const release = { version: '0.2.0', assets: [
    { name: 'NetSpider-0.2.0-win-x64-Setup.exe' }, { name: 'NetSpider-0.2.0-win-x64-PreRelease-Setup.exe' }, { name: 'NetSpider-0.2.0-win-arm64-Setup.exe' },
  ] };
  assert.equal(netspiderAsset(release, 'win-x64', NETSPIDER_PACKAGES[0]).name, 'NetSpider-0.2.0-win-x64-Setup.exe');
  assert.equal(netspiderAsset(release, 'win-x64', NETSPIDER_PACKAGES[4]).name, 'NetSpider-0.2.0-win-x64-PreRelease-Setup.exe');
  assert.equal(netspiderAsset(release, 'win-x86', NETSPIDER_PACKAGES[0]), null);
});
