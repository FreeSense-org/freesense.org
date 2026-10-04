// Live homepage data: release channels, development activity and app versions.
// Everything renders from same-origin Pages Functions and degrades to the static fallback markup.
import { escapeHtml } from './app-releases';

const REFRESH_MS = 5 * 60 * 1000;
const GH = 'https://github.com/FreeSense-org';
const TYPE_LABELS: Record<string, string> = {
  security: 'Security', fix: 'Fix', feature: 'Feature', ui: 'WebUI', package: 'Packages',
  documentation: 'Docs', build: 'Build', other: 'Change',
};

interface Change { type: string; title: string; scope?: string }
interface PackageUpdate { name: string; from: string; to: string }
interface PackageNotes { counts: { updated: number; added: number; removed: number }; updated: PackageUpdate[] }
interface Release {
  version: string;
  release_id: string;
  published_at: string;
  architecture?: string;
  changes?: Change[];
  release_notes?: {
    freesense: Change[];
    platform: {
      freebsd: { changed: boolean; ports_changed: boolean; to_commit: string; to_ports_commit: string };
      packages: PackageNotes;
    };
  };
  artifacts: { kind: string; format: string; filesystem: string | null; platform?: string }[];
  provenance?: Record<string, string>;
}
interface Activity { repo: string; sha: string; message: string; date: string; url: string }

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-cache' });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = (Date.parse(iso) - now) / 1000;
  if (Number.isNaN(seconds)) return '';
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.valueOf())
    ? ''
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function changesOf(release: Release): Change[] {
  const list = release.release_notes?.freesense ?? release.changes ?? [];
  return list.filter((c) => !/^Merge (pull request|branch)/i.test(c.title));
}

function setText(key: string, value: string) {
  document.querySelectorAll<HTMLElement>(`[data-live="${key}"]`).forEach((el) => { el.textContent = value; });
}

function setAgo(key: string, iso: string) {
  document.querySelectorAll<HTMLElement>(`[data-live="${key}"]`).forEach((el) => {
    el.dataset.time = iso;
    el.textContent = timeAgo(iso);
    if (el instanceof HTMLTimeElement) el.dateTime = iso;
  });
}

function refreshAgo() {
  document.querySelectorAll<HTMLElement>('[data-time]').forEach((el) => { el.textContent = timeAgo(el.dataset.time!); });
}

function changeItem(change: Change): string {
  const type = TYPE_LABELS[change.type] ? change.type : 'other';
  const title = change.title.replace(/\s*\(#(\d+)\)$/, '');
  const pr = change.title.match(/\(#(\d+)\)$/)?.[1];
  return `<li><span class="chg chg-${type}">${TYPE_LABELS[type]}</span><span>${escapeHtml(title)}${
    pr ? ` <a href="${GH}/freesense/pull/${pr}" rel="noopener">#${pr}</a>` : ''}</span></li>`;
}

function imagesOf(release: Release, arm?: Release | null): string[] {
  const out = new Set<string>();
  for (const a of [...release.artifacts, ...(arm?.artifacts ?? [])]) {
    if (a.kind === 'installer') out.add(a.format === 'iso' ? 'amd64 ISO' : 'ARM64 installer');
    if (a.kind === 'cloud') out.add(`${(a.filesystem ?? '').toUpperCase()} ${a.format.toUpperCase()}`.trim());
    if (a.kind === 'appliance') out.add(a.platform === 'arm64-rpi4b' ? 'Pi 4B' : a.platform === 'arm64-rpi5-d0' ? 'Pi 5' : 'Appliance');
  }
  return [...out];
}

function renderChannel(el: HTMLElement, release: Release, channel: 'stable' | 'devel', arm?: Release | null) {
  const changes = changesOf(release);
  const counts = release.release_notes?.platform.packages.counts;
  const platform = release.release_notes?.platform.freebsd;
  const label = channel === 'stable' ? `${release.version}` : `${release.version} dev`;
  el.querySelector('.ch-version')!.textContent = label;
  const when = el.querySelector<HTMLElement>('.ch-when')!;
  when.dataset.time = release.published_at;
  when.textContent = timeAgo(release.published_at);
  when.title = shortDate(release.published_at);
  // Short change lists are topped up with the release's package updates.
  const updates = (release.release_notes?.platform.packages.updated ?? []).slice(0, Math.max(0, 5 - changes.length));
  el.querySelector('.ch-changes')!.innerHTML = (changes.length
    ? changes.slice(0, 6).map(changeItem).join('')
      + (changes.length > 6 ? `<li class="more">+ ${changes.length - 6} more changes</li>` : '')
    : '<li class="empty">Maintenance rebuild with no FreeSense source changes.</li>')
    + updates.map((u) => `<li class="pkg"><span class="chg chg-package">Package</span><span>${escapeHtml(u.name)} <code>${
      escapeHtml(u.from)}</code> → <code>${escapeHtml(u.to)}</code></span></li>`).join('');
  el.querySelector('.ch-stats')!.innerHTML = [
    counts && `<div><b>${counts.updated}</b><span>packages updated</span></div>`,
    counts && `<div><b>${counts.added + counts.removed}</b><span>added / removed</span></div>`,
    platform && `<div><b>${platform.changed ? 'New' : 'Same'}</b><span>FreeBSD base${platform.ports_changed ? ', ports refreshed' : ''}</span></div>`,
  ].filter(Boolean).join('');
  el.querySelector('.ch-images')!.innerHTML = imagesOf(release, arm).map((i) => `<span>${escapeHtml(i)}</span>`).join('');
  el.classList.add('is-live');
}

function renderActivity(items: Activity[]) {
  const list = document.getElementById('live-activity');
  if (!list || !items.length) return;
  list.innerHTML = items.slice(0, 7).map((item) => {
    const pr = item.message.match(/\(#(\d+)\)$/)?.[1];
    const msg = item.message.replace(/\s*\(#\d+\)$/, '');
    return `<li>
      <span class="act-dot"></span>
      <div class="act-body">
        <a class="act-msg" href="${escapeHtml(item.url)}" rel="noopener">${escapeHtml(msg)}</a>
        <div class="act-meta">
          <a class="act-repo" href="${GH}/${escapeHtml(item.repo)}" rel="noopener">${escapeHtml(item.repo)}</a>
          ${pr ? `<a href="${GH}/${escapeHtml(item.repo)}/pull/${pr}" rel="noopener">#${pr}</a>` : ''}
          <code>${item.sha.slice(0, 7)}</code>
          <time data-time="${escapeHtml(item.date)}" datetime="${escapeHtml(item.date)}">${timeAgo(item.date)}</time>
        </div>
      </div>
    </li>`;
  }).join('');
  list.closest('.activity')?.classList.add('is-live');
}

function renderProvenance(release: Release) {
  const p = release.provenance;
  if (!p) return;
  const links: Record<string, [string, string]> = {
    source: ['FreeSense source', `${GH}/freesense/commit/`],
    system_ports: ['System ports', `${GH}/freesense-system-ports/commit/`],
    packages: ['Optional packages', `${GH}/freesense-packages/commit/`],
    os_definition: ['OS definition', `${GH}/freesense-os-base/commit/`],
    ports: ['FreeBSD ports', 'https://github.com/freebsd/freebsd-ports/commit/'],
    freebsd: ['FreeBSD src', 'https://github.com/freebsd/freebsd-src/commit/'],
  };
  const el = document.getElementById('live-provenance');
  if (!el) return;
  el.innerHTML = Object.entries(links).filter(([key]) => /^[0-9a-f]{40}$/.test(p[key] ?? '')).map(([key, [label, base]]) =>
    `<a href="${base}${p[key]}" rel="noopener"><span>${label}</span><code>${p[key].slice(0, 10)}</code></a>`).join('');
  el.classList.add('is-live');
}

async function load() {
  const [stable, devel, develArm, netspider, activity] = await Promise.all([
    getJson<Release>('/releases/stable.json'),
    getJson<Release>('/releases/devel.json'),
    getJson<Release>('/releases/devel.json?architecture=arm64'),
    getJson<{ latest: string | null }>('/apps/netspider/releases.json'),
    getJson<{ items: Activity[] }>('/activity.json'),
  ]);

  if (stable) {
    setText('stable-version', stable.version);
    setAgo('stable-ago', stable.published_at);
    const card = document.getElementById('live-stable');
    if (card) renderChannel(card, stable, 'stable');
  }
  if (devel) {
    setText('devel-version', `${devel.version} dev`);
    setAgo('devel-ago', devel.published_at);
    const pin = devel.release_notes?.platform.freebsd.to_commit ?? devel.provenance?.freebsd;
    if (pin) setText('freebsd-pin', pin.slice(0, 7));
    const card = document.getElementById('live-devel');
    if (card) renderChannel(card, devel, 'devel', develArm);
    const latest = changesOf(devel).slice(0, 4);
    const slideList = document.querySelector('[data-live="devel-changes"]');
    if (slideList && latest.length) slideList.innerHTML = latest.map(changeItem).join('');
    renderProvenance(devel);
  }
  if (develArm) setAgo('arm-ago', develArm.published_at);
  if (netspider?.latest && /^v?[0-9A-Za-z.-]+$/.test(netspider.latest)) setText('netspider-version', netspider.latest);
  if (activity?.items) renderActivity(activity.items);
  document.documentElement.classList.add('live-ready');
}

load();
window.setInterval(load, REFRESH_MS);
window.setInterval(refreshAgo, 60 * 1000);
