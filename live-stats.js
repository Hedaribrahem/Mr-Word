/* عدّادات حيّة في شريط الأرقام: إجمالي تحميلات القوالب ومشاهدات الدروس من Firestore (عبر MrStats).
   لا تظهر أي خانة إلا إذا بلغ رقمها الحد الأدنى (SITE.stats.liveMin، الافتراضي 50) حتى لا تُظهر أرقاماً صغيرة. */
(function () {
  var grid = document.querySelector('#stats .strip-grid');
  if (!grid || !window.MrStats) return;
  var ST = (window.SITE && window.SITE.stats) || {}, MIN = +ST.liveMin || 50;
  var EN = function () { return document.documentElement.lang === 'en'; };
  var defs = [
    { id: 'dl', ar: 'تحميل للقوالب', en: 'template downloads', total: function () { var s = 0; (window.TEMPLATES || []).forEach(function (t) { s += MrStats.get('t_' + t.name).n; }); return s; } },
    { id: 'vw', ar: 'مشاهدة للدروس', en: 'lesson views', total: function () { var s = 0; (window.LESSONS || []).forEach(function (l) { s += MrStats.get('l_' + l.id).n; }); return s; } }
  ];
  var els = {}, shown = {}, io = null;
  function item(d) {
    var w = document.createElement('div'); w.className = 'strip-item';
    var n = document.createElement('span'); n.className = 'strip-num'; n.textContent = '0';
    var l = document.createElement('span'); l.className = 'strip-label';
    w.appendChild(n); w.appendChild(l); w.hidden = true; grid.appendChild(w);
    return { w: w, n: n, l: l, v: 0, done: false };
  }
  function fmt(v) { return '+' + Math.floor(v).toLocaleString(EN() ? 'en-US' : 'en-US'); }
  function anim(e) {
    var to = e.v, t0 = null, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { e.n.textContent = fmt(to); return; }
    (function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / 1800);
      e.n.textContent = fmt(p < 1 ? to * (1 - Math.pow(1 - p, 4)) : to);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  function paint() {
    var cnt = 0;
    defs.forEach(function (d) {
      var e = els[d.id] || (els[d.id] = item(d)), v = d.total();
      e.l.textContent = EN() ? d.en : d.ar;
      if (v < MIN) { e.w.hidden = true; return; }
      var first = e.w.hidden; e.v = v; e.w.hidden = false; cnt++;
      if (!e.done) {
        e.n.textContent = '+0';
        if (!io) io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { io.unobserve(x.target); var k = x.target._e; k.done = true; anim(k); } }); }, { threshold: 0.6 });
        e.w._e = e; io.observe(e.w);
      } else e.n.textContent = fmt(v);
    });
    var last = null;
    defs.forEach(function (d) { var e = els[d.id]; if (e) { e.w.classList.remove('ls-last'); if (!e.w.hidden) last = e; } });
    if (last && (4 + cnt) % 2 === 1) last.w.classList.add('ls-last');
    grid.classList.toggle('has-live', !!cnt);
    grid.setAttribute('data-n', String(4 + cnt));
  }
  MrStats.onData(paint); paint();
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
