/* القائمة البريدية: نموذج اشتراك يحفظ البريد في Firestore (مجموعة subscribers) ويظهر في لوحة التحكم ← تبويب "المشتركون"
   حيث تصدّره كملف CSV لاستيراده في Brevo. يعتمد على rating.js (window.MrFS) وعلى <section id="subscribe"> في index.html. */
(function () {
  var sec = document.getElementById('subscribe');
  var FS = window.MrFS;
  if (!sec || !FS || !FS.ok) return;
  var EN = function () { return document.documentElement.lang === 'en'; };
  var S = {
    ar: {
      label: 'القائمة البريدية', title: 'كن أول من يعرف بالجديد', sub: 'قوالب ودروس جديدة وعروض مختارة تصلك على بريدك. رسائل قليلة وبدون إزعاج.',
      name: 'اسمك (اختياري)', email: 'بريدك الإلكتروني', send: 'اشترك', sending: 'جارٍ الاشتراك…',
      consent: 'أوافق على استلام رسائل بريدية من Mr Word عن القوالب والدروس والعروض، وأعلم أنني أستطيع إلغاء الاشتراك في أي وقت.',
      legal: 'يُستخدم بريدك لإرسال هذه الرسائل فقط عبر خدمة إرسال بريد إلكتروني، ولا نبيعه ولا نشاركه. التفاصيل في <a href="privacy.html">سياسة الخصوصية</a>.',
      eEmail: 'اكتب بريداً إلكترونياً صحيحاً.', eConsent: 'يلزم الموافقة على استلام الرسائل للاشتراك.', eWait: 'انتظر لحظة ثم أعد المحاولة.',
      eLimit: 'وصلت إلى الحد اليومي، جرّب غداً.', eFail: 'تعذّر الاشتراك الآن، حاول لاحقاً.',
      okT: 'تم الاشتراك', okP: 'شكراً لك! سنرسل لك الجديد على بريدك.', again: 'اشتراك ببريد آخر'
    },
    en: {
      label: 'Newsletter', title: 'Be the first to know', sub: 'New templates, lessons and selected offers in your inbox. Few emails, no spam.',
      name: 'Your name (optional)', email: 'Your email', send: 'Subscribe', sending: 'Subscribing…',
      consent: 'I agree to receive emails from Mr Word about templates, lessons and offers, and I know I can unsubscribe at any time.',
      legal: 'Your email is used only to send these messages through an email-sending service. We never sell or share it. See the <a href="privacy.html">Privacy Policy</a>.',
      eEmail: 'Enter a valid email address.', eConsent: 'Please agree to receive emails to subscribe.', eWait: 'Please wait a moment and try again.',
      eLimit: "You've reached the daily limit, try again tomorrow.", eFail: "Couldn't subscribe right now, try again later.",
      okT: "You're subscribed", okP: "Thank you! We'll send you what's new.", again: 'Subscribe another email'
    }
  };
  var L = function () { return EN() ? S.en : S.ar; };
  var RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  var lsG = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var lsS = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var t0 = Date.now(), done = !!lsG('mr_sub_ok', false);

  function build() {
    var s = L(), old = sec.querySelector('.sb-form'), dr = null;
    if (old) dr = { n: old.elements.n.value, e: old.elements.e.value };
    sec.innerHTML =
      '<div class="section-header"><div><div class="section-label">' + s.label + '</div><h2 class="section-title">' + s.title + '</h2><p class="section-subtitle">' + s.sub + '</p></div></div>' +
      '<div class="rq-card sb-card">' + (done ? ok() : form()) + '</div>';
    var f = sec.querySelector('.sb-form');
    if (dr && f) { f.elements.n.value = dr.n; f.elements.e.value = dr.e; }
    bind();
  }
  function form() {
    var s = L();
    return '<form class="cm sb-form" novalidate>' +
      '<div class="rq-row"><label class="rq-f"><span>' + s.name + '</span><input class="cm-name" name="n" maxlength="60" autocomplete="given-name" /></label>' +
      '<label class="rq-f"><span>' + s.email + '</span><input class="cm-name" name="e" type="email" maxlength="80" autocomplete="email" dir="ltr" required /></label></div>' +
      '<label class="sb-chk"><input type="checkbox" name="c" /><span>' + s.consent + '</span></label>' +
      '<input class="cm-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />' +
      '<div class="rq-act"><button class="cm-send" type="submit">' + s.send + '</button><span class="cm-msg" role="status"></span></div>' +
      '<p class="cm-legal">' + s.legal + '</p></form>';
  }
  function ok() {
    var s = L();
    return '<div class="rq-ok"><div class="rq-tick" aria-hidden="true">✓</div><h3>' + s.okT + '</h3><p>' + s.okP + '</p>' +
      '<div class="rq-oka"><button type="button" class="btn-outline sb-again">' + s.again + '</button></div></div>';
  }
  function bind() {
    var again = sec.querySelector('.sb-again');
    if (again) again.addEventListener('click', function () { done = false; t0 = Date.now(); build(); });
    var f = sec.querySelector('.sb-form'); if (!f) return;
    var msg = f.querySelector('.cm-msg'), btn = f.querySelector('.cm-send');
    var say = function (t, c) { msg.textContent = t; msg.className = 'cm-msg' + (c ? ' ' + c : ''); };
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = L(), em = (f.elements.e.value || '').trim().toLowerCase(), nm = (f.elements.n.value || '').replace(/\s+/g, ' ').trim();
      if (f.elements.website.value) { done = true; build(); return; } // فخ الروبوتات
      if (!RE.test(em) || em.length > 80) return say(s.eEmail, 'err');
      if (!f.elements.c.checked) return say(s.eConsent, 'err');
      if (Date.now() - t0 < 3000) return say(s.eWait, 'err');
      var now = Date.now(), sent = lsG('mr_sub_t', []).filter(function (t) { return now - t < 864e5; });
      if (sent.length >= 3) return say(s.eLimit, 'err');
      var id = 's' + now.toString(36) + Math.random().toString(36).slice(2, 10);
      var fields = { e: { stringValue: em }, l: { stringValue: EN() ? 'en' : 'ar' }, c: { booleanValue: true } };
      if (nm) fields.n = { stringValue: nm.slice(0, 60) };
      btn.disabled = true; say(s.sending);
      FS.commit([{
        update: { name: FS.doc + '/subscribers/' + id, fields: fields },
        updateTransforms: [{ fieldPath: 't', setToServerValue: 'REQUEST_TIME' }],
        currentDocument: { exists: false }
      }]).then(function (r) {
        if (!r.ok) throw 0;
        sent.push(now); lsS('mr_sub_t', sent); lsS('mr_sub_ok', true);
        if (window.mrTrack) window.mrTrack('sign_up', { method: 'newsletter' });
        FS.notify('subscriber');
        done = true; build();
      }).catch(function () { btn.disabled = false; say(s.eFail, 'err'); });
    });
  }
  build();
  new MutationObserver(build).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
