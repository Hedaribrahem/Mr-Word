/* الصفحة الرئيسية: يضيف رابط "المدونة" إلى القائمة، ويبني مقتطفاً بآخر 3 مقالات قبل قسم الاشتراك.
   يقرأ من blog-data.js (تُديره لوحة التحكم). */
(function () {
  var list = (window.BLOG || []).filter(function (a) { return !a.draft; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  if (!list.length) return;
  var EN = function () { return document.documentElement.lang === 'en'; };
  var L = { ar: { nav: 'المدونة', label: 'المدونة', title: 'أحدث المقالات', sub: 'نصائح عملية لتصميم مستندات أوضح وأقوى.', all: 'كل المقالات', min: 'د قراءة' },
            en: { nav: 'Blog', label: 'Blog', title: 'Latest articles', sub: 'Practical tips for clearer, stronger documents (articles are in Arabic).', all: 'All articles', min: 'min read' } };
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hue(s) { var h = 0; String(s || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 360; }); return h; }
  function mins(a) { return Math.max(1, Math.ceil(String(a.body || '').trim().split(/\s+/).length / 180)); }
  function date(d) { var m = String(d).match(/^(\d{4})-(\d\d)-(\d\d)/); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : ''; }

  var sec = document.getElementById('blog');
  if (!sec) {
    sec = document.createElement('section'); sec.id = 'blog';
    var at = document.getElementById('subscribe') || document.getElementById('cta');
    if (!at || !at.parentNode) return;
    at.parentNode.insertBefore(sec, at);
  }
  var links = [];
  [].forEach.call(document.querySelectorAll('.nav-links, #mobileMenu ul'), function (ul) {
    var li = document.createElement('li'), a = document.createElement('a'); a.href = 'blog.html';
    if (ul.closest('#mobileMenu')) a.setAttribute('onclick', 'closeMobileMenu()');
    li.appendChild(a); ul.appendChild(li); links.push(a);
  });
  function build() {
    var s = L[EN() ? 'en' : 'ar'];
    links.forEach(function (a) { a.textContent = s.nav; });
    sec.innerHTML = '<div class="section-header"><div><div class="section-label">' + s.label + '</div><h2 class="section-title">' + s.title + '</h2><p class="section-subtitle">' + s.sub + '</p></div></div>' +
      '<div class="bl-grid">' + list.slice(0, 3).map(function (a) {
        return '<a class="bl-card" href="blog/' + esc(a.slug) + '.html"><span class="bl-cov" style="--h:' + hue(a.cat) + '"><span>' + esc(a.cat) + '</span></span><span class="bl-cb"><b class="bl-ct">' + esc(a.title) + '</b><span class="bl-cd">' + esc(a.desc) + '</span><span class="bl-cm">' + esc(date(a.date)) + ' · ' + mins(a) + ' ' + s.min + '</span></span></a>';
      }).join('') + '</div><p class="bl-all"><a class="btn-outline" href="blog.html">' + s.all + '</a></p>';
  }
  build();
  new MutationObserver(build).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
