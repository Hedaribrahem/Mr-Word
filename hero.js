(function () {
  var hero = document.getElementById('home');
  if (!hero) return;
  var pages = [].slice.call(hero.querySelectorAll('.hx-slide'));
  var bars = [].slice.call(hero.querySelectorAll('.hx-bar'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 769px)').matches;
  // صور الصفحات من site-data.js (تُدار من لوحة التحكم).
  // الصفحة الأولى تُحمَّل فوراً، والبقية بعد اكتمال الصفحة (أو عند الاقتراب من عرضها) لتسريع أول ظهور.
  var cfg = window.SITE && window.SITE.hero;
  var pending = {}, loaded = false;
  function ensure(k) { var p = pending[k]; if (p) { p.im.src = p.src; delete pending[k]; } }
  pages.forEach(function (s, k) {
    var c = cfg && cfg[k], bg = s.querySelector('.hx-bg');
    if (!bg) return;
    var im = bg.querySelector('img');
    var src = c && c.img ? encodeURI(c.img) : (im && im.getAttribute('data-src')) || '';
    if (!src) return;
    if (!im) { im = document.createElement('img'); im.alt = ''; im.decoding = 'async'; im.onerror = function () { im.remove(); }; bg.appendChild(im); }
    if (k === 0) { if (im.getAttribute('src') !== (c && c.img) && im.getAttribute('src') !== src) im.src = src; }
    else { im.removeAttribute('src'); pending[k] = { im: im, src: src }; }
  });
  window.addEventListener('load', function () { setTimeout(function () { loaded = true; Object.keys(pending).forEach(ensure); }, 1500); });
  var cur = 0, zin = true, started = false; // الصفحة الأولى تبدأ بتقريب
  var isRTL = function () { return document.documentElement.dir === 'rtl'; };

  function labels() {
    var en = document.documentElement.lang === 'en';
    hero.querySelector('.hx-prev').setAttribute('aria-label', en ? 'Previous' : 'السابق');
    hero.querySelector('.hx-next').setAttribute('aria-label', en ? 'Next' : 'التالي');
    hero.querySelector('.hx-scroll').setAttribute('aria-label', en ? 'Scroll down' : 'مرّر للأسفل');
  }
  labels();
  new MutationObserver(labels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  function go(i) {
    var prev = cur;
    cur = (i + pages.length) % pages.length;
    ensure(cur); if (loaded) ensure((cur + 1) % pages.length);
    if (prev !== cur) {
      var old = pages[prev];
      old.classList.add('leave');               // تبقى حركتها مستمرة أثناء التلاشي
      setTimeout(function () { old.classList.remove('leave'); }, 1300);
      zin = !zin;                               // تقريب ثم تبعيد بالتناوب: بداية كل صفحة = نهاية السابقة
      pages[cur].setAttribute('data-z', zin ? 'in' : 'out');
    }
    pages.forEach(function (s, k) { s.classList.toggle('active', k === cur); s.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
    bars.forEach(function (b, k) {
      b.classList.remove('on', 'done');
      b.removeAttribute('aria-current');
      if (k < cur) b.classList.add('done');
      if (k === cur) { if (started) void b.offsetWidth; b.classList.add(reduce ? 'done' : 'on'); b.setAttribute('aria-current', 'true'); }
    });
  }

  bars.forEach(function (b, k) {
    b.addEventListener('click', function () { go(k); });
    b.querySelector('i').addEventListener('animationend', function () { if (k === cur) go(cur + 1); });
  });
  hero.querySelector('.hx-prev').addEventListener('click', function () { go(cur - 1); });
  hero.querySelector('.hx-next').addEventListener('click', function () { go(cur + 1); });

  var holds = { hover: false, view: false, tab: false };
  function sync() { hero.classList.toggle('paused', holds.hover || holds.view || holds.tab); }
  if (desktop) {
    hero.addEventListener('mouseenter', function () { holds.hover = true; sync(); });
    hero.addEventListener('mouseleave', function () { holds.hover = false; sync(); });
  }
  new IntersectionObserver(function (es) { holds.view = !es[0].isIntersecting; sync(); }, { threshold: 0.3 }).observe(hero);
  document.addEventListener('visibilitychange', function () { holds.tab = document.hidden; sync(); });

  var tx = null;
  hero.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) go(cur + ((dx > 0) === isRTL() ? 1 : -1));
  }, { passive: true });

  go(0); started = true;
})();
