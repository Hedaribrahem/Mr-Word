/* سلايدر قبل/بعد: يقرأ ba-data.js. لا يظهر القسم إن لم توجد عناصر أو كان show=false. */
(function () {
  var D = window.BEFOREAFTER, sec = document.getElementById('beforeafter');
  if (!sec) return;
  var items = D && D.show !== false && (D.items || []).filter(function (x) { return x && x.b && x.a; });
  if (!items || !items.length) { sec.hidden = true; return; }
  var T = {
    ar: { label: 'قبل وبعد', title: 'شاهد الفرق بنفسك', sub: 'اسحب المؤشر لترى العرض قبل وبعد التصميم', b: 'قبل', a: 'بعد', slider: 'مؤشر المقارنة بين قبل وبعد', prev: 'السابق', next: 'التالي' },
    en: { label: 'Before & After', title: 'See the difference', sub: 'Drag the handle to compare the slide before and after our design', b: 'Before', a: 'After', slider: 'Before and after comparison slider', prev: 'Previous', next: 'Next' }
  };
  var cur = 0, pos = 50;
  var EN = function () { return document.documentElement.lang === 'en'; };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  var head, title, sub, label, stage, imgA, imgB, clip, handle, range, chB, chA, cap, ctitle, cdesc, nav, prev, next, dots = [];

  function build() {
    sec.hidden = false; sec.innerHTML = '';
    head = h('div', 'section-header'); var w = h('div');
    label = h('div', 'section-label'); title = h('h2', 'section-title'); sub = h('p', 'section-subtitle');
    w.appendChild(label); w.appendChild(title); w.appendChild(sub); head.appendChild(w); sec.appendChild(head);

    var wrap = h('div', 'ba-wrap');
    stage = h('div', 'ba-stage');
    imgA = h('img', 'ba-img'); imgA.decoding = 'async'; imgA.loading = 'lazy'; imgA.draggable = false;
    clip = h('div', 'ba-clip');
    imgB = h('img', 'ba-img'); imgB.decoding = 'async'; imgB.loading = 'lazy'; imgB.draggable = false;
    clip.appendChild(imgB);
    handle = h('div', 'ba-handle'); handle.appendChild(h('span', 'ba-knob', '‹ ›'));
    chB = h('span', 'ba-chip ba-chip-b'); chA = h('span', 'ba-chip ba-chip-a');
    range = h('input', 'ba-range'); range.type = 'range'; range.min = 0; range.max = 100; range.step = 1; range.value = 50;
    stage.appendChild(imgA); stage.appendChild(clip); stage.appendChild(handle); stage.appendChild(chB); stage.appendChild(chA); stage.appendChild(range);
    wrap.appendChild(stage);

    cap = h('div', 'ba-cap'); ctitle = h('b'); cdesc = h('span'); cap.appendChild(ctitle); cap.appendChild(cdesc); wrap.appendChild(cap);

    if (items.length > 1) {
      nav = h('div', 'ba-nav');
      prev = h('button', 'ba-arr', '‹'); prev.type = 'button';
      next = h('button', 'ba-arr', '›'); next.type = 'button';
      var ds = h('div', 'ba-dots');
      items.forEach(function (_, i) { var d = h('button', 'ba-dot'); d.type = 'button'; d.onclick = function () { go(i); }; dots.push(d); ds.appendChild(d); });
      nav.appendChild(prev); nav.appendChild(ds); nav.appendChild(next); wrap.appendChild(nav);
      prev.onclick = function () { go((cur - 1 + items.length) % items.length); };
      next.onclick = function () { go((cur + 1) % items.length); };
    }
    sec.appendChild(wrap);

    var drag = false;
    function setPos(p) { pos = Math.max(0, Math.min(100, p)); clip.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)'; handle.style.left = pos + '%'; range.value = Math.round(pos); }
    function fromEvt(e) { var r = stage.getBoundingClientRect(); setPos(((e.clientX - r.left) / r.width) * 100); }
    stage.addEventListener('pointerdown', function (e) { if (e.target === range) return; drag = true; stage.classList.add('drag'); try { stage.setPointerCapture(e.pointerId); } catch (x) {} fromEvt(e); });
    stage.addEventListener('pointermove', function (e) { if (drag) fromEvt(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { stage.addEventListener(n, function () { drag = false; stage.classList.remove('drag'); }); });
    range.addEventListener('input', function () { setPos(+range.value); });
    stage._set = setPos;
    paint();
  }
  function go(i) { cur = i; pos = 50; paint(); }
  function paint() {
    var t = T[EN() ? 'en' : 'ar'], x = items[cur];
    label.textContent = t.label; title.textContent = t.title; sub.textContent = t.sub;
    imgA.src = x.a; imgB.src = x.b; imgA.alt = t.a; imgB.alt = t.b;
    chB.textContent = t.b; chA.textContent = t.a; range.setAttribute('aria-label', t.slider);
    ctitle.textContent = (EN() && x.en) || x.ar || ''; cdesc.textContent = (EN() && x.e) || x.d || '';
    cap.hidden = !(ctitle.textContent || cdesc.textContent);
    if (nav) { prev.setAttribute('aria-label', t.prev); next.setAttribute('aria-label', t.next); dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); d.setAttribute('aria-label', (i + 1) + ''); }); }
    stage._set(pos);
  }
  build();
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
