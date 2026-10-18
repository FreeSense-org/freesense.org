// Guided download picker. It stores no release versions: it reads the published Stable and
// Development documents live and offers only the artifacts they carry.
import $ from 'jquery';
import {
  DOCS, SCHEMAS, ARTIFACT_TYPES, ARTIFACT_FORMATS, TYPE_ORDER, FORMAT_ORDER,
  escapeHtml, fileSize, artifactsForRelease, artifactType, noticeBlock, availableChannels, guideFor,
  changesBlock, provenanceBlock, checksumBlock,
} from './lib.js';

const CHANNEL_LABELS = { stable: 'Stable', devel: 'Development' };

function releaseDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date)} UTC`;
}

function pickerMarkup() {
  return `<div class="download-picker">
    <div class="picker-head">
      <div><span class="picker-kicker">Build your download</span>
        <h3>One clear path to the right image.</h3>
        <p>Choose an architecture, release, image type and file format. The matching verified artifact appears below.</p>
      </div>
      <div class="platform-lock"><span>Platform</span><strong id="platform-name">amd64</strong><small id="platform-detail">x86-64 &middot; UEFI + BIOS</small></div>
    </div>
    <div class="picker-controls">
      <label class="picker-field"><span><b>1</b> Architecture</span>
        <select id="architecture-select">
          <option value="amd64">amd64 (x86-64)</option>
          <option value="arm64">arm64 (experimental)</option>
        </select>
        <small>ARM64 requires standards-compliant UEFI.</small>
      </label>
      <label class="picker-field"><span><b>2</b> Release</span>
        <select id="release-select"></select>
        <small>Stable is recommended.</small>
      </label>
      <label class="picker-field"><span><b>3</b> Image type</span>
        <select id="image-select"></select>
        <small>Installer, cloud filesystem or appliance.</small>
      </label>
      <label class="picker-field"><span><b>4</b> Format</span>
        <select id="format-select"></select>
        <small>Use QCOW2 unless raw is required.</small>
      </label>
    </div>
    <div id="picker-notice" class="picker-notice"></div>
    <div id="picker-result" class="picker-result" aria-live="polite"></div>
    <div id="picker-details" class="picker-details"></div>
  </div>`;
}

function replaceOptions($select, options, preferred) {
  $select.empty().append(options.map(({ value, label }) => $('<option>').val(value).text(label)));
  $select.val(options.some((o) => o.value === preferred) ? preferred : options[0].value);
  $select.prop('disabled', options.length === 1);
}

function mountPicker($target, channels, architecture) {
  const available = availableChannels(channels);
  if (!available.length) {
    $target.html(`<div class="not-available">No published release artifacts are currently available for ${escapeHtml(architecture)}.
      <a href="https://github.com/FreeSense-org/freesense-os-base/actions" rel="noopener">See the build pipeline</a>.</div>`);
    return;
  }
  $target.html(pickerMarkup());
  const $release = $('#release-select');
  const $arch = $('#architecture-select');
  const $image = $('#image-select');
  const $format = $('#format-select');
  const requested = new URLSearchParams(window.location.search);
  const requestedChannel = requested.get('channel');
  const requestedType = requested.get('image');
  const requestedFormat = requested.get('format');

  $arch.val(architecture);
  $('#platform-name').text(architecture);
  $('#platform-detail').text(architecture === 'arm64'
    ? 'AArch64 · generic UEFI + Pi appliances · experimental'
    : 'x86-64 · UEFI + BIOS');

  const matchingChannel = available.find((key) => artifactsForRelease(channels[key]).some((artifact) => (
    artifactType(artifact) === requestedType && (!requestedFormat || artifact.format === requestedFormat)
  )));
  const initialChannel = available.includes(requestedChannel) ? requestedChannel : matchingChannel || available[0];

  replaceOptions($release, available.map((key) => {
    const release = channels[key];
    const generation = key === 'devel' && Number.isInteger(release.generation) ? ` (g${release.generation})` : '';
    return { value: key, label: `${CHANNEL_LABELS[key]} ${release.version || ''}${generation}` };
  }), initialChannel);

  const selectedRelease = () => channels[$release.val()];
  const selectedArtifacts = () => artifactsForRelease(selectedRelease());

  const render = () => {
    const key = $release.val();
    const release = selectedRelease();
    const artifacts = selectedArtifacts();
    const artifact = artifacts.find((item) => artifactType(item) === $image.val() && item.format === $format.val());
    if (!artifact) {
      $('#picker-result').html('<div class="not-available">This artifact combination is not published.</div>');
      return;
    }
    const type = ARTIFACT_TYPES[$image.val()];
    const format = ARTIFACT_FORMATS[artifact.format] ?? { label: artifact.format, action: 'Download' };
    const typeTitle = $image.val() === 'installer' ? format.label : type.title;
    const version = release.version ? `FreeSense ${release.version}` : 'Current build';
    const generation = key === 'devel' && Number.isInteger(release.generation) ? `Generation ${release.generation}` : 'Stable release';
    const published = releaseDate(release.published_at || release.date);
    const file = artifact.file || String(artifact.url).split('/').pop();
    const guide = guideFor($image.val());
    $('#picker-notice').html(noticeBlock(key, release));
    $('#picker-result').html(`<div class="result-copy">
        <span class="picker-kicker">Selected download</span>
        <div class="result-title"><h3>${escapeHtml(typeTitle)}</h3>${fileSize(artifact.size) ? `<span>${escapeHtml(fileSize(artifact.size))}</span>` : ''}</div>
        <p>${escapeHtml(type.description)}</p>
        <div class="result-tags"><span>${escapeHtml(version)}</span><span>${escapeHtml(generation)}</span><span>${escapeHtml(architecture)}</span>${
          artifact.hardware_verification ? `<span>hardware ${escapeHtml(artifact.hardware_verification)}</span>` : ''}${
          published ? `<span>${escapeHtml(published)}</span>` : ''}</div>
        <dl class="artifact-facts"><div><dt>File</dt><dd>${escapeHtml(file)}</dd></div>
          <div><dt>SHA-256</dt><dd>${escapeHtml(artifact.sha256 || 'not recorded')}</dd></div></dl>
      </div>
      <div class="result-action">
        <a class="btn-pill btn-grad" href="${escapeHtml(artifact.url)}">${escapeHtml(format.action)}<small>${escapeHtml(fileSize(artifact.size))}</small></a>
        <a href="${DOCS}${guide.path}">${guide.label} <span aria-hidden="true">&rarr;</span></a>
      </div>`);
    $('#picker-details').html(`<div class="release-details">${changesBlock(release)}${provenanceBlock(release)}${checksumBlock(artifacts)}</div>`);
    $('[data-verify-file]').text(file);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('channel', key);
      url.searchParams.set('image', $image.val());
      url.searchParams.set('format', $format.val());
      url.searchParams.set('architecture', architecture);
      window.history.replaceState(null, '', url);
    } catch { /* history unavailable: the picker still works */ }
  };

  const refreshFormats = (preferred) => {
    const formats = FORMAT_ORDER.filter((format) => selectedArtifacts().some((artifact) => (
      artifactType(artifact) === $image.val() && artifact.format === format
    )));
    replaceOptions($format, formats.map((format) => ({ value: format, label: ARTIFACT_FORMATS[format]?.label || format })), preferred);
    render();
  };

  const refreshTypes = (preferred, preferredFormat = $format.val()) => {
    const types = TYPE_ORDER.filter((type) => selectedArtifacts().some((artifact) => artifactType(artifact) === type));
    replaceOptions($image, types.map((type) => ({ value: type, label: ARTIFACT_TYPES[type].label })), preferred);
    refreshFormats(preferredFormat);
  };

  $release.on('change', () => refreshTypes($image.val()));
  $arch.on('change', () => loadChannels(String($arch.val())));
  $image.on('change', () => refreshFormats($format.val()));
  $format.on('change', render);
  refreshTypes(requestedType || 'installer', requestedFormat || 'iso');
}

function fetchChannel(key, architecture) {
  return $.ajax({ url: `/releases/${key}.json?architecture=${encodeURIComponent(architecture)}`, dataType: 'json', cache: false, timeout: 15000 })
    .then((release) => (SCHEMAS.includes(release?.schema_version) && release.channel === key ? release : null),
      () => $.Deferred().resolve(null).promise());
}

function loadChannels(architecture = 'amd64') {
  const $target = $('#download-picker');
  $.when(fetchChannel('stable', architecture), fetchChannel('devel', architecture)).then((stable, devel) => {
    mountPicker($target, { stable, devel }, architecture);
  });
}

if ($('#download-picker').length) {
  const requestedArchitecture = new URLSearchParams(window.location.search).get('architecture');
  loadChannels(requestedArchitecture === 'arm64' ? 'arm64' : 'amd64');
}
