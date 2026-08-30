import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { createReleaseHandler } from '../lib/release-proxy.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const release = {
  schema_version: 'freesense.download/v1',
  channel: 'stable',
  version: '1.0.0',
  release_id: '1.0.0',
  support_tier: 'supported',
  generation: 2,
  fingerprint: 'b'.repeat(64),
  system: 'c'.repeat(64),
  iso: 'FreeSense-1.0.0-amd64.iso',
  marker_url: `https://pkg.freesense.org/v1/artifacts/iso/${'b'.repeat(64)}/complete.json`,
  url: 'https://downloads.freesense.org/v1/releases/stable/1.0.0/FreeSense-1.0.0-amd64.iso',
  size: 1024,
  sha256: 'a'.repeat(64),
  published_at: '2026-07-22T22:09:10Z',
  changes: [
    { type: 'fix', title: 'Recover configurations from legacy ZFS layouts', scope: 'Installer' },
  ],
  provenance: {
    source: 'd'.repeat(40),
    ports: 'e'.repeat(40),
    os_definition: 'f'.repeat(40),
    freebsd: '0'.repeat(40),
  },
};

const bundleRelease = {
  schema_version: 'freesense.download/v2',
  channel: 'stable',
  version: '1.0.5',
  release_id: '1.0.5',
  support_tier: 'supported',
  generation: 5,
  bundle_fingerprint: '1'.repeat(64),
  system: '2'.repeat(64),
  published_at: '2026-07-26T12:00:00Z',
  release_notes: {
    schema_version: 'freesense.release-notes/v2',
    baseline_release_id: '1.0.4',
    freesense: [
      { type: 'fix', title: 'Restore package menus after firmware updates', scope: 'FreeSense' },
    ],
    platform: {
      freebsd: {
        changed: true,
        ports_changed: true,
        from_commit: '1'.repeat(40),
        to_commit: '2'.repeat(40),
        from_ports_commit: '3'.repeat(40),
        to_ports_commit: '4'.repeat(40),
      },
      packages: {
        available: true,
        updated: [{ name: 'openssl', from: '3.5.1', to: '3.5.2', origin: 'security/openssl' }],
        added: [],
        removed: [],
        counts: { updated: 1, added: 0, removed: 0 },
        truncated: false,
      },
    },
  },
  provenance: release.provenance,
  artifacts: [
    ['installer', 'iso', 'none', null, 'FreeSense-1.0.5-amd64.iso', '3', 1024],
    ['cloud', 'qcow2', 'xz', 'ufs', 'FreeSense-1.0.5-amd64-ufs.qcow2.xz', '4', 2048],
    ['cloud', 'raw', 'xz', 'ufs', 'FreeSense-1.0.5-amd64-ufs.raw.xz', '5', 3072],
    ['cloud', 'qcow2', 'xz', 'zfs', 'FreeSense-1.0.5-amd64-zfs.qcow2.xz', '8', 4096],
    ['cloud', 'raw', 'xz', 'zfs', 'FreeSense-1.0.5-amd64-zfs.raw.xz', '9', 5120],
  ].map(([kind, format, compression, filesystem, file, sha, size]) => ({
    kind, format, compression, filesystem, file, size,
    sha256: sha.repeat(64),
    build_fingerprint: (format === 'iso' ? '6' : '7').repeat(64),
    marker_url: `https://pkg.freesense.org/v1/artifacts/${format === 'iso' ? 'iso' : 'cloud'}/${(format === 'iso' ? '6' : '7').repeat(64)}/complete.json`,
    url: `https://downloads.freesense.org/v1/releases/stable/1.0.5/${file}`,
    ...(kind === 'cloud' ? { virtual_size: (filesystem === 'ufs' ? 16 : 32) * 1024 ** 3 } : {}),
  })),
};

function context(method = 'GET') {
  return { request: new Request('https://freesense.org/releases/stable.json', { method }) };
}

test('serves the exact canonical channel document', async () => {
  const body = `${JSON.stringify(release)}\n`;
  globalThis.fetch = async (url) => {
    assert.equal(url, 'https://pkg.freesense.org/v1/releases/stable.json');
    return new Response(body, { headers: { ETag: '"stable-release"' } });
  };
  const response = await createReleaseHandler('stable')(context());
  assert.equal(response.status, 200);
  assert.equal(await response.text(), body);
  assert.equal(response.headers.get('x-freesense-release-source'), 'canonical');
  assert.equal(response.headers.get('etag'), '"stable-release"');
});

test('serves an atomic v2 installer and cloud bundle', async () => {
  globalThis.fetch = async () => Response.json(bundleRelease);
  const response = await createReleaseHandler('stable')(context());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).artifacts.length, 5);
});

test('serves the experimental ARM64 installer-only release', async () => {
  const arm64 = {
    ...structuredClone(bundleRelease),
    schema_version: 'freesense.download/v3',
    channel: 'devel',
    version: '1.1.0',
    release_id: '1.1.0-g5',
    support_tier: 'development',
    architecture: 'arm64',
    package_arch: 'aarch64',
    platform: 'generic-arm64-uefi',
    firmware: ['uefi'],
    capabilities: {
      bios: false, uefi: true, iso: false, installer_img: true, cloud_init: false,
    },
  };
  const file = 'FreeSense-1.1.0-g5-arm64-installer.img.xz';
  arm64.artifacts = [{
    kind: 'installer', format: 'img', compression: 'xz', filesystem: null, file,
    size: 1024, sha256: '3'.repeat(64), build_fingerprint: '6'.repeat(64),
    marker_url: `https://pkg.freesense.org/v1/artifacts/iso/${'6'.repeat(64)}/complete.json`,
    url: `https://downloads.freesense.org/v1/releases/devel/1.1.0-g5/${file}`,
  }];
  globalThis.fetch = async (url) => {
    assert.equal(url, 'https://pkg.freesense.org/v1/releases/devel.arm64.json');
    return Response.json(arm64);
  };
  const handler = createReleaseHandler('devel');
  const response = await handler({
    request: new Request('https://freesense.org/releases/devel.json?architecture=arm64'),
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).artifacts.length, 1);
});

test('rejects malformed structured release notes', async () => {
  const malformed = structuredClone(bundleRelease);
  malformed.release_notes.platform.packages.updated[0].name = '<script>';
  globalThis.fetch = async () => Response.json(malformed);
  const response = await createReleaseHandler('stable')(context());
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('x-freesense-release-source'), 'invalid');
});

test('keeps interim UFS-only v2 documents readable', async () => {
  globalThis.fetch = async () => Response.json({
    ...bundleRelease,
    artifacts: bundleRelease.artifacts.slice(0, 3),
  });
  const response = await createReleaseHandler('stable')(context());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).artifacts.length, 3);
});

test('rejects a ZFS artifact with the UFS virtual size', async () => {
  const artifacts = structuredClone(bundleRelease.artifacts);
  artifacts[3].virtual_size = 16 * 1024 ** 3;
  globalThis.fetch = async () => Response.json({ ...bundleRelease, artifacts });
  const response = await createReleaseHandler('stable')(context());
  assert.equal(response.status, 502);
});

test('maps an unpublished channel to a cache-bounded 404', async () => {
  globalThis.fetch = async () => new Response(null, { status: 404 });
  const response = await createReleaseHandler('stable')(context());
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-freesense-release-source'), 'not-published');
  assert.match(response.headers.get('cache-control'), /max-age=60/);
});

test('rejects a document for the wrong channel', async () => {
  globalThis.fetch = async () => Response.json({ ...release, channel: 'devel' });
  const response = await createReleaseHandler('stable')(context());
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('x-freesense-release-source'), 'invalid');
});

test('rejects a non-canonical artifact URL', async () => {
  globalThis.fetch = async () => Response.json({
    ...release,
    url: 'https://example.com/FreeSense-1.0.0-amd64.iso',
  });
  const response = await createReleaseHandler('stable')(context());
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('x-freesense-release-source'), 'invalid');
});

test('rejects malformed release changes', async () => {
  globalThis.fetch = async () => Response.json({
    ...release,
    changes: [{ type: 'surprise', title: '<script>alert(1)</script>' }],
  });
  const response = await createReleaseHandler('stable')(context());
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('x-freesense-release-source'), 'invalid');
});

test('supports HEAD and rejects unsupported methods', async () => {
  globalThis.fetch = async () => Response.json(release);
  const handler = createReleaseHandler('stable');
  const head = await handler(context('HEAD'));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const post = await handler(context('POST'));
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});
