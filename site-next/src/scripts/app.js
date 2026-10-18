// Site-wide behaviour: theme switch, header, reveal-on-scroll, card tilt, copy buttons.
// Bootstrap components are imported from source so only the ones the site uses are bundled.
import $ from 'jquery';
import 'bootstrap/js/src/dropdown.js';
import Offcanvas from 'bootstrap/js/src/offcanvas.js';
import Toast from 'bootstrap/js/src/toast.js';

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- theme ---- */
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
function storedTheme() {
  try { return localStorage.getItem('fs-theme') || 'dark'; } catch { return 'dark'; }
}
function applyTheme(pref) {
  const theme = pref === 'auto' ? (darkQuery.matches ? 'dark' : 'light') : pref;
  document.documentElement.setAttribute('data-bs-theme', theme === 'light' ? 'light' : 'dark');
  $('[data-theme-set]').each(function () {
    $(this).attr('aria-pressed', String($(this).data('theme-set') === pref));
  });
  $(document).trigger('fs:theme');
}
applyTheme(storedTheme());
$(document).on('click', '[data-theme-set]', function () {
  const pref = String($(this).data('theme-set'));
  try { localStorage.setItem('fs-theme', pref); } catch { /* storage blocked: the choice lasts for this page */ }
  applyTheme(pref);
});
darkQuery.addEventListener('change', () => { if (storedTheme() === 'auto') applyTheme('auto'); });

/* ---- header ---- */
const $header = $('.fs-header');
const onScroll = () => $header.toggleClass('is-scrolled', window.scrollY > 8);
$(window).on('scroll', onScroll);
onScroll();

/* ---- reveal ---- */
const observer = 'IntersectionObserver' in window && !reduceMotion
  ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      $(entry.target).addClass('in').trigger('fs:in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 })
  : null;
$('.reveal, [data-observe]').each(function () {
  if (observer) observer.observe(this); else $(this).addClass('in').trigger('fs:in');
});
$('.chain').on('fs:in', function () { $(this).addClass('on'); });

/* ---- card tilt (pointer devices only) ---- */
if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
  $(document).on('mousemove', '.tilt', function (e) {
    const r = this.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    $(this).css({
      transform: `perspective(800px) rotateX(${((0.5 - y) * 6).toFixed(2)}deg) rotateY(${((x - 0.5) * 8).toFixed(2)}deg)`,
      '--mx': `${x * 100}%`,
      '--my': `${y * 100}%`,
    });
  }).on('mouseleave', '.tilt', function () {
    const el = this;
    $(el).css({ transform: '', transition: 'transform .5s cubic-bezier(.2,.7,.2,1), border-color .3s, box-shadow .3s' });
    setTimeout(() => $(el).css('transition', ''), 500);
  });
}

/* ---- copy buttons ---- */
$(document).on('click', '.copy-btn', function () {
  const text = $(this).data('copy') || $(this).siblings('code').text();
  const done = () => {
    const toast = document.getElementById('copyToast');
    if (toast) Toast.getOrCreateInstance(toast, { delay: 1800 }).show();
  };
  if (navigator.clipboard) navigator.clipboard.writeText(String(text)).then(done, () => {}); else done();
});

/* ---- close the mobile menu after following a link ---- */
$('#mnav a').on('click', () => {
  const menu = document.getElementById('mnav');
  Offcanvas.getInstance(menu)?.hide();
});
