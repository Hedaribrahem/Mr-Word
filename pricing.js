/* أسعار تقريبية للخدمات: تُقرأ من pricing-data.js وتُدار من لوحة التحكم (تبويب الأسعار).
   تظهر داخل بطاقة كل خدمة (البطاقة 1..6 = s1..s6) وملاحظة عامة تحت الشبكة.
   لا يظهر شيء إن كان "show" خطأ أو لم يُكتب سعر. */
(function () {
  var P = window.PRICING, old = document.getElementById('pricing'); if (old) old.hidden = true;
  var grid = document.querySelector('#services .services-grid');
  if (!grid || !P || !P.show) return;
  var map = {};
  (P.items || []).forEach(function (x) { if (x && x.id && x.p && String(x.p).trim()) map[x.id] = x; });
  if (!Object.keys(map).length) return;
  var EN = function () { return document.documentElement.lang === 'en'; };
  var FROM = { ar: 'السعر', en: 'Price' };
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function build() {
    var en = EN();
    [].forEach.call(document.querySelectorAll('#services .svc-price, #services .pc-foot'), function (e) { e.remove(); });
    [].forEach.call(grid.querySelectorAll('.service-card'), function (card, i) {
      var x = map['s' + (i + 1)]; if (!x) return;
      var box = h('div', 'svc-price');
      box.appendChild(h('b', '', (en && x.pe) || x.p));
      var d = (en && x.de) || x.d; if (d) box.appendChild(h('small', '', d));
      var link = card.querySelector('.service-link');
      if (link) card.insertBefore(box, link); else card.appendChild(box);
    });
    var n = (en && P.noteE) || P.note;
    if (n) grid.parentNode.insertBefore(h('p', 'pc-foot', n), grid.nextSibling);
  }
  build();
  new MutationObserver(build).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
