/* آراء زوار الموقع: نموذج "شاركنا رأيك" يُحفظ في Firestore (مجموعة comments بمفتاح r_site وحالة pending)
   وتظهر الآراء المعتمدة فقط تحت شريط الآراء بعد موافقتك من لوحة التحكم ← تبويب التعليقات.
   يعتمد على rating.js (window.MrFS) وعلى <div id="siteReviews"> داخل قسم #testimonials. */
(function () {
  var host = document.getElementById('siteReviews');
  var FS = window.MrFS;
  if (!host || !FS || !FS.ok) return;
  var KEY = 'r_site', PAGE = 6;
  var EN = function () { return document.documentElement.lang === 'en'; };
  var S = {
    ar: {
      title: 'آراء زوار الموقع', sub: 'جرّبت خدماتنا أو قوالبنا أو دروسنا؟ شاركنا رأيك، ويظهر بعد مراجعته.',
      add: 'أضف رأيك', cancel: 'إغلاق', name: 'اسمك', text: 'اكتب رأيك بصدق…', rate: 'تقييمك', send: 'إرسال الرأي',
      more: 'إظهار المزيد', empty: 'كن أول من يشارك رأيه هنا.', reviews: 'رأي',
      eName: 'اكتب اسماً (حرفان على الأقل).', eRate: 'اختر عدد النجوم.', eText: 'اكتب رأياً من 10 أحرف على الأقل.',
      wait: 'انتظر لحظة ثم أعد المحاولة.', limit: 'وصلت إلى الحد اليومي، جرّب غداً.', fail: 'تعذّر الإرسال الآن، حاول لاحقاً.',
      ok: 'شكراً لك! وصل رأيك وسيظهر بعد مراجعته.', star: 'نجوم', reply: 'رد Mr Word'
    },
    en: {
      title: 'Visitor reviews', sub: 'Tried our services, templates or lessons? Share your opinion. It appears after review.',
      add: 'Add your review', cancel: 'Close', name: 'Your name', text: 'Write your honest opinion…', rate: 'Your rating', send: 'Send review',
      more: 'Show more', empty: 'Be the first to share your opinion here.', reviews: 'reviews',
      eName: 'Enter a name (2+ characters).', eRate: 'Choose a star rating.', eText: 'Write at least 10 characters.',
      wait: 'Please wait a moment and try again.', limit: "You've reached the daily limit, try again tomorrow.", fail: "Couldn't send right now, try again later.",
      ok: 'Thank you! Your review was received and will appear after review.', star: 'stars', reply: 'Mr Word replied'
    }
  };
  var L = function () { return EN() ? S.en : S.ar; };
  var lsG = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var lsS = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function stars(n) { var s = ''; for (var i = 1; i <= 5; i++) s += i <= n ? '★' : '☆'; return s; }

  var data = null, shown = PAGE, formOpen = false, loaded = false, grade = 0, justSent = false, t0 = Date.now();

  /* ───────── الرسم ───────── */
  function render() {
    var s = L(), keep = null;
    if (formOpen) { // نحافظ على ما كتبه الزائر عند تبديل اللغة
      var f0 = host.querySelector('.rv-form');
      if (f0) keep = { n: f0.elements.n.value, d: f0.elements.d.value };
    }
    host.innerHTML = '';
    var wrap = h('div', 'rv-wrap');
    var hd = h('div', 'rv-head');
    var tt = h('div', 'rv-tt');
    tt.appendChild(h('h3', 'rv-title', s.title));
    tt.appendChild(h('p', 'rv-sub', s.sub));
    hd.appendChild(tt);
    var side = h('div', 'rv-side');
    if (data && data.length) {
      var sum = 0, n = 0; data.forEach(function (d) { if (d.g) { sum += d.g; n++; } });
      if (n) {
        var av = h('div', 'rv-avg');
        av.appendChild(h('b', '', (sum / n).toFixed(1)));
        av.appendChild(h('span', 'rv-avs', stars(Math.round(sum / n))));
        av.appendChild(h('small', '', '(' + data.length + ' ' + s.reviews + ')'));
        side.appendChild(av);
      }
    }
    var btn = h('button', 'btn-outline rv-open', formOpen ? s.cancel : s.add); btn.type = 'button';
    btn.setAttribute('aria-expanded', formOpen ? 'true' : 'false');
    btn.addEventListener('click', function () { formOpen = !formOpen; justSent = false; render(); });
    side.appendChild(btn);
    hd.appendChild(side);
    wrap.appendChild(hd);

    if (formOpen) wrap.appendChild(buildForm(keep));

    if (data && data.length) {
      var grid = h('div', 'rv-grid');
      data.slice(0, shown).forEach(function (d) {
        var c = h('article', 'rv-card');
        var top = h('div', 'rv-top');
        top.appendChild(h('span', 'rv-av', (d.n || '?').trim().charAt(0).toUpperCase()));
        var nm = h('div', 'rv-nm'); nm.appendChild(h('b', '', d.n));
        if (d.c) nm.appendChild(h('time', '', new Date(d.c).toLocaleDateString(EN() ? 'en-GB' : 'ar', { year: 'numeric', month: 'short' })));
        top.appendChild(nm);
        c.appendChild(top);
        if (d.g) { var st = h('div', 'rv-stars', stars(d.g)); st.setAttribute('role', 'img'); st.setAttribute('aria-label', d.g + ' ' + s.star); c.appendChild(st); }
        c.appendChild(h('p', 'rv-tx', d.t));
        if (d.r) { var r = h('div', 'rv-rp'); r.appendChild(h('b', '', s.reply)); r.appendChild(h('p', '', d.r)); c.appendChild(r); }
        grid.appendChild(c);
      });
      wrap.appendChild(grid);
      if (data.length > shown) {
        var m = h('button', 'btn-outline rv-more', s.more); m.type = 'button';
        m.addEventListener('click', function () { shown += PAGE; render(); });
        wrap.appendChild(m);
      }
    } else if (loaded && !formOpen) {
      wrap.appendChild(h('p', 'rv-empty', s.empty));
    }
    host.appendChild(wrap);
  }

  function buildForm(keep) {
    var s = L();
    var f = h('form', 'cm rv-form'); f.noValidate = true;
    var row = h('div', 'rq-row');
    var l1 = h('label', 'rq-f'); l1.appendChild(h('span', '', s.name));
    var n = h('input', 'cm-name'); n.name = 'n'; n.maxLength = 40; n.autocomplete = 'name'; l1.appendChild(n);
    var l2 = h('div', 'rq-f'); l2.appendChild(h('span', '', s.rate));
    var sg = h('div', 'rv-pick'); sg.setAttribute('role', 'radiogroup'); sg.setAttribute('aria-label', s.rate);
    for (var i = 1; i <= 5; i++) (function (i) {
      var b = h('button', 'rv-st' + (i <= grade ? ' on' : ''), '★'); b.type = 'button';
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', i === grade ? 'true' : 'false');
      b.setAttribute('aria-label', i + ' ' + s.star);
      b.addEventListener('click', function () {
        grade = i;
        [].forEach.call(sg.children, function (x, j) { x.classList.toggle('on', j < i); x.setAttribute('aria-checked', j === i - 1 ? 'true' : 'false'); });
      });
      sg.appendChild(b);
    })(i);
    l2.appendChild(sg);
    row.appendChild(l1); row.appendChild(l2);
    var l3 = h('label', 'rq-f'); l3.appendChild(h('span', '', s.text));
    var d = h('textarea', 'cm-text'); d.name = 'd'; d.rows = 4; d.maxLength = 600; l3.appendChild(d);
    var hp = h('input', 'cm-hp'); hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true');
    var act = h('div', 'rq-act');
    var send = h('button', 'cm-send', s.send); send.type = 'submit';
    var msg = h('span', 'cm-msg'); msg.setAttribute('role', 'status');
    act.appendChild(send); act.appendChild(msg);
    [row, l3, hp, act].forEach(function (e) { f.appendChild(e); });
    n.value = keep ? keep.n : lsG('mr_cm_name', '');
    if (keep) d.value = keep.d;
    if (justSent) { msg.textContent = s.ok; msg.className = 'cm-msg ok'; }
    f.addEventListener('submit', function (e) { e.preventDefault(); submit(f, msg, send); });
    return f;
  }

  function submit(f, msg, btn) {
    var s = L(), say = function (t, c) { msg.textContent = t; msg.className = 'cm-msg' + (c ? ' ' + c : ''); };
    var name = f.elements.n.value.replace(/\s+/g, ' ').trim();
    var text = f.elements.d.value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (f.elements.website.value) { say(s.ok, 'ok'); return; } // فخ الروبوتات
    if (name.length < 2) return say(s.eName, 'err');
    if (!grade) return say(s.eRate, 'err');
    if (text.length < 10) return say(s.eText, 'err');
    if (Date.now() - t0 < 3000) return say(s.wait, 'err');
    var now = Date.now(), ts = lsG('mr_rv_t', []).filter(function (t) { return now - t < 864e5; });
    if (ts.length >= 2) return say(s.limit, 'err');
    var id = 'c' + now.toString(36) + Math.random().toString(36).slice(2, 10);
    btn.disabled = true; say('…');
    FS.commit([{
      update: { name: FS.doc + '/comments/' + id, fields: {
        k: { stringValue: KEY }, n: { stringValue: name }, t: { stringValue: text },
        g: { integerValue: String(grade) }, s: { stringValue: 'pending' } } },
      updateTransforms: [{ fieldPath: 'c', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists: false }
    }]).then(function (r) {
      if (!r.ok) throw 0;
      try { localStorage.removeItem('mr_rv_cache'); } catch (e) {}
      ts.push(now); lsS('mr_rv_t', ts); lsS('mr_cm_name', name);
      if (window.mrTrack) window.mrTrack('generate_lead', { method: 'site_review' });
      FS.notify('review');
      grade = 0; justSent = true; t0 = Date.now(); render();
    }).catch(function () { btn.disabled = false; say(s.fail, 'err'); });
  }

  /* ───────── التحميل: عند اقتراب القسم من الشاشة فقط، مع تخزين مؤقت 10 دقائق (لتوفير قراءات Firestore) ───────── */
  var CK = 'mr_rv_cache', TTL = 10 * 60 * 1000;
  function load() {
    var c = lsG(CK, null);
    if (c && c.d && c.d.length && Date.now() - c.t < TTL) { data = c.d; loaded = true; render(); return; }
    FS.fetchComments(KEY, 40).then(function (d) {
      data = d; loaded = true; lsS(CK, { t: Date.now(), d: d }); render();
    }).catch(function () { loaded = true; render(); });
  }
  render();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load(); }
    }, { rootMargin: '400px' });
    io.observe(host);
  } else load();
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
