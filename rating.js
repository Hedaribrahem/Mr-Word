/* Firebase (Firestore عبر REST): التقييم + العدّادات + التعليقات + App Check
   - مجموعة ratings: مستند لكل عنصر (t_اسم_القالب أو l_معرّف_الفيديو)
       sum و count = التقييم، و n = عدد التحميلات (قالب) أو المشاهدات (درس)
   - مجموعة comments: التعليقات، تُحفظ بحالة pending ولا تظهر إلا بعد موافقتك من لوحة التحكم
   - App Check: يعمل فقط إذا مُلئ appId و recaptchaSiteKey في rating-config.js */
(function () {
  var C = window.RATING_CFG || {}, ok = !!(C.projectId && C.apiKey);
  var EN = function () { return document.documentElement.lang === 'en'; };
  var DOC = ok ? 'projects/' + C.projectId + '/databases/(default)/documents' : '';
  var base = ok ? 'https://firestore.googleapis.com/v1/' + DOC : '';
  var KEY = ok ? 'key=' + encodeURIComponent(C.apiKey) : '';
  var JH = { 'Content-Type': 'application/json' };
  var sk = function (k) { return String(k).replace(/[^\w-]+/g, '-'); };
  var lsG = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var lsS = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var iv = function (x) { return +((x && (x.integerValue || x.doubleValue)) || 0); };
  var sv = function (x) { return (x && x.stringValue) || ''; };

  var store = {}, mine = lsG('mr_ratings', {}), done = lsG('mr_cnt', {}), els = [], cels = [], chosts = [];
  if (!ok) Object.keys(mine).forEach(function (k) { store[k] = { sum: mine[k], count: 1, n: 0 }; });

  /* ───────── App Check (عبر REST، بدون مكتبة Firebase) ───────── */
  var acOn = !!(ok && C.appId && C.recaptchaSiteKey), acEnt = C.recaptchaType === 'enterprise';
  var acTok = '', acExp = 0, acP = null, acRetry = 0, rcP = null;
  function rc() {
    if (rcP) return rcP;
    rcP = new Promise(function (res, rej) {
      var g = function () { return acEnt ? (window.grecaptcha && window.grecaptcha.enterprise) : window.grecaptcha; };
      var s = document.createElement('script');
      s.src = 'https://www.google.com/recaptcha/' + (acEnt ? 'enterprise' : 'api') + '.js?render=' + encodeURIComponent(C.recaptchaSiteKey);
      s.async = true;
      s.onload = function () { var x = g(); if (!x) return rej(); x.ready(function () { res(x); }); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
    rcP.catch(function () { rcP = null; });
    return rcP;
  }
  /* لا نحمّل reCAPTCHA (≈700KB) أثناء تحميل الصفحة: ننتظر أول تفاعل للزائر (لمس/تمرير/ضغط) أو 15 ثانية بعد اكتمال الصفحة */
  var rdyP = null;
  function ready() {
    if (rdyP) return rdyP;
    rdyP = new Promise(function (res) {
      var done = false, ev = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel', 'mousemove'];
      function go() { if (done) return; done = true; ev.forEach(function (e) { removeEventListener(e, go, true); }); res(); }
      ev.forEach(function (e) { addEventListener(e, go, { capture: true, passive: true }); });
      var t = function () { setTimeout(go, 15000); };
      if (document.readyState === 'complete') t(); else addEventListener('load', t);
    });
    return rdyP;
  }
  function appCheck() {
    if (!acOn || Date.now() < acRetry) return Promise.resolve('');
    if (acTok && Date.now() < acExp) return Promise.resolve(acTok);
    if (acP) return acP;
    acP = ready().then(rc).then(function (g) { return g.execute(C.recaptchaSiteKey, { action: 'app_check' }); })
      .then(function (t) {
        return fetch('https://firebaseappcheck.googleapis.com/v1/projects/' + C.projectId + '/apps/' + C.appId +
          ':' + (acEnt ? 'exchangeRecaptchaEnterpriseToken' : 'exchangeRecaptchaV3Token') + '?' + KEY, {
          method: 'POST', headers: JH,
          body: JSON.stringify(acEnt ? { recaptchaEnterpriseToken: t } : { recaptchaV3Token: t })
        });
      })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { acTok = j.token; acExp = Date.now() + Math.max(60, parseInt(j.ttl, 10) - 300) * 1000; acP = null; return acTok; })
      .catch(function () { acP = null; acRetry = Date.now() + 120000; return ''; });
    return acP;
  }
  /* fetch مع رمز App Check إن وُجد. إن فشل الطلب بسببه (CORS مثلاً) نعيده بدونه حتى لا يتعطل الموقع */
  function fx(url, opt) {
    opt = opt || {};
    return appCheck().then(function (t) {
      var h = Object.assign({}, opt.headers || {});
      if (t) h['X-Firebase-AppCheck'] = t;
      return fetch(url, Object.assign({}, opt, { headers: h })).catch(function (e) {
        if (!t) throw e;
        acRetry = Date.now() + 600000;
        delete h['X-Firebase-AppCheck'];
        return fetch(url, Object.assign({}, opt, { headers: h }));
      });
    });
  }
  /* إشعار Telegram: يُرسل نوع الحدث فقط (بدون أي بيانات شخصية) إلى Worker يحفظ مفتاح البوت. يفشل بصمت دائماً. */
  function notify(type, v) {
    var u = C.notifyUrl;
    if (!u || !/^https:\/\//.test(u)) return;
    try { fetch(u, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ type: type, v: v || '' }), keepalive: true }).catch(function () {}); } catch (e) {}
  }
  function commit(writes) {
    return fx(base + ':commit?' + KEY, { method: 'POST', headers: JH, body: JSON.stringify({ writes: writes }) });
  }
  function listAll(col, each, tok) {
    return fx(base + '/' + col + '?pageSize=300&' + KEY + (tok ? '&pageToken=' + encodeURIComponent(tok) : ''))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        (j.documents || []).forEach(each);
        if (j.nextPageToken) return listAll(col, each, j.nextPageToken);
      });
  }

  /* ───────── التخزين المؤقت (لتقليل قراءات Firestore: الحصة المجانية 50 ألف قراءة يومياً) ───────── */
  var CK = 'mr_fs_cache', CTTL = 20 * 60 * 1000, cacheT = 0;
  function saveCache() { lsS(CK, { t: cacheT, d: store }); }

  /* ───────── التقييم ───────── */
  function paint(el) {
    var k = el.getAttribute('data-rk'); if (!k) return;
    var s = store[k] || { sum: 0, count: 0 }, n = s.count, a = n ? s.sum / n : 0, m = mine[k] || 0;
    var ss = el.querySelectorAll('.rt-s');
    for (var i = 0; i < 5; i++) ss[i].style.setProperty('--f', Math.round(Math.max(0, Math.min(1, a - i)) * 100) + '%');
    var t = el.querySelector('.rt-t');
    if (el.classList.contains('rt-ro')) t.textContent = n ? a.toFixed(1) + ' (' + n + ')' : '';
    else t.textContent = n
      ? a.toFixed(1) + ' · ' + n + (EN() ? ' ratings' : ' تقييم') + (m ? (EN() ? ' · yours: ' : ' · تقييمك: ') + m : '')
      : (EN() ? 'Be the first to rate' : 'كن أول من يقيّم');
  }
  var CICON = {
    d: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v8M4.5 7 8 10.5 11.5 7M3 13.5h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    v: '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>'
  };
  function paintCnt(el) {
    var k = el.getAttribute('data-ck'); if (!k) return;
    var n = (store[k] && store[k].n) || 0, kind = el.getAttribute('data-ct') || 'd';
    el.hidden = !n;
    if (!n) return;
    el.querySelector('.ct-n').textContent = n.toLocaleString('en-US');
    el.setAttribute('title', n.toLocaleString('en-US') + ' ' + (kind === 'v' ? (EN() ? 'views' : 'مشاهدة') : (EN() ? 'downloads' : 'تحميل')));
  }
  function paintAll() { els.forEach(paint); cels.forEach(paintCnt); }
  var dataCbs = [];
  function fireData() { dataCbs.forEach(function (f) { try { f(); } catch (e) {} }); } // عند وصول بيانات التقييمات والعدّادات (لا عند كل ضغطة)

  function mount(el, key, ro) {
    if (!el) return;
    el.setAttribute('data-rk', sk(key));
    if (!el.getAttribute('data-m')) {
      el.setAttribute('data-m', '1'); el.classList.add('rt'); if (ro) el.classList.add('rt-ro');
      el.innerHTML = '<span class="rt-stars">' + [1, 2, 3, 4, 5].map(function (i) {
        return '<button type="button" class="rt-s" data-v="' + i + '" aria-label="' + i + '/5">★</button>';
      }).join('') + '</span><span class="rt-t"></span>';
      if (!ro) {
        el.addEventListener('click', function (e) {
          var b = e.target.closest('.rt-s'); if (b) vote(el.getAttribute('data-rk'), +b.getAttribute('data-v'));
        });
        el.addEventListener('mouseover', function (e) {
          var b = e.target.closest('.rt-s'); if (!b) return;
          [].forEach.call(el.querySelectorAll('.rt-s'), function (x) { x.classList.toggle('hov', +x.getAttribute('data-v') <= +b.getAttribute('data-v')); });
        });
        el.addEventListener('mouseleave', function () {
          [].forEach.call(el.querySelectorAll('.rt-s'), function (x) { x.classList.remove('hov'); });
        });
      }
      els.push(el);
    }
    paint(el);
  }

  function vote(k, v) {
    var old = mine[k] || 0; mine[k] = v;
    lsS('mr_ratings', mine);
    var s = store[k] || (store[k] = { sum: 0, count: 0, n: 0 });
    if (old) s.sum += v - old; else { s.sum += v; s.count++; }
    paintAll(); saveCache();
    if (!ok) return;
    commit([{ transform: { document: DOC + '/ratings/' + k, fieldTransforms: [
      { fieldPath: 'sum', increment: { integerValue: String(old ? v - old : v) } },
      { fieldPath: 'count', increment: { integerValue: old ? '0' : '1' } }
    ] } }]).catch(function () {});
  }

  /* ───────── العدّادات: تحميلات القوالب ومشاهدات الدروس (مرة لكل زائر لكل عنصر كل 12 ساعة) ───────── */
  function mountCount(el, key, kind) {
    if (!el) return;
    el.setAttribute('data-ck', sk(key)); el.setAttribute('data-ct', kind || 'd');
    if (!el.getAttribute('data-m')) {
      el.setAttribute('data-m', '1'); el.classList.add('ct'); el.hidden = true;
      el.innerHTML = CICON[kind === 'v' ? 'v' : 'd'] + '<span class="ct-n"></span>';
      cels.push(el);
    }
    paintCnt(el);
  }
  function hit(key) {
    var k = sk(key), now = Date.now();
    if (done[k] && now - done[k] < 12 * 3600 * 1000) return;
    done[k] = now; lsS('mr_cnt', done);
    var s = store[k] || (store[k] = { sum: 0, count: 0, n: 0 });
    s.n = (s.n || 0) + 1;
    paintAll(); saveCache();
    if (!ok) return;
    commit([{ transform: { document: DOC + '/ratings/' + k, fieldTransforms: [
      { fieldPath: 'n', increment: { integerValue: '1' } }
    ] } }]).catch(function () {});
  }

  /* ───────── التعليقات (تظهر بعد موافقة المشرف) ───────── */
  var ccache = {};
  var CS = {
    ar: {
      title: 'التعليقات والأسئلة', name: 'اسمك', text: 'اكتب تعليقك أو سؤالك هنا…', send: 'إرسال',
      empty: 'لا توجد تعليقات بعد. كن أول من يعلّق!', ok: 'شكراً لك! وصل تعليقك وسيظهر بعد مراجعته.',
      wait: 'انتظر قليلاً قبل إرسال تعليق آخر.', limit: 'وصلت إلى الحد اليومي من التعليقات، جرّب غداً.',
      bad: 'اكتب اسماً (حرفان على الأقل) وتعليقاً (3 أحرف على الأقل).', fail: 'تعذّر الإرسال، حاول لاحقاً.',
      loadf: 'تعذّر تحميل التعليقات.', loading: 'جارٍ التحميل…', note: 'تظهر التعليقات بعد موافقة المشرف.', reply: 'رد Mr Word',
      legal: 'هذا الموقع محمي بـ reCAPTCHA وتنطبق عليه <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">سياسة الخصوصية</a> و<a href="https://policies.google.com/terms" target="_blank" rel="noopener">شروط الخدمة</a> من Google.'
    },
    en: {
      title: 'Comments & questions', name: 'Your name', text: 'Write your comment or question here…', send: 'Send',
      empty: 'No comments yet. Be the first to comment!', ok: 'Thank you! Your comment was received and will appear after review.',
      wait: 'Please wait a moment before sending another comment.', limit: 'You reached the daily comment limit, try again tomorrow.',
      bad: 'Enter a name (2+ characters) and a comment (3+ characters).', fail: 'Could not send, please try again later.',
      loadf: 'Could not load comments.', loading: 'Loading…', note: 'Comments appear after the admin approves them.', reply: 'Mr Word replied',
      legal: 'This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener">Terms of Service</a> apply.'
    }
  };
  var CT = function () { return CS[EN() ? 'en' : 'ar']; };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function fetchComments(k, lim) {
    var body = { structuredQuery: { from: [{ collectionId: 'comments' }], where: { compositeFilter: { op: 'AND', filters: [
      { fieldFilter: { field: { fieldPath: 'k' }, op: 'EQUAL', value: { stringValue: k } } },
      { fieldFilter: { field: { fieldPath: 's' }, op: 'EQUAL', value: { stringValue: 'approved' } } }
    ] } }, limit: lim || 100 } };
    return fx(base + ':runQuery?' + KEY, { method: 'POST', headers: JH, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!Array.isArray(rows)) throw 0;
        return rows.filter(function (r) { return r.document; }).map(function (r) {
          var f = r.document.fields || {};
          return { n: sv(f.n), t: sv(f.t), r: sv(f.r), g: iv(f.g), c: f.c && f.c.timestampValue ? Date.parse(f.c.timestampValue) : 0 };
        }).sort(function (a, b) { return b.c - a.c; });
      });
  }
  function postComment(k, name, text) {
    var id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    return commit([{
      update: { name: DOC + '/comments/' + id, fields: { k: { stringValue: k }, n: { stringValue: name }, t: { stringValue: text }, s: { stringValue: 'pending' } } },
      updateTransforms: [{ fieldPath: 'c', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists: false }
    }]).then(function (r) { if (!r.ok) throw 0; });
  }

  function buildC(host) {
    host.classList.add('cm'); host.innerHTML = '';
    var hd = h('div', 'cm-h'); hd.appendChild(h('b', 'cm-title')); hd.appendChild(h('span', 'cm-count'));
    var f = h('form', 'cm-form'); f.noValidate = true;
    var nm = h('input', 'cm-name'); nm.type = 'text'; nm.maxLength = 40; nm.autocomplete = 'name';
    var hp = h('input', 'cm-hp'); hp.type = 'text'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true');
    var tx = h('textarea', 'cm-text'); tx.rows = 3; tx.maxLength = 600;
    var row = h('div', 'cm-row'), note = h('span', 'cm-note'), btn = h('button', 'cm-send'); btn.type = 'submit';
    row.appendChild(note); row.appendChild(btn);
    var msg = h('div', 'cm-msg'); msg.setAttribute('role', 'status');
    var lg = h('div', 'cm-legal'); lg.hidden = !acOn;
    [nm, hp, tx, row, msg, lg].forEach(function (e) { f.appendChild(e); });
    host.appendChild(hd); host.appendChild(f); host.appendChild(h('div', 'cm-list'));
    if (host.classList.contains('ac-cm')) {
      host.classList.add('cm-fold');
      hd.tabIndex = 0; hd.setAttribute('role', 'button'); hd.setAttribute('aria-expanded', host.classList.contains('open') ? 'true' : 'false');
      var tg = function () { var o = host.classList.toggle('open'); hd.setAttribute('aria-expanded', o ? 'true' : 'false'); };
      hd.addEventListener('click', tg);
      hd.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(); } });
    }
    nm.value = lsG('mr_cm_name', '');
    f.addEventListener('submit', function (e) { e.preventDefault(); submitC(host); });
  }
  function cmLang(host) {
    if (!host._b) return;
    var s = CT(), o = host._o || {};
    host.querySelector('.cm-title').textContent = (EN() ? o.en : o.ar) || s.title;
    host.querySelector('.cm-name').placeholder = s.name;
    host.querySelector('.cm-name').setAttribute('aria-label', s.name);
    host.querySelector('.cm-text').placeholder = s.text;
    host.querySelector('.cm-text').setAttribute('aria-label', s.text);
    host.querySelector('.cm-send').textContent = s.send;
    host.querySelector('.cm-note').textContent = s.note;
    host.querySelector('.cm-legal').innerHTML = s.legal;
    renderC(host);
  }
  function renderC(host) {
    var s = CT(), L = host.querySelector('.cm-list'), d = host._d;
    L.innerHTML = '';
    host.querySelector('.cm-count').textContent = d && d.length ? '(' + d.length + ')' : '';
    if (host._st === 'loading') { L.appendChild(h('div', 'cm-empty', s.loading)); return; }
    if (host._st === 'err') { L.appendChild(h('div', 'cm-empty', s.loadf)); return; }
    if (!d || !d.length) { L.appendChild(h('div', 'cm-empty', s.empty)); return; }
    d.forEach(function (c) {
      var it = h('div', 'cm-i'), top = h('div', 'cm-top');
      top.appendChild(h('span', 'cm-av', (c.n || '?').trim().charAt(0).toUpperCase()));
      top.appendChild(h('b', 'cm-n', c.n));
      if (c.c) top.appendChild(h('time', 'cm-d', new Date(c.c).toLocaleDateString(EN() ? 'en-GB' : 'ar', { year: 'numeric', month: 'short', day: 'numeric' })));
      it.appendChild(top); it.appendChild(h('p', 'cm-t', c.t));
      if (c.r) { var r = h('div', 'cm-r'); r.appendChild(h('b', '', s.reply)); r.appendChild(h('p', '', c.r)); it.appendChild(r); }
      L.appendChild(it);
    });
  }
  function loadC(host, key) {
    host._k = key; host._d = null; host._st = 'loading';
    var c = ccache[key];
    if (c && Date.now() - c.t < 5 * 60 * 1000) { host._d = c.d; host._st = 'ok'; renderC(host); return; }
    renderC(host);
    fetchComments(key).then(function (d) {
      ccache[key] = { t: Date.now(), d: d };
      if (host._k !== key) return;
      host._d = d; host._st = 'ok'; renderC(host);
    }).catch(function () {
      if (host._k !== key) return;
      host._st = 'err'; renderC(host);
    });
  }
  function submitC(host) {
    var s = CT(), msg = host.querySelector('.cm-msg'), btn = host.querySelector('.cm-send');
    var nm = host.querySelector('.cm-name'), tx = host.querySelector('.cm-text'), hp = host.querySelector('.cm-hp');
    var name = nm.value.replace(/\s+/g, ' ').trim(), text = tx.value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    msg.className = 'cm-msg';
    if (hp.value) { msg.textContent = s.ok; msg.classList.add('ok'); tx.value = ''; return; } // فخّ للبوتات: يتظاهر بالنجاح
    if (name.length < 2 || text.length < 3) { msg.textContent = s.bad; msg.classList.add('err'); return; }
    var now = Date.now(), ts = lsG('mr_cm_t', []).filter(function (t) { return now - t < 864e5; });
    if (ts.length >= 5) { msg.textContent = s.limit; msg.classList.add('err'); return; }
    if (ts.length && now - ts[ts.length - 1] < 30000) { msg.textContent = s.wait; msg.classList.add('err'); return; }
    btn.disabled = true; msg.textContent = '…';
    postComment(host._k, name, text).then(function () {
      notify('comment');
      ts.push(now); lsS('mr_cm_t', ts); lsS('mr_cm_name', name);
      tx.value = ''; msg.textContent = s.ok; msg.classList.add('ok');
    }).catch(function () {
      msg.textContent = s.fail; msg.classList.add('err');
    }).then(function () { btn.disabled = false; });
  }
  function mountComments(host, key, opts) {
    if (!host) return;
    if (!ok) { host.hidden = true; return; }
    key = sk(key); host._o = opts || {};
    if (!host._b) { buildC(host); host._b = 1; chosts.push(host); }
    cmLang(host);
    if (host._k !== key) loadC(host, key);
  }

  /* ───────── التحميل الأولي ───────── */
  function boot() {
    if (!ok) return;
    var c = lsG(CK, null), fresh = false;
    if (c && c.d) {
      Object.keys(c.d).forEach(function (k) { store[k] = c.d[k]; });
      cacheT = c.t || 0; paintAll(); fireData();
      fresh = Date.now() - cacheT < CTTL;
    }
    if (fresh) return;
    var next = {};
    listAll('ratings', function (d) {
      var f = d.fields || {};
      next[d.name.split('/').pop()] = { sum: iv(f.sum), count: iv(f.count), n: iv(f.n) };
    }).then(function () { store = next; cacheT = Date.now(); saveCache(); paintAll(); fireData(); }).catch(function () {});
  }
  if (acOn && document.readyState !== 'complete') window.addEventListener('load', function () { setTimeout(boot, 200); });
  else if (acOn) setTimeout(boot, 200);
  else boot();

  new MutationObserver(function () { paintAll(); chosts.forEach(cmLang); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.MrRating = { mount: mount };
  window.MrCount = { mount: mountCount, hit: hit };
  window.MrComments = { mount: mountComments };
  window.MrFS = { ok: ok, commit: commit, doc: DOC, fetchComments: fetchComments, notify: notify }; // للنماذج الأخرى (طلب الخدمة)
  window.MrStats = { // قراءة التقييم والتحميلات لأي عنصر (للفرز)
    get: function (key) { var s = store[sk(key)] || { sum: 0, count: 0, n: 0 }; return { sum: s.sum || 0, count: s.count || 0, n: s.n || 0, avg: s.count ? s.sum / s.count : 0 }; },
    onData: function (f) { dataCbs.push(f); }
  };
})();
