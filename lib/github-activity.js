// Same-origin, edge-cached feed of recent commits across the public FreeSense repositories.
// The homepage shows it as live development activity.
const ORG = 'FreeSense-org';
const REPOS = ['freesense', 'freesense-packages', 'freesense-os-base', 'freesense-system-ports', 'NetSpider'];
const CACHE_SECONDS = 600;
const PER_REPO = 8;
const MAX_ITEMS = 16;
const SHA = /^[0-9a-f]{40}$/;

function normalizeCommits(repo, payload) {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((item) => item && typeof item === 'object' && SHA.test(item.sha)
      && typeof item.commit?.message === 'string'
      && typeof item.commit?.committer?.date === 'string')
    .map((item) => ({
      repo,
      sha: item.sha,
      message: item.commit.message.split('\n')[0].slice(0, 160),
      date: item.commit.committer.date,
      url: `https://github.com/${ORG}/${repo}/commit/${item.sha}`,
    }))
    .filter((item) => !/^Merge (branch|remote-tracking)/.test(item.message));
}

function mergeActivity(lists) {
  return lists.flat()
    .filter((item) => !Number.isNaN(Date.parse(item.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, MAX_ITEMS);
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

async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const url = new URL(request.url);
  const cache = globalThis.caches?.default;
  const cacheKey = new Request(url.origin + url.pathname);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return request.method === 'HEAD' ? new Response(null, hit) : hit;
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'FreeSense-website/1',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = context.env?.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const results = await Promise.allSettled(REPOS.map(async (repo) => {
    const response = await fetch(`https://api.github.com/repos/${ORG}/${repo}/commits?per_page=${PER_REPO}`, { headers });
    if (!response.ok) throw new Error(String(response.status));
    return normalizeCommits(repo, await response.json());
  }));
  const fulfilled = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  if (fulfilled.length === 0) return jsonResponse(502, { error: 'activity is unavailable' }, 'no-store');

  const response = jsonResponse(200, {
    org: ORG,
    complete: fulfilled.length === REPOS.length,
    items: mergeActivity(fulfilled),
  }, fulfilled.length === REPOS.length
    ? `public, max-age=${CACHE_SECONDS}, stale-if-error=86400`
    : 'public, max-age=120');
  if (cache) context.waitUntil?.(cache.put(cacheKey, response.clone()));
  return request.method === 'HEAD' ? new Response(null, response) : response;
}

export { REPOS, mergeActivity, normalizeCommits, onRequest };
