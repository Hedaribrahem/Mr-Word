/* تحسين الأداء بدون تغيير الشكل: إيقاف الحركات المستمرة خارج الشاشة. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  // 1) حركات CSS المستمرة (الكرات المتوهجة، الشارات العائمة، الشريط المتحرك)
  var els = [].slice.call(document.querySelectorAll('#home, #cta, .ticker, [class*="ticker-wrap"], .floating-badge'));
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('pz', !e.isIntersecting); });
  }, { rootMargin: '120px' });
  els.forEach(function (e) { io.observe(e); });
  // 2) شريط الآراء المتحرك (JS): نستعمل نفس آلية "إيقاف عند مرور الفأرة" الموجودة فيه
  var wrap = document.getElementById('testiWrap');
  if (wrap) {
    new IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting;
      wrap.dispatchEvent(new MouseEvent(vis ? 'mouseleave' : 'mouseenter'));
    }, { rootMargin: '80px' }).observe(wrap);
  }
})();
