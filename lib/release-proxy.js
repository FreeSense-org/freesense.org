const SCHEMA = 'freesense.download/v3';
const V2_SCHEMA = 'freesense.download/v2';
const LEGACY_SCHEMA = 'freesense.download/v1';
const CHANNELS = new Set(['stable', 'devel']);
const SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const ISO = /^FreeSense-[A-Za-z0-9.-]+-amd64\.iso$/;
const CHANGE_TYPES = new Set([
  'security', 'fix', 'feature', 'ui', 'package', 'documentation', 'build', 'other',
]);
const RELEASE_NOTES_SCHEMA = 'freesense.release-notes/v2';
const PACKAGE_NAME = /^[A-Za-z0-9][A-Za-z0-9+_,.@~-]{0,127}$/;

function validChanges(changes) {
  if (changes === undefined) return true;
  return Array.isArray(changes)
    && changes.length <= 50
    && changes.every((change) => change !== null
      && typeof change === 'object'
      && CHANGE_TYPES.has(change.type)
      && typeof change.title === 'string'
      && change.title.length > 0
      && change.title.length <= 180
      && (change.scope === undefined
        || (typeof change.scope === 'string' && change.scope.length <= 80)));
}

function validPackageEntry(entry, kind) {
  if (entry === null || typeof entry !== 'object' || !PACKAGE_NAME.test(entry.name)
      || typeof entry.origin !== 'string' || entry.origin.length > 180) return false;
  if (kind === 'updated') {
    return typeof entry.from === 'string' && entry.from.length > 0 && entry.from.length <= 120
      && typeof entry.to === 'string' && entry.to.length > 0 && entry.to.length <= 120;
  }
  return typeof entry.version === 'string'
    && entry.version.length > 0 && entry.version.length <= 120;
}

function validReleaseNotes(notes) {
  if (notes === undefined) return true;
  if (notes === null || typeof notes !== 'object'
      || notes.schema_version !== RELEASE_NOTES_SCHEMA
      || !(notes.baseline_release_id === null
        || (typeof notes.baseline_release_id === 'string'
          && notes.baseline_release_id.length > 0
          && notes.baseline_release_id.length <= 80))
      || !Array.isArray(notes.freesense)
      || !validChanges(notes.freesense)
      || notes.platform === null || typeof notes.platform !== 'object') return false;
  const freebsd = notes.platform.freebsd;
  const packages = notes.platform.packages;
  if (freebsd === null || typeof freebsd !== 'object'
      || typeof freebsd.changed !== 'boolean'
      || typeof freebsd.ports_changed !== 'boolean'
      || !SHA.test(freebsd.to_commit)
      || !SHA.test(freebsd.to_ports_commit)
      || !(freebsd.from_commit === null || SHA.test(freebsd.from_commit))
      || !(freebsd.from_ports_commit === null || SHA.test(freebsd.from_ports_commit))) return false;
  if (freebsd.changed !== (freebsd.from_commit !== null
      && freebsd.from_commit !== freebsd.to_commit)
      || freebsd.ports_changed !== (freebsd.from_ports_commit !== null
        && freebsd.from_ports_commit !== freebsd.to_ports_commit)) return false;
  if (packages === null || typeof packages !== 'object'
      || typeof packages.available !== 'boolean'
      || typeof packages.truncated !== 'boolean'
      || packages.counts === null || typeof packages.counts !== 'object') return false;
  let visible = 0;
  let total = 0;
  for (const kind of ['updated', 'added', 'removed']) {
    if (!Array.isArray(packages[kind])
        || !Number.isInteger(packages.counts[kind])
        || packages.counts[kind] > 100000
        || packages.counts[kind] < packages[kind].length
        || !packages[kind].every((entry) => validPackageEntry(entry, kind))) return false;
    visible += packages[kind].length;
    total += packages.counts[kind];
  }
  return visible <= 200 && packages.truncated === (total > visible);
}

function validRelease(value, channel) {
  if (value?.schema_version === LEGACY_SCHEMA) return validLegacyRelease(value, channel);
  if (value === null
      || typeof value !== 'object'
      || ![V2_SCHEMA, SCHEMA].includes(value.schema_version)
      || value.channel !== channel
      || !VERSION.test(value.version)
      || !SHA256.test(value.bundle_fingerprint)
      || !SHA256.test(value.system)
      || !Number.isInteger(value.generation)
      || value.generation <= 0
      || !Array.isArray(value.artifacts)
      || ![3, 5].includes(value.artifacts.length)
      || typeof value.published_at !== 'string'
      || !validChanges(value.changes)
      || !validReleaseNotes(value.release_notes)) return false;

  const releaseId = channel === 'stable'
    ? value.version
    : `${value.version}-g${value.generation}`;
  const download = `https://downloads.freesense.org/v1/releases/${channel}/${releaseId}`;
  if (value.release_id !== releaseId) return false;
  const architecture = value.schema_version === SCHEMA ? value.architecture : 'amd64';
  const packageArch = value.schema_version === SCHEMA ? value.package_arch : 'amd64';
  if (!((architecture === 'amd64' && packageArch === 'amd64')
      || (architecture === 'arm64' && packageArch === 'aarch64'))) return false;
  if (value.schema_version === SCHEMA
      && (typeof value.platform !== 'string'
        || !Array.isArray(value.firmware)
        || value.capabilities === null || typeof value.capabilities !== 'object')) return false;
  const installerFormat = architecture === 'arm64' ? 'img' : 'iso';
  const expected = new Set([
    `installer:none:${installerFormat}`, 'cloud:ufs:qcow2', 'cloud:ufs:raw',
  ]);
  if (value.artifacts.length === 5) {
    expected.add('cloud:zfs:qcow2');
    expected.add('cloud:zfs:raw');
  }
  for (const artifact of value.artifacts) {
    if (artifact === null || typeof artifact !== 'object') return false;
    const filesystem = artifact.filesystem ?? 'none';
    if (!expected.delete(`${artifact.kind}:${filesystem}:${artifact.format}`)
        || !SHA256.test(artifact.sha256)
        || !SHA256.test(artifact.build_fingerprint)
        || !Number.isInteger(artifact.size) || artifact.size <= 0
        || typeof artifact.file !== 'string'
        || artifact.url !== `${download}/${artifact.file}`
        || typeof artifact.marker_url !== 'string') return false;
    if (artifact.kind === 'cloud') {
      const virtualSizes = { ufs: 16 * 1024 ** 3, zfs: 32 * 1024 ** 3 };
      if (artifact.compression !== 'xz'
          || artifact.virtual_size !== virtualSizes[artifact.filesystem]) return false;
    }
  }
  if (expected.size !== 0) return false;

  const provenance = value.provenance;
  if (provenance === null
      || typeof provenance !== 'object'
      || !['source', 'ports', 'os_definition', 'freebsd'].every(
        (name) => SHA.test(provenance[name]),
      )) return false;

  return channel === 'stable'
    ? value.support_tier === 'supported'
    : value.support_tier === 'development';
}

function validLegacyRelease(value, channel) {
  if (value.channel !== channel || !VERSION.test(value.version)
      || !SHA256.test(value.fingerprint) || !SHA256.test(value.system)
      || !Number.isInteger(value.generation) || value.generation <= 0
      || !ISO.test(value.iso) || !SHA256.test(value.sha256)
      || !Number.isInteger(value.size) || value.size <= 0
      || !validChanges(value.changes)) return false;
  const releaseId = channel === 'stable' ? value.version : `${value.version}-g${value.generation}`;
  const artifact = `https://pkg.freesense.org/v1/artifacts/iso/${value.fingerprint}`;
  const download = `https://downloads.freesense.org/v1/releases/${channel}/${releaseId}`;
  return value.release_id === releaseId
    && value.marker_url === `${artifact}/complete.json`
    && value.url === `${download}/${value.iso}`;
}

function errorResponse(status, source, message) {
  return new Response(`${JSON.stringify({ error: message })}\n`, {
    status,
    headers: {
      'Cache-Control': status === 404 ? 'public, max-age=60, must-revalidate' : 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-FreeSense-Release-Source': source,
    },
  });
}

function createReleaseHandler(channel) {
  if (!CHANNELS.has(channel)) throw new TypeError('unsupported release channel');
  return async function onRequest(context) {
    if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    try {
      const requested = new URL(context.request.url).searchParams.get('architecture') || 'amd64';
      if (!['amd64', 'arm64'].includes(requested)) {
        return errorResponse(400, 'invalid', 'unsupported architecture');
      }
      const canonicalUrl = requested === 'amd64'
        ? `https://pkg.freesense.org/v1/releases/${channel}.json`
        : `https://pkg.freesense.org/v1/releases/${channel}.${requested}.json`;
      const upstream = await fetch(canonicalUrl, {
        headers: { Accept: 'application/json', 'User-Agent': 'FreeSense-website/1' },
      });
      if (upstream.status === 404) {
        return errorResponse(404, 'not-published', `${channel} release is not published`);
      }
      if (!upstream.ok) {
        return errorResponse(502, 'unavailable', 'canonical release document is unavailable');
      }

      const body = await upstream.text();
      let release;
      try {
        release = JSON.parse(body);
      } catch {
        return errorResponse(502, 'invalid', 'canonical release document is invalid');
      }
      if (!validRelease(release, channel)) {
        return errorResponse(502, 'invalid', 'canonical release document is invalid');
      }
      const actualArchitecture = release.schema_version === SCHEMA ? release.architecture : 'amd64';
      if (actualArchitecture !== requested) {
        return errorResponse(502, 'invalid', 'canonical release architecture is invalid');
      }

      const headers = new Headers({
        'Cache-Control': 'public, max-age=60, must-revalidate, stale-if-error=300',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'X-FreeSense-Release-Source': 'canonical',
      });
      for (const name of ['ETag', 'Last-Modified']) {
        const value = upstream.headers.get(name);
        if (value) headers.set(name, value);
      }
      return new Response(context.request.method === 'HEAD' ? null : body, { headers });
    } catch {
      return errorResponse(502, 'unavailable', 'canonical release document is unavailable');
    }
  };
}

export {
  LEGACY_SCHEMA, RELEASE_NOTES_SCHEMA, SCHEMA, V2_SCHEMA, createReleaseHandler, validRelease,
};
