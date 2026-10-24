window.RATING_CFG = {
  projectId: 'mr-word-dfead',
  apiKey: 'AIzaSyDLMwVex1MeZylTsGxrDrXBSf0-1A7FLHY',
  appId: '1:1054761668396:web:b480a7247e178b84d9e689',
  recaptchaSiteKey: '6LdVTf4tAAAAABFuiFpkPvaF9ATU-hvsKnGn4sfW',
  recaptchaType: 'enterprise',
  /* رابط Worker الذي يرسل إشعارات Telegram (انظر TELEGRAM-SETUP.md). اتركه فارغاً لتعطيل الإشعارات. */
  notifyUrl: 'https://morning-bush-a7f6.hedar-ibrahem1.workers.dev/'
};

/* Google Analytics (GA4): يُحمَّل في كل صفحة تستدعي هذا الملف، ولا يُحتسب العمل المحلي (localhost) */
(function () {
  var id = 'G-BB4Z76BWD1', h = location.hostname;
  if (!/^[\w-]+(\.[\w-]+)+$/.test(h) || /^\d+\.\d+\.\d+\.\d+$/.test(h)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id);
  /* نؤجّل تحميل مكتبة Analytics (≈155KB) حتى أول تفاعل أو 5 ثوانٍ بعد اكتمال الصفحة، لتسريع العرض الأول */
  var loaded = false, ev = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel', 'mousemove'];
  function load() {
    if (loaded) return; loaded = true;
    ev.forEach(function (e) { removeEventListener(e, load, true); });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
  }
  ev.forEach(function (e) { addEventListener(e, load, { capture: true, passive: true }); });
  var t = function () { setTimeout(load, 5000); };
  if (document.readyState === 'complete') t(); else addEventListener('load', t);
})();

/* تتبّع النقرات في Analytics: واتساب، خمسات، يوتيوب، التواصل الاجتماعي، وتحميل القوالب.
   window.mrTrack(اسم_الحدث, معاملات) آمنة دائماً؛ على localhost تطبع في الـ Console فقط للتجربة. */
(function () {
  var local = !/^[\w-]+(\.[\w-]+)+$/.test(location.hostname) || /^\d+\.\d+\.\d+\.\d+$/.test(location.hostname);
  window.mrTrack = function (name, params) {
    try {
      if (local) { if (window.console) console.log('[track]', name, params || {}); return; }
      if (window.gtag) window.gtag('event', name, params || {});
    } catch (e) {}
  };
  function where(a) {
    if (a.closest('.whatsapp-float')) return 'floating_button';
    if (a.closest('#navbar')) return 'navbar';
    if (a.closest('#mobileMenu')) return 'mobile_menu';
    if (a.closest('footer')) return 'footer';
    var s = a.closest('section[id]');
    return s ? s.id : 'other';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '', loc = where(a), m;
    if (/^https?:\/\/wa\.me\//i.test(h)) window.mrTrack('contact_click', { method: 'whatsapp', link_location: loc });
    else if (/^https?:\/\/(www\.)?khamsat\.com\//i.test(h)) window.mrTrack('contact_click', { method: 'khamsat', link_location: loc });
    else if (/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(h)) window.mrTrack('video_click', { link_location: loc, link_url: h.slice(0, 100) });
    else if ((m = h.match(/^https?:\/\/(www\.)?(facebook|instagram)\.com\//i))) window.mrTrack('social_click', { network: m[2].toLowerCase(), link_location: loc });
  }, true);
})();

/* المشاركة: أي زر فيه data-share="wa|copy" مع data-url و data-text يعمل تلقائياً (واتساب أو نسخ الرابط) ويُسجَّل في Analytics */
(function () {
  var en = function () { return document.documentElement.lang === 'en'; };
  function fallbackCopy(t, ok) {
    var a = document.createElement('textarea');
    a.value = t; a.setAttribute('readonly', '');
    a.style.cssText = 'position:fixed;top:0;inset-inline-start:0;opacity:0';
    document.body.appendChild(a); a.select();
    try { document.execCommand('copy'); ok(); } catch (e) {}
    document.body.removeChild(a);
  }
  function copy(t, ok) {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, function () { fallbackCopy(t, ok); });
    else fallbackCopy(t, ok);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-share]');
    if (!b) return;
    e.preventDefault();
    var kind = b.getAttribute('data-share'), url = b.getAttribute('data-url') || '', text = b.getAttribute('data-text') || '';
    if (!url) return;
    if (kind === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank', 'noopener');
    else copy(url, function () {
      var l = b.querySelector('.sh-l');
      if (!l) return;
      var o = l.textContent; l.textContent = en() ? 'Copied \u2713' : 'تم النسخ \u2713';
      setTimeout(function () { l.textContent = o; }, 1700);
    });
    if (window.mrTrack) window.mrTrack('share', { method: kind === 'wa' ? 'whatsapp' : 'copy_link', content_type: b.getAttribute('data-type') || '', item_id: b.getAttribute('data-id') || '' });
  });
})();
