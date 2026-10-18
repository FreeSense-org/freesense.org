// Pure helpers for the live release, download and app pages.
// No DOM or jQuery here, so node --test can exercise every rule directly.

export const GH = 'https://github.com/FreeSense-org';
export const DOCS = 'https://docs.freesense.org';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
export function timeAgo(iso, now = Date.now()) {
  const seconds = (Date.parse(iso) - now) / 1000;
  if (Number.isNaN(seconds)) return '';
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function shortDate(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.valueOf())
    ? ''
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function longDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.valueOf())
    ? ''
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function fileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GiB`;
  if (value >= 1024 ** 2) return `${Math.round(value / 1024 ** 2)} MiB`;
  return `${Math.max(1, Math.round(value / 1024))} KiB`;
}

/* ---------- release channels (home page) ---------- */

export const TYPE_LABELS = {
  security: 'Security', fix: 'Fix', feature: 'Feature', ui: 'WebUI', package: 'Packages',
  documentation: 'Docs', build: 'Build', other: 'Change',
};

export function changesOf(release) {
  const list = release?.release_notes?.freesense ?? release?.changes ?? [];
  return list.filter((c) => c && typeof c.title === 'string' && !/^Merge (pull request|branch)/i.test(c.title));
}

export function changeItem(change) {
  const type = Object.hasOwn(TYPE_LABELS, change.type) ? change.type : 'other';
  const title = change.title.replace(/\s*\(#(\d+)\)$/, '');
  const pr = change.title.match(/\(#(\d+)\)$/)?.[1];
  return `<li><span class="chg chg-${type}">${TYPE_LABELS[type]}</span><span>${escapeHtml(title)}${
    pr ? ` <a href="${GH}/freesense/pull/${pr}" rel="noopener">#${pr}</a>` : ''}</span></li>`;
}

// Headline changes of each Stable line, shown when its release document carries
// no change list (the first release of a line has no baseline to compare against).
export const STABLE_HIGHLIGHTS = {
  '1.1': [
    { type: 'feature', title: 'REST API with per-user keys and an API Explorer' },
    { type: 'package', title: 'Custom package repositories and a rebuilt Package Manager' },
    { type: 'ui', title: 'Grouped menus and Ctrl+K menu search across the WebUI' },
    { type: 'feature', title: 'VXLAN interfaces and encrypted remote configuration backups' },
    { type: 'package', title: 'Threat Shield & DNS Protection for DNS filtering' },
    { type: 'security', title: 'Fixes for advisories SA-26_05 to SA-26_21' },
  ],
};

// An empty Development build really is a rebuild without source changes; an empty
// Stable list points to the release notes instead.
export function emptyChanges(channel, version) {
  if (channel !== 'stable') return '<li class="empty">Maintenance rebuild with no FreeSense source changes.</li>';
  const highlights = STABLE_HIGHLIGHTS[String(version).split('.').slice(0, 2).join('.')] ?? [];
  const notes = `<a href="${DOCS}/releases/stable/">release notes</a>`;
  return highlights.length
    ? highlights.map(changeItem).join('') + `<li class="empty notes"><span>Highlights of the line. Read the full ${notes}.</span></li>`
    : `<li class="empty notes"><span>This release's changes are described in the ${notes}.</span></li>`;
}

export function imagesOf(release, arm) {
  const out = new Set();
  for (const a of [...(release?.artifacts ?? []), ...(arm?.artifacts ?? [])]) {
    if (a.kind === 'installer') out.add(a.format === 'iso' ? 'amd64 ISO' : 'ARM64 installer');
    if (a.kind === 'cloud') out.add(`${(a.filesystem ?? '').toUpperCase()} ${String(a.format).toUpperCase()}`.trim());
    if (a.kind === 'appliance') out.add(a.platform === 'arm64-rpi4b' ? 'Pi 4B' : a.platform === 'arm64-rpi5-d0' ? 'Pi 5' : 'Appliance');
  }
  return [...out];
}

// The parts of a channel card that come from its release document.
export function channelView(release, channel, arm) {
  const changes = changesOf(release);
  const counts = release.release_notes?.platform?.packages?.counts;
  const platform = release.release_notes?.platform?.freebsd;
  // Short change lists are topped up with the release's package updates.
  const updates = (release.release_notes?.platform?.packages?.updated ?? []).slice(0, Math.max(0, 5 - changes.length));
  const changesHtml = (changes.length
    ? changes.slice(0, 6).map(changeItem).join('')
      + (changes.length > 6 ? `<li class="more">+ ${changes.length - 6} more changes</li>` : '')
    : emptyChanges(channel, release.version))
    + updates.map((u) => `<li class="pkg"><span class="chg chg-package">Package</span><span>${escapeHtml(u.name)} <code>${
      escapeHtml(u.from)}</code> → <code>${escapeHtml(u.to)}</code></span></li>`).join('');
  // Without a change list and with no package movement, the release document had
  // no baseline to compare against: zero counts would read as "nothing changed".
  const noBaseline = channel === 'stable' && !changes.length
    && (!counts || counts.updated + counts.added + counts.removed === 0);
  const statsHtml = noBaseline ? '' : [
    counts && `<div><b>${Number(counts.updated)}</b><span>packages updated</span></div>`,
    counts && `<div><b>${Number(counts.added) + Number(counts.removed)}</b><span>added / removed</span></div>`,
    platform && `<div><b>${platform.changed ? 'New' : 'Same'}</b><span>FreeBSD base${platform.ports_changed ? ', ports refreshed' : ''}</span></div>`,
  ].filter(Boolean).join('');
  return {
    label: channel === 'stable' ? release.version : `${release.version} dev`,
    changesHtml,
    statsHtml,
    imagesHtml: imagesOf(release, arm).map((i) => `<span>${escapeHtml(i)}</span>`).join(''),
  };
}

export function freebsdPin(release) {
  const pin = release?.release_notes?.platform?.freebsd?.to_commit ?? release?.provenance?.freebsd;
  return /^[0-9a-f]{7,40}$/.test(pin ?? '') ? pin : null;
}

export const PROVENANCE_LINKS = {
  source: ['FreeSense source', `${GH}/freesense/commit/`],
  system_ports: ['System ports', `${GH}/freesense-system-ports/commit/`],
  packages: ['Optional packages', `${GH}/freesense-packages/commit/`],
  os_definition: ['OS definition', `${GH}/freesense-os-base/commit/`],
  ports: ['FreeBSD ports', 'https://github.com/freebsd/freebsd-ports/commit/'],
  freebsd: ['FreeBSD src', 'https://github.com/freebsd/freebsd-src/commit/'],
};

export function provenanceHtml(provenance) {
  if (!provenance || typeof provenance !== 'object') return '';
  return Object.entries(PROVENANCE_LINKS)
    .filter(([key]) => /^[0-9a-f]{40}$/.test(provenance[key] ?? ''))
    .map(([key, [label, base]]) => `<a href="${base}${provenance[key]}" rel="noopener"><span>${label}</span><code>${provenance[key].slice(0, 10)}</code></a>`)
    .join('');
}

export function activityHtml(items) {
  return items.slice(0, 7).map((item) => {
    const pr = item.message.match(/\(#(\d+)\)$/)?.[1];
    const msg = item.message.replace(/\s*\(#\d+\)$/, '');
    return `<li>
      <span class="act-dot"></span>
      <div>
        <a class="act-msg" href="${escapeHtml(item.url)}" rel="noopener">${escapeHtml(msg)}</a>
        <div class="act-meta">
          <a href="${GH}/${escapeHtml(item.repo)}" rel="noopener">${escapeHtml(item.repo)}</a>
          ${pr ? `<a href="${GH}/${escapeHtml(item.repo)}/pull/${pr}" rel="noopener">#${pr}</a>` : ''}
          <code>${escapeHtml(String(item.sha).slice(0, 7))}</code>
          <time data-time="${escapeHtml(item.date)}" datetime="${escapeHtml(item.date)}">${timeAgo(item.date)}</time>
        </div>
      </div>
    </li>`;
  }).join('');
}

/* ---------- download picker ---------- */

export const SCHEMAS = ['freesense.download/v1', 'freesense.download/v2', 'freesense.download/v3', 'freesense.download/v4'];

export const ARTIFACT_TYPES = {
  installer: { label: 'Installer', title: 'Installer ISO', description: 'Bootable installation media for dedicated hardware and virtual machines.' },
  ufs: { label: 'UFS cloud', title: 'UFS cloud image', description: 'The recommended cloud image: compact, straightforward, and ready for root-disk growth.' },
  zfs: { label: 'ZFS cloud', title: 'ZFS cloud image', description: 'A larger cloud image with ZFS datasets and boot-environment support.' },
  rpi4: { label: 'Raspberry Pi 4B', title: 'Raspberry Pi 4B appliance', description: 'Flash-and-run UFS image for Raspberry Pi 4 Model B only. Hardware verification is shown per artifact.' },
  rpi5: { label: 'Raspberry Pi 5 D0', title: 'Raspberry Pi 5 D0 appliance', description: 'Experimental D0-only image using third-party UEFI. Requires EEPROM firmware dated 2025-06-09 or newer and USB Ethernet.' },
};
export const ARTIFACT_FORMATS = {
  iso: { label: 'ISO image', action: 'Download ISO' },
  img: { label: 'Flashable IMG', action: 'Download IMG' },
  qcow2: { label: 'QCOW2 (recommended)', action: 'Download QCOW2' },
  raw: { label: 'Raw GPT', action: 'Download raw GPT' },
};
export const TYPE_ORDER = ['installer', 'rpi4', 'rpi5', 'ufs', 'zfs'];
export const FORMAT_ORDER = ['iso', 'img', 'qcow2', 'raw'];

// Raspberry Pi appliance images are Development-only; never offer one as a
// Stable download, even if a Stable arm64 document carries it.
export function artifactsForRelease(release) {
  if (['freesense.download/v2', 'freesense.download/v3', 'freesense.download/v4'].includes(release?.schema_version) && Array.isArray(release.artifacts)) {
    return release.artifacts.filter((artifact) => artifact?.url && artifact?.format
      && !(release.channel === 'stable' && artifact.kind === 'appliance'));
  }
  if (!release?.url) return [];
  return [{ kind: 'installer', format: 'iso', file: release.iso, url: release.url, size: release.size, sha256: release.sha256 }];
}

export function artifactType(artifact) {
  if (artifact?.kind === 'installer' || artifact?.format === 'iso') return 'installer';
  if (artifact?.kind === 'appliance' && artifact?.platform === 'arm64-rpi4b') return 'rpi4';
  if (artifact?.kind === 'appliance' && artifact?.platform === 'arm64-rpi5-d0') return 'rpi5';
  return Object.hasOwn(ARTIFACT_TYPES, artifact?.filesystem) ? artifact.filesystem : '';
}

export function artifactLabel(artifact) {
  const type = ARTIFACT_TYPES[artifactType(artifact)]?.title || 'Download image';
  const format = ARTIFACT_FORMATS[artifact?.format]?.label || artifact?.format;
  return artifactType(artifact) === 'installer' ? format : `${type} — ${format}`;
}

// "1.1.0" -> "1.1.x": the Stable line comes from the release document.
export function releaseLine(version) {
  const match = /^(\d+\.\d+)\./.exec(String(version || ''));
  return match ? `${match[1]}.x` : null;
}

export function noticeBlock(key, release) {
  if (key === 'devel') {
    return '<div class="channel-notice experimental"><strong>Experimental &mdash; no support</strong><span>For labs and testing, never production.</span></div>';
  }
  const line = releaseLine(release?.version);
  const scope = line ? `throughout the ${escapeHtml(line)} line` : 'throughout its release line';
  return `<div class="channel-notice supported"><strong>Recommended for production</strong><span>Immutable and supported ${scope}.</span></div>`;
}

// Channels the picker may offer: published artifacts, and a Stable document only when supported.
export function availableChannels(channels) {
  return ['stable', 'devel'].filter((key) => {
    const release = channels[key];
    return artifactsForRelease(release).length > 0 && (key !== 'stable' || release.support_tier === 'supported');
  });
}

export function guideFor(type) {
  if (type === 'installer') return { path: '/getting-started/installation/', label: 'Installation guidance' };
  if (type === 'rpi4' || type === 'rpi5') return { path: '/1.2/getting-started/raspberry-pi/', label: 'Raspberry Pi flashing guide' };
  return { path: '/getting-started/cloud-images/', label: 'Cloud deployment guidance' };
}

export function changesBlock(release) {
  const types = { ...TYPE_LABELS, ui: 'Interface', package: 'Package' };
  const changes = Array.isArray(release.changes) ? release.changes.slice(0, 20) : [];
  if (!changes.length) {
    // Stable release documents may carry no change list (for example the first
    // release of a new line); the documentation has the notes.
    return release.channel === 'stable' || release.support_tier === 'supported'
      ? `<details class="channel-details changes empty"><summary><span>What changed</span><small>Release notes</small></summary>
        <p>Read the <a href="${DOCS}/releases/stable/">Stable release notes</a> in the documentation.</p></details>`
      : `<details class="channel-details changes empty"><summary><span>What changed</span><small>Not published</small></summary>
        <p>Release notes are not available for this build yet.</p></details>`;
  }
  const rows = changes.map((change) => {
    const type = Object.hasOwn(types, change.type) ? change.type : 'other';
    const scope = change.scope ? `<span>${escapeHtml(change.scope)}</span>` : '';
    return `<li><i class="change-type ${type}">${types[type]}</i><div><strong>${escapeHtml(change.title)}</strong>${scope}</div></li>`;
  }).join('');
  return `<details class="channel-details changes"><summary><span>What changed</span><small>${changes.length} ${changes.length === 1 ? 'change' : 'changes'}</small></summary><ol>${rows}</ol></details>`;
}

export function provenanceBlock(release) {
  const p = release.provenance;
  if (!p || typeof p !== 'object') return '';
  const sha = (value) => (value ? String(value).slice(0, 12) : 'not recorded');
  return `<details class="channel-details"><summary>Build provenance</summary><dl>
    <div><dt>Source</dt><dd>${escapeHtml(sha(p.source))}</dd></div>
    <div><dt>Ports</dt><dd>${escapeHtml(sha(p.ports))}</dd></div>
    <div><dt>OS definition</dt><dd>${escapeHtml(sha(p.os_definition))}</dd></div>
    <div><dt>FreeBSD</dt><dd>${escapeHtml(sha(p.freebsd))}</dd></div>
  </dl></details>`;
}

export function checksumBlock(artifacts) {
  return `<details class="channel-details checksum"><summary>SHA-256 checksums</summary>
    ${artifacts.map((artifact) => `<p><b>${escapeHtml(artifactLabel(artifact))}</b><code>${escapeHtml(artifact.sha256 || 'not recorded')}</code></p>`).join('')}
  </details>`;
}

/* ---------- app release notes (NetSpider) ---------- */

function inline(text, repo) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
  // Trailing "(abc1234)" commit references become links to the commit.
  html = html.replace(/\(([0-9a-f]{7,40})\)/g, `(<a class="sha" href="https://github.com/${repo}/commit/$1" rel="noopener">$1</a>)`);
  return html;
}

// A deliberately small Markdown subset: everything is escaped before any markup is added.
export function renderNotes(markdown, repo, title = '') {
  const out = [];
  let list = false;
  let paragraph = [];
  const flush = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(' '), repo)}</p>`);
    paragraph = [];
    if (list) { out.push('</ul>'); list = false; }
  };
  for (const raw of String(markdown ?? '').split('\n')) {
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

export const NETSPIDER_PACKAGES = [
  { suffix: '-Setup.exe', exclude: 'PreRelease', title: 'Installer', badge: 'Recommended', body: 'Per-user install with shortcuts. Updates itself automatically. No admin rights needed to install.' },
  { suffix: '-Standalone.exe', title: 'Standalone', body: 'A single exe with nothing to install. Run it from anywhere, even a USB stick.' },
  { suffix: '-Portable.zip', title: 'Portable zip', body: 'Unzip and run. Updates are manual.' },
  { suffix: '.msi', title: 'MSI for IT', body: 'Machine-wide install for Intune, GPO or SCCM. Silent: msiexec /i <file> /qn.' },
  { suffix: '-PreRelease-Setup.exe', title: 'Pre-release installer', body: 'Same installer, but follows the Pre-release channel: early builds plus every release.' },
];

export function netspiderAsset(release, arch, pkg) {
  return release.assets.find((a) => a.name.endsWith(`-${release.version}-${arch}${pkg.suffix}`)
    && (!pkg.exclude || !a.name.includes(pkg.exclude))) ?? null;
}
