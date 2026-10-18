// Hero news rail: prev/next buttons, autoplay that pauses on hover/focus and stops for reduced motion.
import $ from 'jquery';
import { reduceMotion } from './app.js';

const DELAY = 6000;

$('[data-news-rail]').each(function () {
  const $rail = $(this);
  const track = $rail.find('.news-rail-track')[0];
  const $prev = $rail.find('[data-rail="prev"]');
  const $next = $rail.find('[data-rail="next"]');
  const $bar = $rail.find('.news-rail-progress span');
  let timer = null;
  let paused = false;

  const step = () => {
    const card = track.querySelector('.rail-card');
    return card ? card.getBoundingClientRect().width + 12 : track.clientWidth;
  };
  const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  const update = () => {
    $prev.prop('disabled', track.scrollLeft <= 4);
    $next.prop('disabled', atEnd());
  };
  const go = (dir) => track.scrollBy({ left: dir * step() });

  const restartBar = () => {
    $rail.removeClass('is-playing');
    void $bar[0]?.offsetWidth; // restart the CSS animation
    if (timer) $rail.addClass('is-playing');
  };
  const stop = () => { clearInterval(timer); timer = null; $rail.removeClass('is-playing'); };
  const start = () => {
    if (reduceMotion || paused || track.scrollWidth <= track.clientWidth) return;
    stop();
    timer = setInterval(() => {
      if (atEnd()) track.scrollTo({ left: 0 }); else go(1);
      restartBar();
    }, DELAY);
    restartBar();
  };

  $rail[0].style.setProperty('--rail-ms', `${DELAY}ms`);
  $prev.on('click', () => { go(-1); start(); });
  $next.on('click', () => { go(1); start(); });
  $(track).on('scroll', update);
  $rail.on('mouseenter focusin', () => { paused = true; stop(); });
  $rail.on('mouseleave focusout', (e) => {
    if (e.type === 'focusout' && $rail[0].contains(e.relatedTarget)) return;
    paused = false; start();
  });
  $(document).on('visibilitychange', () => (document.hidden ? stop() : start()));
  $(window).on('resize', update);

  update();
  start();
});
