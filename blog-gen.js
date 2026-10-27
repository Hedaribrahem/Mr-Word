/* مولّد صفحات المدونة. تستخدمه لوحة التحكم عند الحفظ لتوليد:
   - blog/اسم-المقال.html لكل مقال منشور (صفحة ثابتة يفهرسها Google)
   - blog.html (قائمة المقالات)
   - تحديث sitemap.xml
   صيغة كتابة المقال (بسيطة): فقرات تفصلها سطر فارغ، ## عنوان، ### عنوان فرعي، - للقوائم، 1. للقوائم المرقمة،
   > لمربع نصيحة، **غامق**، [نص الرابط](https://...) أو [نص](templates.html) */
(function (root) {
  var SITE = 'https://mr-word.net/';
  var WA = '963935919037';
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ───── تحويل الصيغة المبسطة إلى HTML (يُهرَّب النص أولاً فلا يمكن حقن HTML) ───── */
  function inline(t) {
    t = esc(t);
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|[A-Za-z0-9_\/.-]+(?:#[\w-]+)?)\)/g, function (m, a, u) {
      var ext = /^https?:/.test(u);
      return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + a + '</a>';
    });
    return t;
  }
  function md(src) {
    var lines = String(src || '').replace(/\r/g, '').split('\n'), out = [], i = 0;
    function flushPara(buf) { if (buf.length) out.push('<p>' + inline(buf.join(' ')) + '</p>'); }
    var para = [];
    while (i < lines.length) {
      var l = lines[i].trim(), m;
      if (!l) { flushPara(para); para = []; i++; continue; }
      if ((m = l.match(/^(#{2,3})\s+(.+)$/))) { flushPara(para); para = []; out.push('<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'); i++; continue; }
      if (/^[-*]\s+/.test(l)) {
        flushPara(para); para = []; var items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { items.push('<li>' + inline(lines[i].trim().replace(/^[-*]\s+/, '')) + '</li>'); i++; }
        out.push('<ul>' + items.join('') + '</ul>'); continue;
      }
      if (/^\d+[.)]\s+/.test(l)) {
        flushPara(para); para = []; var its = [];
        while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) { its.push('<li>' + inline(lines[i].trim().replace(/^\d+[.)]\s+/, '')) + '</li>'); i++; }
        out.push('<ol>' + its.join('') + '</ol>'); continue;
      }
      if (/^>\s?/.test(l)) {
        flushPara(para); para = []; var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) { q.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
        out.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>'); continue;
      }
      para.push(l); i++;
    }
    flushPara(para);
    return out.join('\n');
  }

  function words(s) { return String(s || '').trim().split(/\s+/).filter(Boolean).length; }
  function readMin(a) { return Math.max(1, Math.ceil(words(a.body) / 180)); }
  function fmtDate(d) { var m = String(d || '').match(/^(\d{4})-(\d\d)-(\d\d)/); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : ''; }
  function hue(s) { var h = 0; String(s || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 360; }); return h; }
  function pub(list) { return (list || []).filter(function (a) { return !a.draft; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); }
  function url(a) { return SITE + 'blog/' + a.slug + '.html'; }

  function card(a) {
    return '<a class="bl-card" href="blog/' + esc(a.slug) + '.html" data-cat="' + esc(a.cat) + '">' +
      '<span class="bl-cov" style="--h:' + hue(a.cat) + '"><span>' + esc(a.cat) + '</span></span>' +
      '<span class="bl-cb"><b class="bl-ct">' + esc(a.title) + '</b><span class="bl-cd">' + esc(a.desc) + '</span>' +
      '<span class="bl-cm">' + esc(fmtDate(a.date)) + ' · ' + readMin(a) + ' د قراءة</span></span></a>';
  }

  function head(o) {
    var ld = JSON.stringify(o.ld).replace(/</g, '\\u003c');
    return '<!doctype html>\n<html lang="ar" dir="rtl">\n  <head>\n    <meta charset="UTF-8" />\n' + (o.base ? '    <base href="../" />\n' : '') +
      '    <link rel="icon" type="image/png" sizes="32x32" href="image/logoo.png" />\n    <link rel="shortcut icon" href="image/logoo.png" />\n' +
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' +
      '    <title>' + esc(o.title) + '</title>\n    <meta name="description" content="' + esc(o.desc) + '" />\n' +
      '    <meta name="robots" content="index,follow,max-image-preview:large" />\n    <link rel="canonical" href="' + esc(o.url) + '" />\n    <meta name="theme-color" content="#0871FA" />\n' +
      '    <meta property="og:type" content="' + o.type + '" />\n    <meta property="og:locale" content="ar_AR" />\n    <meta property="og:site_name" content="Mr Word" />\n' +
      '    <meta property="og:title" content="' + esc(o.title) + '" />\n    <meta property="og:description" content="' + esc(o.desc) + '" />\n    <meta property="og:url" content="' + esc(o.url) + '" />\n' +
      '    <meta property="og:image" content="' + SITE + 'image/og-cover.jpg" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n' +
      (o.published ? '    <meta property="article:published_time" content="' + esc(o.published) + '" />\n' : '') +
      '    <meta name="twitter:card" content="summary_large_image" />\n    <meta name="twitter:title" content="' + esc(o.title) + '" />\n    <meta name="twitter:description" content="' + esc(o.desc) + '" />\n    <meta name="twitter:image" content="' + SITE + 'image/og-cover.jpg" />\n' +
      '    <script type="application/ld+json">' + ld + '</script>\n' +
      '    <link rel="preconnect" href="https://fonts.googleapis.com" />\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n' +
      '    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&family=Tajawal:wght@300;400;500;700;900&display=swap" rel="stylesheet" />\n' +
      '    <link rel="stylesheet" href="style.css" />\n  </head>\n';
  }
  var NAV = '  <body>\n    <script>\n      (function () {\n        try {\n          var t = localStorage.getItem(\'theme\'), l = localStorage.getItem(\'lang\');\n          if (t === \'light\') document.body.classList.add(\'light-mode\');\n          if (l === \'en\') { document.documentElement.lang = \'en\'; document.documentElement.dir = \'ltr\'; document.body.dir = \'ltr\'; }\n        } catch (e) {}\n      })();\n    </script>\n' +
    '    <nav id="navbar">\n      <a href="index.html" class="nav-logo"><img src="image/logoo.png" alt="Mr Word" class="logo-img" /></a>\n      <div style="display: flex; align-items: center; gap: 10px">\n' +
    '        <button class="lang-toggle" onclick="toggleLang()"><span class="lang-text lang-ar">عربي</span><span class="lang-sep">|</span><span class="lang-text lang-en">EN</span></button>\n' +
    '        <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme"><span class="theme-icon"></span></button>\n' +
    '        <a href="https://wa.me/' + WA + '" target="_blank" class="nav-cta" data-translate="nav_cta">تواصل معنا</a>\n      </div>\n    </nav>\n';
  var FOOT = '    <script src="main.js"></script>\n    <script src="scrollbar.js"></script>\n  </body>\n</html>\n';

  /* ───── صفحة مقال ───── */
  function articleHtml(a, list) {
    var u = url(a), others = pub(list).filter(function (x) { return x.slug !== a.slug; }).slice(0, 3);
    var ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'BlogPosting', '@id': u + '#article', mainEntityOfPage: u, headline: a.title, description: a.desc, inLanguage: 'ar',
        datePublished: a.date, dateModified: a.date, image: SITE + 'image/og-cover.jpg',
        author: { '@type': 'Organization', name: 'Mr Word', url: SITE }, publisher: { '@id': SITE + '#org' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'المدونة', item: SITE + 'blog.html' },
        { '@type': 'ListItem', position: 3, name: a.title, item: u } ] }
    ] };
    var share = 'https://wa.me/?text=' + encodeURIComponent(a.title + '\n' + u);
    return head({ title: a.title + ' | Mr Word', desc: a.desc, url: u, type: 'article', published: a.date, ld: ld, base: true }) + NAV +
      '    <main class="bl-main">\n      <article class="bl-art">\n' +
      '        <div class="bl-crumb" role="navigation" aria-label="مسار التنقل"><a href="index.html">الرئيسية</a><span>/</span><a href="blog.html">المدونة</a></div>\n' +
      '        <header class="bl-head"><span class="bl-tag">' + esc(a.cat) + '</span><h1>' + esc(a.title) + '</h1><p class="bl-meta">' + esc(fmtDate(a.date)) + ' · ' + readMin(a) + ' دقائق قراءة</p></header>\n' +
      '        <div class="bl-body">\n' + md(a.body) + '\n        </div>\n' +
      '        <aside class="bl-cta"><h2>تحتاج مساعدة في مستندك؟</h2><p>أخبرنا عن مشروعك وسنرد عليك بعرض سعر بدون التزام.</p>' +
      '<div class="bl-cta-b"><a class="btn-primary" href="index.html#request">اطلب عبر النموذج</a><a class="btn-outline" href="https://wa.me/' + WA + '" target="_blank" rel="noopener">واتساب</a></div></aside>\n' +
      '        <p class="bl-share">شارك المقال: <a href="' + esc(share) + '" target="_blank" rel="noopener">واتساب</a></p>\n      </article>\n' +
      (others.length ? '      <section class="bl-more"><h2>مقالات أخرى</h2><div class="bl-grid">' + others.map(card).join('') + '</div></section>\n' : '') +
      '      <p class="bl-back"><a class="btn-outline" href="blog.html">كل المقالات</a></p>\n    </main>\n' + FOOT;
  }

  /* ───── صفحة قائمة المدونة ───── */
  function indexHtml(list) {
    var P = pub(list), cats = [];
    P.forEach(function (a) { if (cats.indexOf(a.cat) < 0) cats.push(a.cat); });
    var u = SITE + 'blog.html', desc = 'مقالات عملية عن تنسيق مستندات Word: الفهارس والأنماط والرسائل الجامعية والسير الذاتية ونصائح تختصر وقتك.';
    var ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', '@id': u + '#page', url: u, name: 'مدونة Mr Word', description: desc, inLanguage: 'ar', isPartOf: { '@id': SITE + '#website' }, publisher: { '@id': SITE + '#org' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE }, { '@type': 'ListItem', position: 2, name: 'المدونة', item: u } ] }
    ] };
    return head({ title: 'مدونة تصميم المستندات | Mr Word', desc: desc, url: u, type: 'website', ld: ld, base: false }) + NAV +
      '    <main class="bl-main">\n      <div class="section-header" style="margin-bottom: 24px; text-align: start;"><div><div class="section-label">المدونة</div>' +
      '<h1 class="section-title" style="margin-top: 12px;">مقالات عن تصميم المستندات</h1><p class="section-subtitle" style="margin-top: 8px;">نصائح عملية تساعدك على تقديم عرض أوضح وأقوى</p></div></div>\n' +
      (cats.length > 1 ? '      <div class="bl-chips" id="blChips"><button type="button" class="bl-chip on" data-c="">الكل</button>' + cats.map(function (c) { return '<button type="button" class="bl-chip" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>\n' : '') +
      '      <div class="bl-grid" id="blGrid">' + (P.map(card).join('') || '<p class="bl-empty">لا توجد مقالات بعد.</p>') + '</div>\n' +
      '      <p class="bl-back"><a class="btn-outline" href="index.html">العودة إلى الرئيسية</a></p>\n    </main>\n' +
      '    <script>\n      (function () {\n        var box = document.getElementById("blChips"); if (!box) return;\n        box.addEventListener("click", function (e) {\n          var b = e.target.closest(".bl-chip"); if (!b) return;\n          [].forEach.call(box.children, function (x) { x.classList.toggle("on", x === b); });\n          [].forEach.call(document.querySelectorAll("#blGrid .bl-card"), function (c) { c.hidden = !!b.dataset.c && c.dataset.cat !== b.dataset.c; });\n        });\n      })();\n    </script>\n' + FOOT;
  }

  /* ───── تحديث sitemap.xml: نحذف روابط المدونة القديمة ونضيف الحالية ───── */
  function sitemap(xml, list) {
    xml = String(xml || '').replace(/\s*<url>\s*<loc>[^<]*\/blog[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
    var P = pub(list), add = '';
    function u(loc, d, f, p) { return '\n  <url>\n    <loc>' + loc + '</loc>\n    <lastmod>' + d + '</lastmod>\n    <changefreq>' + f + '</changefreq>\n    <priority>' + p + '</priority>\n  </url>'; }
    if (P.length) {
      add += u(SITE + 'blog.html', P[0].date, 'weekly', '0.8');
      P.forEach(function (a) { add += u(url(a), a.date, 'monthly', '0.7'); });
    }
    return xml.replace('</urlset>', add + '\n</urlset>');
  }

  /* ───── تحقق ───── */
  function slugOk(s) { return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s || ''); }
  function slugify(s) { return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, ''); }

  var api = { md: md, esc: esc, articleHtml: articleHtml, indexHtml: indexHtml, sitemap: sitemap, card: card, pub: pub, readMin: readMin, fmtDate: fmtDate, slugOk: slugOk, slugify: slugify };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BlogGen = api;
})(typeof window !== 'undefined' ? window : this);
