// News index: category chips and search, both kept in the URL so a filtered list can be shared.
import $ from 'jquery';

const $feed = $('.news-feed');
if ($feed.length) {
  const $items = $feed.children('.news-row');
  let category = 'all';
  let term = '';
  $items.find('[data-hl]').each(function () { $(this).data('raw', $(this).text()); });
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const render = () => {
    let shown = 0;
    const re = term ? new RegExp(`(${escapeRe(term)})`, 'ig') : null;
    $items.each(function () {
      const $item = $(this);
      const okCategory = category === 'all' || $item.data('cat') === category;
      const okTerm = !term || $item.text().toLowerCase().includes(term.toLowerCase());
      const show = okCategory && okTerm;
      $item.toggleClass('d-none', !show);
      $item.find('[data-hl]').each(function () {
        const safe = $('<div>').text($(this).data('raw')).html();
        $(this).html(re && show ? safe.replace(re, '<mark>$1</mark>') : safe);
      });
      if (show) shown += 1;
    });
    $('.empty-state').toggleClass('d-none', shown > 0);
    $('#news-count').text(`${shown} ${shown === 1 ? 'post' : 'posts'}`);
    try {
      const url = new URL(window.location.href);
      if (category === 'all') url.searchParams.delete('cat'); else url.searchParams.set('cat', category);
      if (term) url.searchParams.set('q', term); else url.searchParams.delete('q');
      window.history.replaceState(null, '', url);
    } catch { /* history unavailable */ }
  };

  const params = new URLSearchParams(window.location.search);
  category = params.get('cat') || 'all';
  if (!$(`.chip[data-cat="${CSS.escape(category)}"]`).length) category = 'all';
  term = (params.get('q') || '').replace(/^\s+|\s+$/g, '');
  $('#q').val(term);
  $('.chip').attr('aria-pressed', function () { return String($(this).data('cat') === category); });
  $('.filters').on('click', '.chip', function () {
    category = String($(this).data('cat'));
    $('.chip').attr('aria-pressed', 'false');
    $(this).attr('aria-pressed', 'true');
    render();
  });
  $('#q').on('input', function () { term = String($(this).val()).replace(/^\s+|\s+$/g, ''); render(); });
  $(document).on('keydown', (e) => {
    if (e.key === '/' && !$(e.target).is('input, textarea, select')) { e.preventDefault(); $('#q').trigger('focus'); }
  });
  render();
}
