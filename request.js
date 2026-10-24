/* نموذج "اطلب خدمتك": يحفظ الطلب في Firestore (مجموعة requests) ويظهر في لوحة التحكم ← تبويب "الطلبات".
   يعتمد على rating.js (window.MrFS) وعلى عنصر <section id="request"></section> في index.html. */
(function () {
  var sec = document.getElementById('request');
  if (!sec) return;
  var WA = '963935919037';
  var EN = function () { return document.documentElement.lang === 'en'; };
  var SV = [
    ['s1', 'تنسيق وتصميم مستند احترافي', 'Professional document formatting & design'],
    ['s2', 'تحسين مستند جاهز', 'Improve an existing document'],
    ['s3', 'قالب Word حسب هويتك', 'Custom branded template'],
    ['s4', 'تنسيق رسالة أو بحث علمي', 'Thesis / academic paper formatting'],
    ['s5', 'سيرة ذاتية ومستندات شخصية', 'CV & personal documents'],
    ['s6', 'توحيد هوية المستندات', 'Document branding'],
    ['other', 'خدمة أخرى', 'Something else']
  ];
  var S = {
    ar: {
      label: 'اطلب خدمتك', title: 'أخبرنا عن مشروعك', sub: 'املأ النموذج وسنتواصل معك في أقرب وقت. بدون التزام.',
      name: 'الاسم', contact: 'واتساب أو بريد إلكتروني', service: 'الخدمة المطلوبة', pick: 'اختر الخدمة…',
      desc: 'تفاصيل المشروع', descPh: 'عدد الصفحات تقريباً، نوع المستند، الغرض منه، أي ملاحظات…', dl: 'الموعد المطلوب (اختياري)', dlPh: 'مثال: خلال أسبوع',
      send: 'إرسال الطلب', sending: 'جارٍ الإرسال…',
      legal: 'بإرسال الطلب أنت توافق على <a href="privacy.html">سياسة الخصوصية</a>. نستخدم بياناتك للرد على طلبك فقط.',
      cta: 'اطلب عبر النموذج',
      eName: 'اكتب اسمك.', eContact: 'اكتب رقم واتساب (مع رمز الدولة) أو بريداً إلكترونياً صحيحاً.', eService: 'اختر الخدمة المطلوبة.', eDesc: 'اكتب تفاصيل أكثر قليلاً عن مشروعك (10 أحرف على الأقل).',
      eWait: 'انتظر لحظة ثم أعد المحاولة.', eLimit: 'أرسلت عدة طلبات اليوم. تواصل معنا عبر واتساب لمتابعتها.',
      eFail: 'تعذّر إرسال الطلب الآن. جرّب مرة أخرى أو تواصل معنا مباشرة عبر واتساب.',
      okT: 'تم استلام طلبك', okP: 'سنراجع التفاصيل ونتواصل معك قريباً.', ref: 'رقم الطلب', wa: 'أرسل نسخة عبر واتساب لتسريع الرد', again: 'إرسال طلب آخر',
      waMsg: function (r, sv, n) { return 'مرحباً، أرسلت طلباً من الموقع (رقم ' + r + ').\nالخدمة: ' + sv + '\nالاسم: ' + n; }
    },
    en: {
      label: 'Request a service', title: 'Tell us about your project', sub: "Fill in the form and we'll get back to you soon. No commitment.",
      name: 'Name', contact: 'WhatsApp or email', service: 'Service needed', pick: 'Choose a service…',
      desc: 'Project details', descPh: 'عدد الصفحات تقريباً، نوع المستند، الغرض منه، أي ملاحظات…', dl: 'Deadline (optional)', dlPh: 'e.g. within a week',
      send: 'Send request', sending: 'Sending…',
      legal: 'By sending this request you agree to the <a href="privacy.html">Privacy Policy</a>. We use your details only to reply to you.',
      cta: 'Request via form',
      eName: 'Please enter your name.', eContact: 'Enter a WhatsApp number (with country code) or a valid email.', eService: 'Please choose a service.', eDesc: 'Please add a few more details (at least 10 characters).',
      eWait: 'Please wait a moment and try again.', eLimit: "You've sent several requests today. Contact us on WhatsApp to follow up.",
      eFail: "Couldn't send your request right now. Try again or contact us directly on WhatsApp.",
      okT: 'Request received', okP: "We'll review the details and get back to you soon.", ref: 'Request no.', wa: 'Send a copy on WhatsApp for a faster reply', again: 'Send another request',
      waMsg: function (r, sv, n) { return 'Hello, I sent a request from the website (no. ' + r + ').\nService: ' + sv + '\nName: ' + n; }
    }
  };
  var L = function () { return EN() ? S.en : S.ar; };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  var lsG = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var lsS = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var t0 = Date.now(), done = null, pre = '';
  document.addEventListener('mr-pick-service', function (e) {
    pre = (e && e.detail) || '';
    var f = sec.querySelector('.rq-form');
    if (done) { done = null; build(); f = sec.querySelector('.rq-form'); }
    if (f && pre) f.elements.v.value = pre;
  });

  function build() {
    var s = L(), en = EN(), old = sec.querySelector('.rq-form'), dr = null;
    if (old) { dr = {}; ['n', 'c', 'v', 'd', 'dl'].forEach(function (k) { dr[k] = old.elements[k].value; }); }
    sec.innerHTML =
      '<div class="section-header"><div><div class="section-label">' + s.label + '</div><h2 class="section-title">' + s.title + '</h2><p class="section-subtitle">' + s.sub + '</p></div></div>' +
      '<div class="rq-card">' + (done ? ok(done) : form()) + '</div>';
    var cta = document.getElementById('rqCta'); if (cta) cta.textContent = s.cta;
    var nf = sec.querySelector('.rq-form');
    if (dr && nf) Object.keys(dr).forEach(function (k) { nf.elements[k].value = dr[k]; });
    if (nf && pre && !(dr && dr.v)) nf.elements.v.value = pre;
    bind();
  }
  function form() {
    var s = L(), en = EN();
    return '<form class="cm rq-form" novalidate>' +
      '<div class="rq-row"><label class="rq-f"><span>' + s.name + '</span><input class="cm-name" name="n" maxlength="60" autocomplete="name" required /></label>' +
      '<label class="rq-f"><span>' + s.contact + '</span><input class="cm-name" name="c" maxlength="80" autocomplete="tel" dir="ltr" inputmode="email" required /></label></div>' +
      '<label class="rq-f"><span>' + s.service + '</span><select class="cm-name" name="v" required><option value="">' + s.pick + '</option>' +
      SV.map(function (x) { return '<option value="' + x[0] + '">' + esc(en ? x[2] : x[1]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="rq-f"><span>' + s.desc + '</span><textarea class="cm-text" name="d" maxlength="1500" rows="5" placeholder="' + esc(s.descPh) + '" required></textarea></label>' +
      '<label class="rq-f"><span>' + s.dl + '</span><input class="cm-name" name="dl" maxlength="60" placeholder="' + esc(s.dlPh) + '" /></label>' +
      '<input class="cm-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />' +
      '<div class="rq-act"><button class="cm-send" type="submit">' + s.send + '</button><span class="cm-msg" role="status"></span></div>' +
      '<p class="cm-legal">' + s.legal + '</p></form>';
  }
  function ok(d) {
    var s = L(), sv = '';
    SV.forEach(function (x) { if (x[0] === d.v) sv = EN() ? x[2] : x[1]; });
    var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(s.waMsg(d.ref, sv, d.n));
    return '<div class="rq-ok"><div class="rq-tick" aria-hidden="true">✓</div><h3>' + s.okT + '</h3><p>' + s.okP + '</p>' +
      '<p class="rq-ref">' + s.ref + ': <b dir="ltr">' + esc(d.ref) + '</b></p>' +
      '<div class="rq-oka"><a class="btn-primary" href="' + url + '" target="_blank" rel="noopener">' + s.wa + '</a>' +
      '<button type="button" class="btn-outline rq-again">' + s.again + '</button></div></div>';
  }
  function validContact(c) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) return true;
    var d = c.replace(/[\s()+\-.]/g, '');
    return /^\d{7,15}$/.test(d);
  }
  function bind() {
    var f = sec.querySelector('.rq-form');
    var again = sec.querySelector('.rq-again');
    if (again) again.addEventListener('click', function () { done = null; t0 = Date.now(); build(); });
    if (!f) return;
    var msg = f.querySelector('.cm-msg'), btn = f.querySelector('.cm-send');
    var say = function (t, cls) { msg.textContent = t; msg.className = 'cm-msg' + (cls ? ' ' + cls : ''); };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = L(), g = function (k) { return (f.elements[k].value || '').trim(); };
      if (g('website')) { done = { n: g('n'), v: g('v'), ref: 'X0000' }; build(); return; } // فخ الروبوتات: نُظهر نجاحاً ولا نرسل شيئاً
      var n = g('n'), c = g('c'), v = g('v'), d = g('d'), dl = g('dl');
      if (!n) return say(s.eName, 'err');
      if (!validContact(c)) return say(s.eContact, 'err');
      if (!v) return say(s.eService, 'err');
      if (d.length < 10) return say(s.eDesc, 'err');
      if (Date.now() - t0 < 3000) return say(s.eWait, 'err');
      var now = Date.now(), sent = lsG('mr_rq_t', []).filter(function (t) { return now - t < 864e5; });
      if (sent.length >= 3) return say(s.eLimit, 'err');
      if (!window.MrFS || !window.MrFS.ok) return say(s.eFail, 'err');
      var id = 'r' + now.toString(36) + Math.random().toString(36).slice(2, 10);
      var fields = { n: { stringValue: n }, c: { stringValue: c }, v: { stringValue: v }, d: { stringValue: d }, s: { stringValue: 'new' } };
      if (dl) fields.dl = { stringValue: dl };
      btn.disabled = true; say(s.sending);
      window.MrFS.commit([{
        update: { name: window.MrFS.doc + '/requests/' + id, fields: fields },
        updateTransforms: [{ fieldPath: 't', setToServerValue: 'REQUEST_TIME' }],
        currentDocument: { exists: false }
      }]).then(function (r) {
        if (!r.ok) throw 0;
        sent.push(now); lsS('mr_rq_t', sent);
        if (window.mrTrack) window.mrTrack('generate_lead', { method: 'request_form', service: v });
        window.MrFS.notify('request', v);
        done = { n: n, v: v, ref: id.slice(-6).toUpperCase() };
        build();
      }).catch(function () { btn.disabled = false; say(s.eFail, 'err'); });
    });
  }
  build();
  new MutationObserver(build).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
