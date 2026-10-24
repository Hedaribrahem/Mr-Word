/* أزرار عائمة: واتساب (موجود في الصفحة) + زر "اطلب عرض سعر". يظهران ويختفيان معاً:
   يظهران بعد تجاوز أول الصفحة، ويختفيان عند نموذج الطلب وفي أسفل الصفحة. التسمية تنبثق لحظة أول ظهور ثم تختفي. */
(function () {
  var rq = document.getElementById('request'); if (!rq) return;
  var wa = document.getElementById('whatsappFloat');
  var a = document.createElement('a'); a.className = 'sticky-cta fab-off'; a.href = '#request';
  a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg><span class="sc-label"></span>';
  var lb = a.querySelector('.sc-label');
  var EN = function () { return document.documentElement.lang === 'en'; };
  function txt() { var t = EN() ? 'Get a quote' : 'اطلب عرض سعر'; lb.textContent = t; a.setAttribute('aria-label', t); }
  txt(); document.body.appendChild(a);
  if (wa) wa.classList.add('fab-off');
  new MutationObserver(txt).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  var shown = false, popped = false, tick = false, pt;
  function pop() {
    if (popped) return; popped = true;
    a.classList.add('pop'); if (wa) wa.classList.add('pop');
    pt = setTimeout(function () { a.classList.remove('pop'); if (wa) wa.classList.remove('pop'); }, 3500);
  }
  function upd() {
    tick = false;
    var vh = window.innerHeight, r = rq.getBoundingClientRect();
    var inReq = r.top < vh * 0.75 && r.bottom > vh * 0.25;
    var ft = document.querySelector('footer'), nearEnd = ft && ft.getBoundingClientRect().top < vh;
    var on = window.scrollY > vh * 0.9 && !inReq && !nearEnd;
    if (on === shown) return; shown = on;
    a.classList.toggle('fab-off', !on); if (wa) wa.classList.toggle('fab-off', !on);
    if (on) pop();
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); upd();
})();
