/* شريط تمرير عائم: يُخفي الشريط الأصلي (الموقع بكامل عرض الشاشة) ويُظهر مؤشراً رفيعاً يطفو فوق المحتوى أثناء التمرير فقط */
(function () {
  var css = document.createElement('style');
  css.textContent =
    'html{scrollbar-width:none!important;-ms-overflow-style:none}' +
    'html::-webkit-scrollbar,body::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}' +
    '#fsb{position:fixed;top:0;right:3px;width:5px;height:0;z-index:99999;border-radius:99px;pointer-events:none;' +
    'background:#0871FA;box-shadow:0 0 0 1px rgba(255,255,255,.25);opacity:0;transition:opacity .35s ease}' +
    '#fsb.on{opacity:.85}';
  document.head.appendChild(css);

  var bar = document.createElement('div');
  bar.id = 'fsb';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var t, tick = false;
  function update() {
    tick = false;
    var de = document.documentElement;
    var vh = window.innerHeight, total = Math.max(de.scrollHeight, document.body.scrollHeight);
    if (total <= vh + 1) { bar.classList.remove('on'); return; }
    var h = Math.max(48, (vh / total) * vh);
    var y = (window.scrollY / (total - vh)) * (vh - h);
    bar.style.height = h + 'px';
    bar.style.transform = 'translateY(' + y + 'px)';
    bar.classList.add('on');
    clearTimeout(t);
    t = setTimeout(function () { bar.classList.remove('on'); }, 900);
  }
  window.addEventListener('scroll', function () {
    if (!tick) { tick = true; requestAnimationFrame(update); }
  }, { passive: true });
})();
