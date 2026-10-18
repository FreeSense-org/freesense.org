// Live release data: channel cards, status strip, development activity and build provenance.
// Everything renders from the same-origin Pages Functions; without them the static markup stays.
import $ from 'jquery';
import { timeAgo, shortDate, channelView, changesOf, changeItem, freebsdPin, provenanceHtml, activityHtml } from './lib.js';

const REFRESH_MS = 5 * 60 * 1000;

function getJson(url) {
  return $.ajax({ url, dataType: 'json', cache: false, headers: { Accept: 'application/json' }, timeout: 15000 })
    .then((data) => data, () => $.Deferred().resolve(null).promise());
}

function setText(key, value) {
  $(`[data-live="${key}"]`).text(value);
}

function setAgo(key, iso) {
  $(`[data-live="${key}"]`).each(function () {
    $(this).attr('data-time', iso).text(timeAgo(iso)).attr('title', shortDate(iso));
    if (this.tagName === 'TIME') $(this).attr('datetime', iso);
  });
}

function refreshAgo() {
  $('[data-time]').each(function () { $(this).text(timeAgo($(this).attr('data-time'))); });
}

function renderChannel($card, release, channel, arm) {
  const view = channelView(release, channel, arm);
  $card.find('.ch-version').text(view.label);
  $card.find('.ch-when').attr('data-time', release.published_at).attr('datetime', release.published_at)
    .attr('title', shortDate(release.published_at)).text(timeAgo(release.published_at));
  $card.find('.ch-changes').html(view.changesHtml);
  $card.find('.ch-stats').html(view.statsHtml);
  $card.find('.ch-images').html(view.imagesHtml);
  $card.removeClass('is-failed').addClass('is-live');
}

function load() {
  return $.when(
    getJson('/releases/stable.json'),
    getJson('/releases/devel.json'),
    getJson('/releases/devel.json?architecture=arm64'),
    getJson('/apps/netspider/releases.json'),
    getJson('/activity.json'),
  ).then((stable, devel, develArm, netspider, activity) => {
    if (stable) {
      setText('stable-version', stable.version);
      setAgo('stable-ago', stable.published_at);
      renderChannel($('#live-stable'), stable, 'stable');
    } else {
      $('#live-stable:not(.is-live)').addClass('is-failed');
    }
    if (devel) {
      setText('devel-version', `${devel.version} dev`);
      setAgo('devel-ago', devel.published_at);
      const pin = freebsdPin(devel);
      if (pin) setText('freebsd-pin', pin.slice(0, 7));
      renderChannel($('#live-devel'), devel, 'devel', develArm);
      const latest = changesOf(devel).slice(0, 4);
      if (latest.length) $('[data-live="devel-changes"]').html(latest.map(changeItem).join(''));
      const prov = provenanceHtml(devel.provenance);
      if (prov) $('#live-provenance').html(prov).addClass('is-live');
    } else {
      $('#live-devel:not(.is-live)').addClass('is-failed');
      $('#live-provenance:not(.is-live)').html('<p class="mb-0">The build revisions could not be loaded just now. Every release document lists them under <code>provenance</code>.</p>');
    }
    if (develArm) setAgo('arm-ago', develArm.published_at);
    if (netspider?.latest && /^v?[0-9A-Za-z.-]+$/.test(netspider.latest)) setText('netspider-version', netspider.latest);
    const $activity = $('#live-activity');
    if (Array.isArray(activity?.items) && activity.items.length) {
      $activity.html(activityHtml(activity.items)).addClass('is-live').closest('.activity').removeClass('is-failed');
    } else if (!$activity.hasClass('is-live')) {
      $activity.closest('.activity').addClass('is-failed');
    }
    document.documentElement.classList.add('live-ready');
  });
}

if ($('[data-live], #live-stable, #live-devel, #live-activity').length) {
  load();
  window.setInterval(load, REFRESH_MS);
  window.setInterval(refreshAgo, 60 * 1000);
}
