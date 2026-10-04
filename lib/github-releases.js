// Same-origin, edge-cached view of a FreeSense app's GitHub releases.
// Pages read it to show the live version, changelog and downloads without a rebuild.
const REPOS = new Set(['FreeSense-org/NetSpider']);
const CACHE_SECONDS = 600;
const MAX_RELEASES = 10;
const MAX_NOTES = 20000;
const TAG = /^v?[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/;
const ASSET_NAME = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,159}$/;

// The release workflow appends a generic downloads table; the website has its own picker.
function stripDownloadsSection(body) {
  return body.replace(/\r\n/g, '\n').replace(/^##\s+Downloads\s*\n[\s\S]*?(?=^##\s|(?![\s\S]))/m, '').trim();
}

function normalizeRelease(release, repo) {
  if (release === null || typeof release !== 'object' || release.draft) return null;
  if (typeof release.tag_name !== 'string' || !TAG.test(release.tag_name)) return null;
  const downloadPrefix = `https://github.com/${repo}/releases/download/${release.tag_name}/`;
  const assets = (Array.isArray(release.assets) ? release.assets : [])
    .filter((asset) => asset !== null && typeof asset === 'object'
      && typeof asset.name === 'string' && ASSET_NAME.test(asset.name)
      && asset.browser_download_url === `${downloadPrefix}${asset.name}`
      && Number.isInteger(asset.size) && asset.size > 0)
    .map((asset) => ({ name: asset.name, size: asset.size, url: asset.browser_download_url }));
  const body = typeof release.body === 'string' ? release.body.slice(0, MAX_NOTES) : '';
  return {
    tag: release.tag_name,
    version: release.tag_name.replace(/^v/, ''),
    name: typeof release.name === 'string' && release.name ? release.name.slice(0, 160) : release.tag_name,
    prerelease: release.prerelease === true,
    published_at: typeof release.published_at === 'string' ? release.published_at : null,
    url: `https://github.com/${repo}/releases/tag/${release.tag_name}`,
    notes: stripDownloadsSection(body),
    assets,
  };
}

function normalizeReleases(payload, repo) {
  if (!Array.isArray(payload)) return null;
  return payload.map((release) => normalizeRelease(release, repo)).filter(Boolean).slice(0, MAX_RELEASES);
}

function jsonResponse(status, value, cacheControl) {
  return new Response(`${JSON.stringify(value)}\n`, {
    status,
    headers: {
      'Cache-Control': cacheControl,
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function createGithubReleasesHandler(repo) {
  if (!REPOS.has(repo)) throw new TypeError('unsupported repository');
  return async function onRequest(context) {
    const { request } = context;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const cache = globalThis.caches?.default;
    const cacheKey = new Request(new URL(request.url).origin + new URL(request.url).pathname);
    if (cache) {
      const hit = await cache.match(cacheKey);
      if (hit) return request.method === 'HEAD' ? new Response(null, hit) : hit;
    }

    try {
      const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'FreeSense-website/1',
        'X-GitHub-Api-Version': '2022-11-28',
      };
      const token = context.env?.GITHUB_TOKEN;
      if (token) headers.Authorization = `Bearer ${token}`;
      const upstream = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=${MAX_RELEASES}`, { headers });
      if (!upstream.ok) return jsonResponse(502, { error: 'release list is unavailable' }, 'no-store');
      const releases = normalizeReleases(await upstream.json(), repo);
      if (!releases) return jsonResponse(502, { error: 'release list is invalid' }, 'no-store');

      const response = jsonResponse(200, {
        repo,
        latest: releases.find((release) => !release.prerelease)?.tag ?? null,
        releases,
      }, `public, max-age=${CACHE_SECONDS}, stale-if-error=86400`);
      if (cache) context.waitUntil?.(cache.put(cacheKey, response.clone()));
      return request.method === 'HEAD' ? new Response(null, response) : response;
    } catch {
      return jsonResponse(502, { error: 'release list is unavailable' }, 'no-store');
    }
  };
}

export { createGithubReleasesHandler, normalizeReleases, stripDownloadsSection };
