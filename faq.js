/* الأسئلة الشائعة: تُقرأ من faq-data.js وتُدار من لوحة التحكم (تبويب الأسئلة).
   يُبنى القسم داخل <section id="faq"></section> في index.html ويتبدّل مع اللغة. */
(function () {
  var sec = document.getElementById('faq');
  if (!sec) return;
  var EN = function () { return document.documentElement.lang === 'en'; };
  var T = {
    ar: { label: 'أسئلة شائعة', title: 'أجوبة على ما يسألنا عنه العملاء', sub: 'لم تجد جوابك؟ اطلب عبر النموذج أو راسلنا على واتساب.' },
    en: { label: 'FAQ', title: 'Answers to what clients ask us', sub: "Didn't find your answer? Use the request form or message us on WhatsApp." }
  };
  var FAQ = window.FAQ || [];
  if (!FAQ.length) { sec.hidden = true; return; }
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  var WA = '963935919037', cur = 0, mOpen = -1;
  var CTA = {
    ar: { ask: 'اطلب عبر النموذج', wa: 'اسأل على واتساب', more: 'لم تجد جوابك؟' },
    en: { ask: 'Request via form', wa: 'Ask on WhatsApp', more: "Didn't find your answer?" }
  };
  function txt(f, en, k) { return (en && f[k + 'e']) || f[k]; }
  function build() {
    var en = EN(), s = T[en ? 'en' : 'ar'], c = CTA[en ? 'en' : 'ar'];
    if (cur >= FAQ.length) cur = 0;
    sec.innerHTML = '';
    var hd = h('div', 'section-header'), inner = h('div');
    inner.appendChild(h('div', 'section-label', s.label));
    inner.appendChild(h('h2', 'section-title', s.title));
    inner.appendChild(h('p', 'section-subtitle', s.sub));
    hd.appendChild(inner); sec.appendChild(hd);

    /* الحاسوب: قائمة أسئلة + لوحة جواب واحدة */
    var wrap = h('div', 'fq-wrap');
    var nav = h('div', 'fq-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-orientation', 'vertical');
    var panel = h('div', 'fq-panel'); panel.setAttribute('role', 'tabpanel');
    var tabs = [];
    function show(i, focus) {
      cur = i;
      tabs.forEach(function (t, j) { t.classList.toggle('on', j === i); t.setAttribute('aria-selected', j === i ? 'true' : 'false'); t.tabIndex = j === i ? 0 : -1; });
      if (focus) tabs[i].focus();
      var f = FAQ[i];
      panel.innerHTML = '';
      panel.classList.remove('in'); void panel.offsetWidth; panel.classList.add('in');
      panel.appendChild(h('div', 'fq-n', String(i + 1).padStart(2, '0')));
      panel.appendChild(h('h3', 'fq-pq', txt(f, en, 'q')));
      panel.appendChild(h('p', 'fq-pa', txt(f, en, 'a')));
      var act = h('div', 'fq-act');
      var b1 = h('a', 'btn-primary fq-btn', c.ask); b1.href = '#request';
      var b2 = h('a', 'btn-outline fq-btn', c.wa); b2.href = 'https://wa.me/' + WA; b2.target = '_blank'; b2.rel = 'noopener';
      act.appendChild(b1); act.appendChild(b2); panel.appendChild(act);
      panel.setAttribute('aria-labelledby', 'fq-t' + i);
    }
    FAQ.forEach(function (f, i) {
      var t = h('button', 'fq-t'); t.type = 'button'; t.id = 'fq-t' + i; t.setAttribute('role', 'tab');
      t.appendChild(h('span', 'fq-tn', String(i + 1)));
      t.appendChild(h('span', 'fq-tq', txt(f, en, 'q')));
      t.addEventListener('click', function () { show(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, d = k === 'ArrowDown' || k === 'ArrowRight' && !en || k === 'ArrowLeft' && en ? 1 : k === 'ArrowUp' || k === 'ArrowLeft' && !en || k === 'ArrowRight' && en ? -1 : 0;
        if (!d) return; e.preventDefault(); show((i + d + FAQ.length) % FAQ.length, true);
      });
      nav.appendChild(t); tabs.push(t);
    });
    wrap.appendChild(nav); wrap.appendChild(panel); sec.appendChild(wrap);
    show(cur);

    /* الجوال: أكورديون مدمج يفتح سؤالاً واحداً فقط */
    var acc = h('div', 'fq-acc');
    FAQ.forEach(function (f, i) {
      var d = h('details', 'fq-i'); if (i === mOpen) d.open = true;
      d.appendChild(h('summary', 'fq-q', txt(f, en, 'q')));
      d.appendChild(h('p', 'fq-a', txt(f, en, 'a')));
      d.addEventListener('toggle', function () {
        if (d.open) { mOpen = i; [].forEach.call(acc.children, function (x) { if (x !== d) x.open = false; }); }
        else if (mOpen === i) mOpen = -1;
      });
      acc.appendChild(d);
    });
    sec.appendChild(acc);
  }
  build();
  new MutationObserver(build).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
