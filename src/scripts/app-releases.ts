// Client helpers for the live app release feeds served by functions/apps/*/releases.json.
export interface AppAsset { name: string; size: number; url: string }
export interface AppRelease {
  tag: string;
  version: string;
  name: string;
  prerelease: boolean;
  published_at: string | null;
  url: string;
  notes: string;
  assets: AppAsset[];
}
export interface AppReleaseFeed { repo: string; latest: string | null; releases: AppRelease[] }

export async function loadReleases(slug: string): Promise<AppReleaseFeed | null> {
  try {
    const response = await fetch(`/apps/${slug}/releases.json`, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const feed = await response.json();
    return Array.isArray(feed?.releases) ? feed : null;
  } catch {
    return null;
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.valueOf())
    ? ''
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function formatSize(bytes: number): string {
  return bytes >= 1024 ** 2 ? `${(bytes / 1024 ** 2).toFixed(0)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function inline(text: string, repo: string): string {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
  // Trailing "(abc1234)" commit references become links to the commit.
  html = html.replace(/\(([0-9a-f]{7,40})\)/g,
    `(<a class="sha" href="https://github.com/${repo}/commit/$1" rel="noopener">$1</a>)`);
  return html;
}

// A deliberately small Markdown subset: everything is escaped before any markup is added.
export function renderNotes(markdown: string, repo: string, title = ''): string {
  const out: string[] = [];
  let list = false;
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(' '), repo)}</p>`);
    paragraph = [];
    if (list) { out.push('</ul>'); list = false; }
  };
  for (const raw of markdown.split('\n')) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const item = line.match(/^\s*[-*]\s+(.*)$/);
    if (heading) {
      flush();
      if (heading[2].trim() === title.trim()) continue;
      out.push(`<h4>${inline(heading[2], repo)}</h4>`);
    } else if (item) {
      if (paragraph.length) { out.push(`<p>${inline(paragraph.join(' '), repo)}</p>`); paragraph = []; }
      if (!list) { out.push('<ul>'); list = true; }
      out.push(`<li>${inline(item[1], repo)}</li>`);
    } else if (!line.trim() || line.startsWith('|')) {
      flush();
    } else {
      if (list) { out.push('</ul>'); list = false; }
      paragraph.push(line.trim());
    }
  }
  flush();
  return out.join('');
}
