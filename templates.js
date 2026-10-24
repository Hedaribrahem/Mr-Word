(function () {
  var T = window.TEMPLATES || [];
  var latestList = T.filter(function (t) { return !t.bonus; }).slice(-6).reverse();
  var fullList = T.slice().reverse();
  var curList = [], curIdx = 0, viewList = fullList;
  var EN = function () { return document.documentElement.lang === 'en'; };
  var DD = { ar: 'قالب مستند احترافي بتصميم عصري وقابل للتعديل بالكامل.', en: 'A modern, fully editable professional document template.' };
  function descOf(t) { return EN() ? (t.e || DD.en) : (t.d || DD.ar); }
  function escH(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  var DL_ICON = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4.5 7 8 10.5 11.5 7M3 13.5h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ZOOM_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.5 2H14v4.5M6.5 14H2V9.5M14 2 9.5 6.5M2 14l4.5-4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var WA_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.03 2C6.5 2 2.03 6.48 2.03 12c0 1.77.46 3.42 1.26 4.9L2 22l5.27-1.27A9.96 9.96 0 0 0 12.03 22c5.51 0 9.99-4.48 9.99-10S17.54 2 12.03 2zm0 18.4c-1.61 0-3.23-.42-4.62-1.23l-.33-.2-2.94.89.94-2.86-.22-.34A8.35 8.35 0 0 1 3.64 12c0-4.63 3.77-8.4 8.39-8.4 4.63 0 8.4 3.77 8.4 8.4 0 4.62-3.77 8.4-8.4 8.4zm4.6-6.28c-.25-.13-1.49-.73-1.72-.82-.23-.08-.4-.13-.57.13-.17.25-.65.82-.8.99-.15.17-.29.19-.55.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.57-1.36-.78-1.86-.2-.49-.41-.42-.57-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.13.17 1.78 2.72 4.31 3.82.6.26 1.07.42 1.44.53.6.19 1.15.17 1.59.1.49-.07 1.49-.61 1.7-1.2.21-.59.21-1.09.15-1.2-.06-.1-.23-.17-.48-.29z"/></svg>';
  var LINK_ICON = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3 3 0 0 0 4.24 0l2-2a3 3 0 0 0-4.24-4.24l-.7.7M9.5 6.5a3 3 0 0 0-4.24 0l-2 2a3 3 0 0 0 4.24 4.24l.7-.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CM_ICON = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  // بطاقة زجاجية موحّدة (الرئيسية + صفحة النماذج)
  function tlCard(t, isNew) {
    var num = (t.name.match(/\d+/) || [''])[0];
    var hs = t.imgs && t.imgs.length;
    var sheets = hs ? '<span class="tl-sheets" aria-hidden="true">' + [0, 1, 2, 3].map(function (k) {
      var p = t.imgs[k] || t.img;
      return '<span class="tl-sheet" style="--img:url(\'' + escH(encodeURI(p).replace(/'/g, '%27')) + '\')"></span>';
    }).join('') + '</span>' : '';
    var im = '<img loading="lazy" decoding="async" src="' + encodeURI(t.img) + '" alt="قالب Word جاهز رقم ' + num + '" />';
    return '<article class="tl-card' + (hs ? ' has-s' : '') + '" data-i="' + T.indexOf(t) + '" tabindex="0" role="button" aria-label="معاينة ' + t.name + '">' +
      sheets + (hs ? '<span class="tl-clip">' + im + '</span>' : im) +
      (isNew ? '<span class="tl-badge" data-translate="new_badge">جديد</span>' : '') +
      '<span class="tl-zoom" aria-hidden="true">' + ZOOM_ICON + '</span>' +
      '<div class="tl-glass"><div class="tl-info"><span class="tl-name">' + t.name + '</span><span class="tl-desc">' + escH(descOf(t)) + '</span><span class="tl-meta"><span class="rt-ro" data-rt="t_' + escH(t.name) + '"></span><span class="ct-d" data-cd="t_' + escH(t.name) + '"></span></span></div>' +
      '<a href="' + t.url + '" target="_blank" rel="noreferrer noopener" class="tl-dl">' + DL_ICON + '<span data-translate="download">تحميل</span></a></div></article>';
  }

  // ── معاينة كبيرة للصورة + تنقّل + تعليقات ──
  var lb, lastFocus, touchX = null;
  var CHEV = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 4.5 13 10l-5.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'tpl-lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<button class="tpl-lb-close" type="button" aria-label="إغلاق"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4 4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
      '<button class="tpl-lb-nav tpl-lb-prev" type="button" aria-label="السابق">' + CHEV + '</button>' +
      '<button class="tpl-lb-nav tpl-lb-next" type="button" aria-label="التالي">' + CHEV + '</button>' +
      '<figure class="tpl-lb-fig"><img alt="" /><figcaption><div class="tpl-lb-left"><div class="tpl-lb-meta"><span class="tpl-lb-name"></span><span class="tpl-lb-count"></span></div><p class="tpl-lb-desc"></p>' +
      '<div class="tpl-lb-line"><div class="tpl-lb-rt rt"></div><span class="tpl-lb-ct"></span><button class="tpl-lb-cmb" type="button" aria-expanded="false">' + CM_ICON + '<span class="tpl-lb-cmt"></span></button>' +
      '<button class="tpl-lb-sh wa" type="button" data-share="wa">' + WA_ICON + '<span class="sh-l"></span></button><button class="tpl-lb-sh" type="button" data-share="copy">' + LINK_ICON + '<span class="sh-l"></span></button></div></div>' +
      '<a class="tl-dl" target="_blank" rel="noreferrer noopener">' + DL_ICON + '<span class="tpl-lb-dl"></span></a></figcaption></figure>' +
      '<div class="tpl-lb-cm" role="region"><button class="tpl-lb-cmx" type="button" aria-label="إغلاق التعليقات"><svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4 4 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><div class="tpl-lb-cmh"></div></div>';
    document.body.appendChild(lb);
    lb.addEventListener('click', function (e) {
      if (e.target.closest('.tl-dl') || e.target.closest('.tpl-lb-nav') || e.target.closest('.tpl-lb-line') || e.target.closest('.tpl-lb-cm')) return;
      closePreview();
    });
    lb.querySelector('.tpl-lb-prev').addEventListener('click', function () { step(-1); });
    lb.querySelector('.tpl-lb-next').addEventListener('click', function () { step(1); });
    lb.querySelector('.tpl-lb-cmb').addEventListener('click', function () { toggleCm(); });
    lb.querySelector('.tpl-lb-cmx').addEventListener('click', function () { setCm(false); });
    lb.addEventListener('touchstart', function (e) { touchX = e.target.closest('.tpl-lb-cm') ? null : e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 50) step((dx > 0) === isRTL() ? 1 : -1);
    }, { passive: true });
  }
  function pageUrl(f) { return new URL(f, location.href.split('#')[0].split('?')[0]).href; }
  function isRTL() { return document.documentElement.dir === 'rtl'; }
  function curT() { var t = curList[curIdx]; return t && t.bonus !== undefined ? t : null; }
  function loadCm() {
    var t = curT(); if (!t || !window.MrComments) return;
    MrComments.mount(lb.querySelector('.tpl-lb-cmh'), 't_' + t.name, { ar: 'تعليقات على ' + t.name, en: 'Comments on ' + t.name });
  }
  function setCm(open) {
    lb.classList.toggle('cm-open', open);
    lb.querySelector('.tpl-lb-cmb').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) loadCm();
  }
  function toggleCm() { setCm(!lb.classList.contains('cm-open')); }
  function show() {
    var t = curList[curIdx], img = lb.querySelector('.tpl-lb-fig img');
    img.classList.add('loading');
    img.onload = function () { img.classList.remove('loading'); };
    img.src = encodeURI(t.img); img.alt = t.name;
    lb.querySelector('.tpl-lb-name').textContent = t.name;
    lb.querySelector('.tpl-lb-count').textContent = (curIdx + 1) + ' / ' + curList.length;
    var isT = t.bonus !== undefined, ds = isT ? descOf(t) : (t.desc || ''), dEl = lb.querySelector('.tpl-lb-desc'), line = lb.querySelector('.tpl-lb-line');
    dEl.textContent = ds; dEl.style.display = ds ? '' : 'none';
    line.style.display = isT ? '' : 'none';
    if (isT && window.MrRating) MrRating.mount(lb.querySelector('.tpl-lb-rt'), 't_' + t.name);
    if (isT && window.MrCount) MrCount.mount(lb.querySelector('.tpl-lb-ct'), 't_' + t.name, 'd');
    var cmb = lb.querySelector('.tpl-lb-cmb');
    cmb.style.display = (isT && window.MrComments) ? '' : 'none';
    lb.querySelector('.tpl-lb-cmt').textContent = EN() ? 'Comments' : 'التعليقات';
    if (isT) { // روابط المشاركة (واتساب + نسخ الرابط)
      var su = pageUrl('templates.html') + '#t=' + encodeURIComponent(t.name);
      var stx = (EN() ? 'Download this Word template from Mr Word:' : 'حمّل هذا القالب من Mr Word:') + ' ' + t.name;
      [].forEach.call(lb.querySelectorAll('.tpl-lb-sh'), function (b) {
        b.setAttribute('data-url', su); b.setAttribute('data-text', stx); b.setAttribute('data-type', 'template'); b.setAttribute('data-id', t.name);
        b.querySelector('.sh-l').textContent = b.getAttribute('data-share') === 'wa' ? (EN() ? 'WhatsApp' : 'واتساب') : (EN() ? 'Copy link' : 'نسخ الرابط');
      });
    }
    lb.querySelector('.tpl-lb-cmx').setAttribute('aria-label', EN() ? 'Close comments' : 'إغلاق التعليقات');
    if (!isT) lb.classList.remove('cm-open'); else if (lb.classList.contains('cm-open')) loadCm();
    var dl = lb.querySelector('.tl-dl'); dl.style.display = t.url ? '' : 'none'; if (t.url) dl.href = t.url;
    lb.querySelector('.tpl-lb-dl').textContent = EN() ? 'Download' : 'تحميل';
    lb.querySelector('.tpl-lb-close').setAttribute('aria-label', EN() ? 'Close' : 'إغلاق');
    lb.querySelector('.tpl-lb-prev').setAttribute('aria-label', EN() ? 'Previous' : 'السابق');
    lb.querySelector('.tpl-lb-next').setAttribute('aria-label', EN() ? 'Next' : 'التالي');
    lb.classList.toggle('single', curList.length < 2);
    [1, -1].forEach(function (d) { new Image().src = encodeURI(curList[(curIdx + d + curList.length) % curList.length].img); });
  }
  function step(d) {
    if (curList.length < 2) return;
    curIdx = (curIdx + d + curList.length) % curList.length;
    show();
  }
  function openPreview(list, idx) {
    if (!lb) buildLightbox();
    lastFocus = document.activeElement;
    curList = list; curIdx = idx;
    show();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.tpl-lb-close').focus();
  }
  function closePreview() {
    if (!lb || !lb.classList.contains('open')) return;
    lb.classList.remove('open', 'cm-open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openFromCard(c) {
    var t0 = T[+c.getAttribute('data-i')];
    if (t0 && t0.imgs && t0.imgs.length) { // قالب له شرائح: المعاينة تعرض شرائحه
      openPreview([t0.img].concat(t0.imgs).map(function (p) { return Object.assign({}, t0, { img: p }); }), 0);
      return;
    }
    var list = c.closest('#tlLatest') ? latestList : viewList;
    var idx = list.indexOf(T[+c.getAttribute('data-i')]);
    openPreview(list, Math.max(0, idx));
  }
  document.addEventListener('keydown', function (e) {
    if (lb && lb.classList.contains('open')) {
      // أثناء الكتابة في التعليقات: لا تنتقل الصفحات ولا تُغلق المعاينة (Esc يغلق لوحة التعليقات فقط)
      if (e.target.closest && e.target.closest('.tpl-lb-cm')) { if (e.key === 'Escape') setCm(false); return; }
      if (e.key === 'Escape') { if (lb.classList.contains('cm-open')) setCm(false); else closePreview(); }
      else if (e.key === 'ArrowRight') step(isRTL() ? -1 : 1);
      else if (e.key === 'ArrowLeft') step(isRTL() ? 1 : -1);
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('tl-card')) {
      e.preventDefault(); openFromCard(e.target);
    }
  });
  document.addEventListener('click', function (e) {
    var dl = e.target.closest('.tl-dl');
    if (dl && window.MrCount) { // عدّاد التحميلات (من البطاقة أو من نافذة المعاينة)
      var card = dl.closest('.tl-card'), tt = card ? T[+card.getAttribute('data-i')] : (lb && lb.contains(dl) ? curT() : null);
      if (tt && tt.name) MrCount.hit('t_' + tt.name);
    }
    if (dl && window.mrTrack) { // تتبّع Analytics لتحميل القالب
      var c0 = dl.closest('.tl-card'), t0 = c0 ? T[+c0.getAttribute('data-i')] : (lb && lb.contains(dl) ? curT() : null);
      if (t0 && t0.name) window.mrTrack('template_download', { template_name: t0.name, link_location: c0 ? (c0.closest('#tlLatest') ? 'home_latest' : 'templates_page') : 'preview' });
    }
    var c = e.target.closest('.tl-card');
    if (!c || dl) return;
    openFromCard(c);
  });

  window.openImagePreview = openPreview; // معاينة عامة: openImagePreview([{name,img,url?}], index)

  // ── الصفحة الرئيسية: خط زمني لآخر 6 قوالب ──
  var tl = document.getElementById('tlLatest');
  if (tl) {
    var latest = latestList;
    var fill = tl.querySelector('.tl-line-fill');
    latest.forEach(function (t, i) {
      var row = document.createElement('div');
      row.className = 'tl-row';
      row.innerHTML = '<div class="tl-item ' + (i % 2 === 0 ? 'start' : 'end') + '">' + tlCard(t, i === 0) + '</div><span class="tl-dot"></span>';
      tl.appendChild(row);
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.25 });
    tl.querySelectorAll('.tl-row').forEach(function (r) { io.observe(r); });
    var ticking = false;
    var progress = function () {
      ticking = false;
      var r = tl.getBoundingClientRect(), vh = window.innerHeight;
      fill.style.transform = 'scaleY(' + Math.min(1, Math.max(0, (vh * 0.65 - r.top) / r.height)) + ')';
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(progress); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    progress();
  }

  // ── صفحة النماذج: شبكة بنفس البطاقة (الأحدث أولاً) ──
  var grid = document.getElementById('templatesGrid');
  if (grid) {
    grid.innerHTML = fullList.map(function (t, i) {
      return '<div class="tpl-cell" style="--d:' + ((i % 3) * 90) + 'ms">' + tlCard(t, false) + '</div>';
    }).join('');
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); } });
    }, { threshold: 0.12 });
    grid.querySelectorAll('.tpl-cell').forEach(function (c) { io2.observe(c); });
    initTools(grid);
  }


  // ── صفحة النماذج: بحث + تصنيف + ترتيب (الأحدث / الأكثر تحميلاً / الأعلى تقييماً) ──
  function norm(s) { return String(s || '').toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim(); }
  function initTools(grid) {
  var SEARCH_ICON = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="5.5" stroke="currentColor" stroke-width="1.8"/><path d="m13.5 13.5 3.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    var cells = [].slice.call(grid.children);
    var items = fullList.map(function (t, i) { return { t: t, el: cells[i], pos: fullList.length - i, h: norm([t.name, t.d, t.e].join(' ')) }; });
    var cats = {};
    fullList.forEach(function (t) { var k = t.d || ''; (cats[k] = cats[k] || { ar: t.d || '', en: t.e || t.d || '', n: 0 }).n++; });
    var catKeys = Object.keys(cats).sort(function (a, b) { return cats[b].n - cats[a].n; });
    var st = { q: '', cat: null, sort: 'new' };
    var bar = document.createElement('div');
    bar.className = 'tpl-bar';
    bar.innerHTML = '<div class="tpl-top"><label class="tpl-search">' + SEARCH_ICON + '<input type="search" class="tpl-q" autocomplete="off" /></label>' +
      '<label class="tpl-sort"><span class="tpl-sort-l"></span><select class="tpl-sel"><option value="new"></option><option value="dl"></option><option value="rate"></option></select></label></div>' +
      '<div class="tpl-chips" role="group"></div><div class="tpl-count" aria-live="polite"></div>';
    var empty = document.createElement('div');
    empty.className = 'tpl-empty'; empty.hidden = true;
    empty.innerHTML = '<p></p><button type="button" class="tpl-chip"></button>';
    grid.parentNode.insertBefore(bar, grid);
    grid.parentNode.insertBefore(empty, grid.nextSibling);
    var q = bar.querySelector('.tpl-q'), sel = bar.querySelector('.tpl-sel'), chips = bar.querySelector('.tpl-chips'), cnt = bar.querySelector('.tpl-count');

    function stat(t) { return window.MrStats ? MrStats.get('t_' + t.name) : { n: 0, count: 0, sum: 0 }; }
    function rscore(s) { return s.count ? (12 + s.sum) / (3 + s.count) : 0; } // متوسط مرجّح كي لا يتصدّر قالب بتقييم واحد
    function labels() {
      var en = EN();
      q.placeholder = en ? 'Search templates…' : 'ابحث عن قالب…';
      q.setAttribute('aria-label', q.placeholder);
      bar.querySelector('.tpl-sort-l').textContent = en ? 'Sort by' : 'ترتيب حسب';
      var os = sel.options;
      os[0].textContent = en ? 'Newest' : 'الأحدث';
      os[1].textContent = en ? 'Most downloaded' : 'الأكثر تحميلاً';
      os[2].textContent = en ? 'Top rated' : 'الأعلى تقييماً';
      chips.innerHTML = '';
      var mk = function (key, label, n) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'tpl-chip'; b.setAttribute('data-c', key === null ? '' : key);
        b.setAttribute('aria-pressed', st.cat === key ? 'true' : 'false');
        b.innerHTML = '<bdi></bdi><small>' + n + '</small>'; b.firstChild.textContent = label;
        chips.appendChild(b);
      };
      mk(null, en ? 'All' : 'الكل', items.length);
      catKeys.forEach(function (k) { mk(k, en ? cats[k].en : cats[k].ar, cats[k].n); });
      empty.firstChild.textContent = en ? 'No templates match your search.' : 'لا توجد قوالب مطابقة لبحثك.';
      empty.lastChild.textContent = en ? 'Clear filters' : 'مسح الفلاتر';
    }
    function apply() {
      var nq = norm(st.q), s = {};
      items.forEach(function (it) { s[it.t.name] = stat(it.t); });
      var vis = items.filter(function (it) { return (st.cat === null || (it.t.d || '') === st.cat) && (!nq || it.h.indexOf(nq) > -1); });
      vis.sort(function (a, b) {
        var sa = s[a.t.name], sb = s[b.t.name];
        if (st.sort === 'dl') return (sb.n - sa.n) || (b.pos - a.pos);
        if (st.sort === 'rate') return (rscore(sb) - rscore(sa)) || (sb.count - sa.count) || (b.pos - a.pos);
        return b.pos - a.pos;
      });
      items.forEach(function (it) { it.el.hidden = vis.indexOf(it) < 0; });
      vis.forEach(function (it) { grid.appendChild(it.el); });
      viewList = vis.length ? vis.map(function (it) { return it.t; }) : fullList;
      cnt.textContent = EN() ? 'Showing ' + vis.length + ' of ' + items.length + ' templates' : 'عرض ' + vis.length + ' من ' + items.length + ' قالب';
      empty.hidden = vis.length > 0;
      [].forEach.call(chips.children, function (b) { b.setAttribute('aria-pressed', (st.cat === null ? '' : st.cat) === b.getAttribute('data-c') ? 'true' : 'false'); });
    }
    var qTimer;
    q.addEventListener('input', function () {
      st.q = q.value; apply();
      clearTimeout(qTimer);
      qTimer = setTimeout(function () { if (norm(st.q).length > 1 && window.mrTrack) window.mrTrack('search', { search_term: st.q.slice(0, 50), search_area: 'templates' }); }, 1200);
    });
    sel.addEventListener('change', function () { st.sort = sel.value; apply(); if (window.mrTrack) window.mrTrack('templates_sort', { sort_by: st.sort }); });
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.tpl-chip'); if (!b) return;
      var k = b.getAttribute('data-c'); st.cat = k === '' ? null : k; apply();
      if (window.mrTrack && st.cat !== null) window.mrTrack('templates_filter', { category: cats[st.cat].en });
    });
    empty.lastChild.addEventListener('click', function () { st.q = ''; st.cat = null; q.value = ''; apply(); });
    labels(); apply();
    if (window.MrStats) MrStats.onData(apply);
    new MutationObserver(function () { labels(); apply(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  function mountAll() {
    [].forEach.call(document.querySelectorAll('.rt-ro[data-rt]'), function (el) { if (window.MrRating) MrRating.mount(el, el.getAttribute('data-rt'), true); });
    [].forEach.call(document.querySelectorAll('.ct-d[data-cd]'), function (el) { if (window.MrCount) MrCount.mount(el, el.getAttribute('data-cd'), 'd'); });
  }
  function relang() { [].forEach.call(document.querySelectorAll('.tl-card'), function (c) { var d = c.querySelector('.tl-desc'); if (d) d.textContent = descOf(T[+c.getAttribute('data-i')]); }); }
  // فتح قالب مباشرة من رابط مشاركة: templates.html#t=اسم_القالب
  function openFromHash() {
    var m = /^#t=(.+)$/.exec(location.hash), n;
    if (!m) return;
    try { n = decodeURIComponent(m[1]); } catch (e) { return; }
    var t = T.filter(function (x) { return x.name === n; })[0];
    if (!t) return;
    if (t.imgs && t.imgs.length) openPreview([t.img].concat(t.imgs).map(function (p) { return Object.assign({}, t, { img: p }); }), 0);
    else openPreview(fullList, Math.max(0, fullList.indexOf(t)));
  }
  mountAll(); relang();
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
  new MutationObserver(relang).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
