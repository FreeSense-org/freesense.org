// Compare page: filter chips hide product columns and cards; FreeSense always stays visible.
import $ from 'jquery';

const $chips = $('[data-compare-filter]');
const $cols = $('[data-col]');

function apply(group) {
  $chips.each(function () { $(this).attr('aria-pressed', String($(this).data('compare-filter') === group)); });
  const visible = new Set();
  $('thead [data-col]').each(function () {
    const id = String($(this).data('col'));
    const groups = String($(this).data('groups')).split(' ');
    if (group === 'all' || id === 'freesense' || groups.includes(group)) visible.add(id);
  });
  $cols.each(function () { $(this).prop('hidden', !visible.has(String($(this).data('col')))); });
  $('.compare-empty').prop('hidden', visible.size > 1);
  try { history.replaceState(null, '', group === 'all' ? location.pathname : `?show=${group}`); } catch { /* history blocked */ }
}

$chips.on('click', function () { apply(String($(this).data('compare-filter'))); });
const initial = new URLSearchParams(location.search).get('show');
apply($chips.filter(`[data-compare-filter="${initial}"]`).length ? initial : 'all');
