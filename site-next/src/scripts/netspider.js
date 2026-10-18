// NetSpider page: view tabs, screenshot lightbox, and live downloads + changelog from GitHub Releases.
import $ from 'jquery';
import { escapeHtml, longDate, fileSize, renderNotes, NETSPIDER_PACKAGES, netspiderAsset } from './lib.js';

/* ---- tour tabs ---- */
const $tabs = $('.tour-tabs [role="tab"]');
function selectTab($tab) {
  $tabs.each(function () {
    const on = this === $tab[0];
    $(this).attr({ 'aria-selected': String(on), tabindex: on ? 0 : -1 });
    $(`#${$(this).attr('aria-controls')}`).prop('hidden', !on);
  });
}
$tabs.on('click', function () { selectTab($(this)); });
$tabs.on('keydown', function (e) {
  const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!step) return;
  const i = $tabs.index(this);
  const $next = $tabs.eq((i + step + $tabs.length) % $tabs.length);
  $next.trigger('focus');
  selectTab($next);
});

/* ---- lightbox ---- */
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  $('.zoomable').on('click', function () {
    $('#lb-frame').empty().append($('<img>').attr({ src: $(this).data('full'), alt: $(this).data('caption') }));
    $('#lb-caption').text($(this).data('caption'));
    lightbox.showModal();
  });
  $(lightbox).on('click', (e) => { if (e.target === lightbox) lightbox.close(); });
}

/* ---- live downloads + changelog ---- */
let arch = 'win-x64';
let current = null;

function renderDownloads() {
  if (!current) return;
  const cards = NETSPIDER_PACKAGES.map((pkg) => {
    const asset = netspiderAsset(current, arch, pkg);
    if (!asset) return '';
    return `<a class="fs-card dl-card${pkg.badge ? ' primary' : ''}" href="${escapeHtml(asset.url)}">
      <strong>${escapeHtml(pkg.title)}${pkg.badge ? `<em>${pkg.badge}</em>` : ''}</strong>
      <small>${escapeHtml(pkg.body)}</small>
      <span class="dl-file">${escapeHtml(asset.name)} · ${fileSize(asset.size)}</span></a>`;
  }).join('');
  if (cards) $('#dl-grid').html(cards);
  const setup = netspiderAsset(current, arch, NETSPIDER_PACKAGES[0]);
  if (setup) $('#hero-download').attr('href', setup.url);
  const probes = current.assets.filter((a) => a.name.includes('-Probe-'));
  const sums = current.assets.find((a) => a.name === 'SHA256SUMS.txt');
  $('#dl-foot').html([
    sums && `<a href="${escapeHtml(sums.url)}">SHA256SUMS.txt</a>`,
    probes.length && `<a href="${escapeHtml(current.url)}" rel="noopener">Probe agent (${probes.length} platforms)</a>`,
    `<a href="${escapeHtml(current.url)}" rel="noopener">Release ${escapeHtml(current.tag)} on GitHub &rarr;</a>`,
  ].filter(Boolean).join('<span aria-hidden="true">·</span>'));
}

$('.arch-switch').on('click', 'button', function () {
  arch = String($(this).data('arch'));
  $('.arch-switch button').attr('aria-checked', function () { return String(this.dataset.arch === arch); });
  renderDownloads();
});

// Windows on ARM reports itself through client hints where supported.
navigator.userAgentData?.getHighEntropyValues?.(['architecture', 'bitness']).then((ua) => {
  if (ua?.architecture === 'arm') $('[data-arch="win-arm64"]').trigger('click');
}).catch(() => {});

if ($('#dl-grid').length) {
  $.ajax({ url: '/apps/netspider/releases.json', dataType: 'json', timeout: 15000 }).done((feed) => {
    if (!Array.isArray(feed?.releases) || !feed.releases.length) return;
    current = feed.releases.find((r) => r.tag === feed.latest) ?? feed.releases[0];
    $('#latest-version').text(`${current.tag} · latest`);
    $('#latest-date').text(longDate(current.published_at));
    $('#dl-version').text(current.version);
    renderDownloads();
    $('#changelog-list').html(feed.releases.map((release, i) => `
      <article class="fs-card release${i === 0 ? ' newest' : ''}">
        <div class="release-head">
          <span class="release-tag">${escapeHtml(release.tag)}</span>
          ${release.tag === feed.latest ? '<span class="release-badge">Latest</span>' : ''}
          ${release.prerelease ? '<span class="release-badge pre">Pre-release</span>' : ''}
          <span>${escapeHtml(longDate(release.published_at))}</span>
          <a href="${escapeHtml(release.url)}" rel="noopener">GitHub &nearr;</a>
        </div>
        <h3>${escapeHtml(release.name)}</h3>
        <div class="release-notes">${renderNotes(release.notes, feed.repo, release.name) || '<p>No release notes.</p>'}</div>
      </article>`).join(''));
  });
}
