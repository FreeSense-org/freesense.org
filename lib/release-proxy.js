const SCHEMA = 'freesense.download/v1';
const CHANNELS = new Set(['stable', 'devel']);
const SHA = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const ISO = /^FreeSense-[A-Za-z0-9.-]+-amd64\.iso$/;

function validRelease(value, channel) {
  if (value === null
      || typeof value !== 'object'
      || value.schema_version !== SCHEMA
      || value.channel !== channel
      || !VERSION.test(value.version)
      || !SHA256.test(value.fingerprint)
      || !SHA256.test(value.system)
      || !Number.isInteger(value.generation)
      || value.generation <= 0
      || !ISO.test(value.iso)
      || !SHA256.test(value.sha256)
      || !Number.isInteger(value.size)
      || value.size <= 0
      || typeof value.published_at !== 'string') return false;

  const artifact = `https://pkg.freesense.org/v1/artifacts/iso/${value.fingerprint}`;
  const releaseId = channel === 'stable'
    ? value.version
    : `${value.version}-g${value.generation}`;
  const download = `https://downloads.freesense.org/v1/releases/${channel}/${releaseId}`;
  if (value.release_id !== releaseId
      || value.marker_url !== `${artifact}/complete.json`
      || value.url !== `${download}/${value.iso}`) return false;

  const provenance = value.provenance;
  if (provenance === null
      || typeof provenance !== 'object'
      || !['source', 'ports', 'os_definition', 'freebsd'].every(
        (name) => SHA.test(provenance[name]),
      )) return false;

  return channel === 'stable'
    ? value.version.startsWith('1.0.') && value.support_tier === 'supported'
    : value.version.startsWith('1.1.') && value.support_tier === 'development';
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
  const canonicalUrl = `https://pkg.freesense.org/v1/releases/${channel}.json`;

  return async function onRequest(context) {
    if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    try {
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

export { SCHEMA, createReleaseHandler, validRelease };
