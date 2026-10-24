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
  // إن لم توجد الصورة بالامتداد المكتوب (jpg) نجرّب امتدادات أخرى بنفس الاسم قبل أن نتخلّى عنها
  function fall(im, src) {
    var base = src.replace(/\.[^.\/?]+$/, ''), ex = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'], n = 0;
    im.onerror = function () {
      var e = ex[n++];
      if (!e) { im.onerror = null; im.remove(); return; }
      if (src.slice(-(e.length + 1)) === '.' + e) return im.onerror();
      im.src = base + '.' + e;
    };
  }
  var pending = {}, loaded = false;
  function ensure(k) { var p = pending[k]; if (p) { p.im.src = p.src; delete pending[k]; } }
  pages.forEach(function (s, k) {
    var c = cfg && cfg[k], bg = s.querySelector('.hx-bg');
    if (!bg) return;
    var im = bg.querySelector('img');
    var src = c && c.img ? encodeURI(c.img) : (im && im.getAttribute('data-src')) || '';
    if (!src) return;
    if (!im) { im = document.createElement('img'); im.alt = ''; im.decoding = 'async'; im.onerror = function () { im.remove(); }; bg.appendChild(im); }
    fall(im, src);
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

  // ── كتابة العنوان حرفاً بحرف ──
  var twT = new WeakMap();
  function twStop(s) {
    var st = twT.get(s); if (!st) return;
    clearTimeout(st.t);
    st.lines.forEach(function (L) {
      if (L.el.textContent === L.last) L.el.textContent = L.full; // لم تُستبدل بترجمة: نعيد النص الكامل
      L.el.parentNode.classList.remove('tw-cur');
    });
    twT.delete(s);
  }
  function twKick(s) { // أول مرة: ننتظر انتهاء main.js من الترجمة حتى لا يستبدل نص العنوان أثناء الكتابة
    if (reduce) return;
    if (document.readyState === 'loading') {
      hero.classList.add('tw-wait');
      document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { twStart(s); }, 0); });
    } else twStart(s);
  }
  function twStart(s) {
    hero.classList.remove('tw-wait');
    twStop(s);
    var els = [].slice.call(s.querySelectorAll('.hx-title .ln > span'));
    if (!els.length || reduce) return;
    var st = { li: 0, ci: 0, t: 0, lines: els.map(function (e) { return { el: e, full: e.textContent, chars: Array.from(e.textContent), last: '' }; }) };
    st.lines.forEach(function (L) { L.el.textContent = ''; });
    twT.set(s, st);
    function tick() {
      var L = st.lines[st.li]; if (!L) return;
      if (L.el.textContent !== L.last) { twStop(s); return; } // استُبدل النص (تغيير اللغة): نتوقف
      L.el.parentNode.classList.add('tw-cur');
      if (st.ci < L.chars.length) {
        st.ci++; L.last = L.chars.slice(0, st.ci).join(''); L.el.textContent = L.last;
        st.t = setTimeout(tick, 34 + Math.random() * 34);
      } else if (st.lines[st.li + 1]) {
        L.el.parentNode.classList.remove('tw-cur'); st.li++; st.ci = 0; st.t = setTimeout(tick, 260);
      }
    }
    st.t = setTimeout(tick, 350);
  }

  function go(i) {
    var prev = cur;
    cur = (i + pages.length) % pages.length;
    if (prev !== cur) twStop(pages[prev]);
    twKick(pages[cur]);
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
