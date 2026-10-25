(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ── إحصائيات من site-data.js (عدد العملاء والتقييم) ──
  var ST = (window.SITE && window.SITE.stats) || {};
  [].forEach.call(document.querySelectorAll('.strip-num[data-site]'), function (el) {
    var v = ST[el.getAttribute('data-site')];
    if (v == null) return;
    if (+v === 0) el.setAttribute('data-pre', ''); // صفر: بدون علامة +
    el.setAttribute('data-to', v);
    el.textContent = (el.getAttribute('data-pre') || '') + (+v).toFixed(+el.getAttribute('data-dec') || 0) + (el.getAttribute('data-suf') || '');
  });

  // ── أرقام القوالب والدروس تُقرأ من ملفات البيانات بدل كتابتها يدوياً ──
  [].forEach.call(document.querySelectorAll('.strip-num[data-count]'), function (el) {
    var n = el.getAttribute('data-count') === 'templates'
      ? (window.TEMPLATES || []).filter(function (t) { return !t.bonus; }).length
      : (window.LESSONS || []).length;
    // نعرض الرقم الحقيقي دائماً (حتى لو كان صفراً) ولا نُبقي أي رقم وهمي مكتوب في الصفحة
    el.setAttribute('data-to', n); el.setAttribute('data-pre', n ? '+' : ''); el.textContent = (n ? '+' : '') + n;
  });

  // ── عدّاد الأرقام: يبدأ سريعاً ثم يتباطأ حتى يقف على الرقم النهائي ──
  var nums = [].slice.call(document.querySelectorAll('.strip-num[data-to]'));
  function fmt(el, v) {
    el.textContent = (el.getAttribute('data-pre') || '') + v.toFixed(+el.getAttribute('data-dec') || 0) + (el.getAttribute('data-suf') || '');
  }
  if (nums.length && !reduce) {
    nums.forEach(function (el) { fmt(el, 0); });
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = parseFloat(el.getAttribute('data-to')), t0 = null, dur = 2200;
        (function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          fmt(el, p < 1 ? to * (1 - Math.pow(1 - p, 4)) : to);
          if (p < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { cio.observe(el); });
  }

  // ── الأكاديمية: مشغّل على اليمين + قائمة دروس على اليسار (مثل يوتيوب) ──
  var LS = window.LESSONS || [], box = document.getElementById('acBox');
  if (box && LS.length) {
    var list = LS.slice().reverse(), sel = 0, playing = false;
    var EN2 = function () { return document.documentElement.lang === 'en'; };
    var AR_RE = /[؀-ۿ]/;
    var DD = { ar: 'في هذا الدرس نتعلم خطوة جديدة في تصميم المستندات بأسلوب مبسّط وعملي.', en: 'In this lesson we learn a new step in document design, in a simple and practical way.' };
    // الوصف الإنجليزي: المترجم إن وُجد، أو الوصف الأصلي إن كان إنجليزياً أصلاً، وإلا النص الافتراضي
    var ld = function (l) { return EN2() ? (l.e || (l.d && !AR_RE.test(l.d) ? l.d : DD.en)) : (l.d || DD.ar); };
    // العنوان الإنجليزي (te) إن وُجد
    var lt = function (l) { return (EN2() && l.te) ? l.te : (l.t || ((EN2() ? 'Lesson ' : 'درس ') + l.n)); };
    var th = function (l, q) { return 'https://img.youtube.com/vi/' + l.id + '/' + q + '.jpg'; };
    var esc2 = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
    var PLAY = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
    var WA2 = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.03 2C6.5 2 2.03 6.48 2.03 12c0 1.77.46 3.42 1.26 4.9L2 22l5.27-1.27A9.96 9.96 0 0 0 12.03 22c5.51 0 9.99-4.48 9.99-10S17.54 2 12.03 2zm0 18.4c-1.61 0-3.23-.42-4.62-1.23l-.33-.2-2.94.89.94-2.86-.22-.34A8.35 8.35 0 0 1 3.64 12c0-4.63 3.77-8.4 8.39-8.4 4.63 0 8.4 3.77 8.4 8.4 0 4.62-3.77 8.4-8.4 8.4zm4.6-6.28c-.25-.13-1.49-.73-1.72-.82-.23-.08-.4-.13-.57.13-.17.25-.65.82-.8.99-.15.17-.29.19-.55.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.57-1.36-.78-1.86-.2-.49-.41-.42-.57-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.78 2.72 4.31 3.82.6.26 1.07.42 1.44.53.6.19 1.15.17 1.59.1.49-.07 1.49-.61 1.7-1.2.21-.59.21-1.09.15-1.2-.06-.1-.23-.17-.48-.29z"/></svg>';
    var LINK2 = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3 3 0 0 0 4.24 0l2-2a3 3 0 0 0-4.24-4.24l-.7.7M9.5 6.5a3 3 0 0 0-4.24 0l-2 2a3 3 0 0 0 4.24 4.24l.7-.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    box.innerHTML =
      '<div class="ac-main reveal"><div class="ac-player"></div><div class="ac-info"><h3 class="video-title ac-title"></h3><p class="ac-desc"></p><a class="ac-more" target="_blank" rel="noopener noreferrer" hidden></a>' +
      '<div class="ac-meta"><div class="rt"></div><span class="ac-views"></span><span class="ac-share"><button class="ac-sh wa" type="button" data-share="wa">' + WA2 + '<span class="sh-l"></span></button><button class="ac-sh" type="button" data-share="copy">' + LINK2 + '<span class="sh-l"></span></button></span>' +
      '<a class="ac-yt" target="_blank" rel="noopener noreferrer"><span data-translate="ac_watch">شاهد على يوتيوب</span></a></div></div></div>' +
      '<aside class="ac-side reveal reveal-delay-2"><div class="ac-side-in"><div class="ac-side-h" data-translate="ac_list">قائمة الدروس</div><div class="ac-list">' +
      list.map(function (l, i) {
        return '<button type="button" class="ac-item" data-i="' + i + '"><span class="ac-th"><img loading="lazy" decoding="async" src="' + th(l, 'mqdefault') + '" alt="" /><span class="ac-n">' + l.n + '</span></span>' +
          '<span class="ac-tx">' + (i === 0 ? '<span class="ac-new" data-translate="ac_newest">الأحدث</span>' : '') + '<b class="video-title"></b><small class="ac-ds"></small><span class="rt-ro" data-lr="l_' + l.id + '"></span></span></button>';
      }).join('') + '</div></div></aside>';

    // التعليقات: كتلة مستقلة تحت المشغّل والقائمة (تتبدّل مع الدرس المختار)
    var cmHost = document.createElement('div');
    cmHost.className = 'ac-cm';
    box.parentNode.insertBefore(cmHost, box.nextSibling);

    // يُظهر "عرض المزيد" فقط إذا كان الوصف أطول من سطرين
    var chkMore = function () {
      var d = box.querySelector('.ac-desc'), m = box.querySelector('.ac-more');
      if (!d || !m) return;
      m.hidden = !(d.scrollHeight > d.clientHeight + 1);
    };

    var paint = function () {
      var l = list[sel], p = box.querySelector('.ac-player');
      if (!playing) p.innerHTML = '<img loading="lazy" decoding="async" src="' + th(l, 'maxresdefault') + '" alt="' + esc2(lt(l)) + '" onload="if(this.naturalWidth<200)this.src=\'' + th(l, 'hqdefault') + '\'" /><button class="ac-play" type="button" aria-label="' + (EN2() ? 'Play' : 'تشغيل') + '">' + PLAY + '</button>';
      box.querySelector('.ac-title').textContent = lt(l);
      box.querySelector('.ac-desc').textContent = ld(l);
      box.querySelector('.ac-yt').href = 'https://youtu.be/' + l.id;
      var lurl = location.href.split('#')[0].split('?')[0] + '#lesson=' + l.id; // رابط مشاركة الدرس
      [].forEach.call(box.querySelectorAll('.ac-sh'), function (b) {
        b.setAttribute('data-url', lurl);
        b.setAttribute('data-text', (EN2() ? 'Watch this lesson from Mr Word: ' : 'شاهد هذا الدرس من Mr Word: ') + lt(l));
        b.setAttribute('data-type', 'lesson'); b.setAttribute('data-id', l.id);
        b.querySelector('.sh-l').textContent = b.getAttribute('data-share') === 'wa' ? (EN2() ? 'WhatsApp' : 'واتساب') : (EN2() ? 'Copy link' : 'نسخ الرابط');
      });
      var more = box.querySelector('.ac-more');
      more.href = 'https://youtu.be/' + l.id;
      more.textContent = EN2() ? 'Show more' : 'عرض المزيد';
      more.hidden = true;
      requestAnimationFrame(chkMore);
      if (window.MrRating) MrRating.mount(box.querySelector('.ac-meta .rt'), 'l_' + l.id);
      if (window.MrCount) MrCount.mount(box.querySelector('.ac-meta .ac-views'), 'l_' + l.id, 'v');
      if (window.MrComments) MrComments.mount(cmHost, 'l_' + l.id, { ar: 'تعليقات وأسئلة على الدرس', en: 'Lesson comments & questions' });
      [].forEach.call(box.querySelectorAll('.ac-item'), function (b, i) {
        var x = list[i];
        b.classList.toggle('on', i === sel);
        b.querySelector('.video-title').textContent = lt(x);
        b.querySelector('.ac-ds').textContent = ld(x);
        if (window.MrRating) MrRating.mount(b.querySelector('.rt-ro'), 'l_' + x.id, true);
      });
    };
    box.addEventListener('click', function (e) {
      var it = e.target.closest('.ac-item');
      if (it) {
        sel = +it.getAttribute('data-i'); playing = false; paint();
        if (window.innerWidth < 900) box.querySelector('.ac-main').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      if (e.target.closest('.ac-play')) {
        playing = true; var l = list[sel];
        if (window.MrCount) MrCount.hit('l_' + l.id); // مشاهدة جديدة (مرة لكل زائر كل 12 ساعة)
        var src = l.emb || ('https://www.youtube-nocookie.com/embed/' + l.id + '?rel=0');
        src += (src.indexOf('?') < 0 ? '?' : '&') + 'autoplay=1';
        box.querySelector('.ac-player').innerHTML = '<iframe src="' + esc2(src) + '" title="' + esc2(lt(l)) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
      }
    });
    paint();
    // فتح درس مباشرة من رابط مشاركة: #lesson=معرّف_الفيديو
    var openLesson = function () {
      var m = /^#lesson=([\w-]+)$/.exec(location.hash);
      if (!m) return;
      for (var i = 0; i < list.length; i++) if (list[i].id === m[1]) {
        sel = i; playing = false; paint();
        var go = function () { var a = document.getElementById('academy'); if (a) a.scrollIntoView({ behavior: 'auto', block: 'start' }); };
        if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
        break;
      }
    };
    openLesson();
    window.addEventListener('hashchange', openLesson);
    window.addEventListener('resize', chkMore);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(chkMore);
    new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  // ── بطاقات الأعمال (مروحة) تُرسم من works-data.js ──
  var WK = window.WORKS || [], wkGrid = document.getElementById('wkGrid');
  if (wkGrid && WK.length) {
    var ea = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
    var sheet = function (p) { return '<span class="wk-sheet" style="--img:url(\'' + ea(encodeURI(p).replace(/'/g, '%27')) + '\')"></span>'; };
    wkGrid.innerHTML = WK.map(function (w, i) {
      return '<article class="wk-card" data-full-img="' + ea(w.img) + '" style="--d:' + ((i % 3) * 0.1).toFixed(1) + 's" tabindex="0" role="button">' +
        '<span class="wk-badge">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' +
        '<div class="wk-cap" data-ar="' + ea(w.ar) + '" data-en="' + ea(w.en) + '"></div>' +
        '<div class="wk-desc" data-ar="' + ea(w.d || '') + '" data-en="' + ea(w.e || '') + '"></div>' +
        '<div class="wk-stack">' + [0, 1, 2, 3].map(function (k) { return sheet((w.imgs && w.imgs[k]) || w.img); }).join('') +
        '<span class="wk-art"><img class="wk-img" loading="lazy" decoding="async" src="' + ea(encodeURI(w.img)) + '" alt="" /></span></div></article>';
    }).join('');
    [].forEach.call(wkGrid.querySelectorAll('.wk-card'), function (c, i) {
      c.style.setProperty('--img', 'url("' + encodeURI(WK[i].img) + '")');
    });
    var wkLang = function () {
      var en = document.documentElement.lang === 'en';
      [].forEach.call(wkGrid.querySelectorAll('.wk-cap'), function (c) {
        c.textContent = c.getAttribute(en ? 'data-en' : 'data-ar');
        var label = (en ? 'Work sample: ' : 'نموذج عمل: ') + c.textContent, card = c.closest('.wk-card');
        card.setAttribute('aria-label', label);
        card.querySelector('.wk-img').alt = label;
        var ds = card.querySelector('.wk-desc'); if (ds) ds.textContent = ds.getAttribute(en ? 'data-en' : 'data-ar');
      });
    };
    wkLang();
    new MutationObserver(wkLang).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  // ── ظهور متدرج + معاينة ──
  var cards = [].slice.call(document.querySelectorAll('.wk-card'));
  if (!cards.length) return;
  var wio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); wio.unobserve(e.target); } });
  }, { threshold: 0.15 });
  cards.forEach(function (c) {
    wio.observe(c);
    var open = function () {
      if (window.openImagePreview) {
        var w = WK[cards.indexOf(c)] || {}, name = c.querySelector('.wk-cap').textContent.trim(), desc = (c.querySelector('.wk-desc') || {}).textContent || '';
        var gal = [c.getAttribute('data-full-img')].concat(w.imgs || []).map(function (p) { return { name: name, img: p, desc: desc }; });
        window.openImagePreview(gal, 0);
      }
    };
    c.addEventListener('click', open);
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
})();
