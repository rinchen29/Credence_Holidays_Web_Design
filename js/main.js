(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: solid on scroll ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  menuBtn.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Hero slideshow ---------- */
  var slides = document.querySelectorAll('.hero-slide');
  var switches = document.querySelectorAll('.switch');
  var SLIDE_MS = 6000;
  var current = 0, timer;
  doc.style.setProperty('--slide-ms', SLIDE_MS + 'ms');

  function show(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach(function (s, n) { s.classList.toggle('is-active', n === current); });
    switches.forEach(function (b, n) {
      var on = n === current;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
      // restart the progress bar animation
      var bar = b.querySelector('.bar i');
      bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    });
  }
  function play() {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(function () { show(current + 1); }, SLIDE_MS);
  }
  switches.forEach(function (b) {
    b.addEventListener('click', function () { show(+b.dataset.slide); play(); });
  });
  play();

  /* ---------- Trip finder ---------- */
  var finder = document.getElementById('finder');
  // next 12 months for the "When?" field
  var whenSel = document.getElementById('when');
  var now = new Date();
  for (var m = 0; m < 12; m++) {
    var d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    var label = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    whenSel.add(new Option(label, label));
  }
  var pax = finder.querySelector('output');
  finder.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      pax.value = Math.min(99, Math.max(1, (+pax.value || 1) + +b.dataset.step));
    });
  });
  finder.addEventListener('submit', function (e) {
    e.preventDefault();
    var where = finder.elements.where.value;
    var when = finder.elements.when.value;
    var type = finder.elements.type.value;
    if (where) document.getElementById('f-dest').value = where;
    if (when) document.getElementById('f-date').value = when;
    setTrip(type);
    var msg = document.getElementById('f-msg');
    if (!msg.value) msg.value = pax.value + ' traveller' + (pax.value > 1 ? 's' : '');
    goToForm();
  });

  /* ---------- Prefill links ---------- */
  document.querySelectorAll('[data-prefill]').forEach(function (a) {
    a.addEventListener('click', function () { document.getElementById('f-dest').value = a.dataset.prefill; });
  });
  document.querySelectorAll('[data-trip]').forEach(function (a) {
    a.addEventListener('click', function () { setTrip(a.dataset.trip); });
  });
  function setTrip(v) {
    var r = document.querySelector('input[name="trip"][value="' + v + '"]');
    if (r) r.checked = true;
  }
  function goToForm() {
    document.getElementById('contact').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(function () { document.getElementById('f-name').focus({ preventScroll: true }); }, 700);
  }

  /* ---------- Destination filters ---------- */
  var tiles = document.querySelectorAll('.tile');
  document.querySelectorAll('[data-filter]').forEach(function (chip, _, all) {
    chip.addEventListener('click', function () {
      all.forEach(function (c) { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
      var f = chip.dataset.filter;
      tiles.forEach(function (t) { t.classList.toggle('is-hidden', f !== 'all' && t.dataset.cat !== f); });
    });
  });

  /* ---------- Experience panels ---------- */
  var panels = document.querySelectorAll('.panel');
  panels.forEach(function (p) {
    function open() { panels.forEach(function (o) { o.classList.toggle('is-open', o === p); }); }
    p.addEventListener('click', open);
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { if (e.target === p) { e.preventDefault(); open(); } } });
    if (window.matchMedia('(hover: hover) and (min-width: 981px)').matches) p.addEventListener('mouseenter', open);
  });

  /* ---------- Testimonials ---------- */
  var track = document.querySelector('.ts-track');
  var dots = document.querySelectorAll('.ts-dots button');
  var tsIndex = 0;
  function tsGo(i) {
    tsIndex = (i + dots.length) % dots.length;
    track.style.transform = 'translateX(' + (-100 * tsIndex) + '%)';
    dots.forEach(function (d, n) { d.classList.toggle('is-active', n === tsIndex); });
  }
  dots.forEach(function (d, n) { d.addEventListener('click', function () { tsGo(n); }); });
  // swipe on touch screens
  var startX = null;
  track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) tsGo(tsIndex + (dx < 0 ? 1 : -1));
    startX = null;
  });
  document.querySelectorAll('[data-ts]').forEach(function (b) {
    b.addEventListener('click', function () { tsGo(tsIndex + (b.dataset.ts === 'next' ? 1 : -1)); });
  });

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    // stagger siblings that enter together
    reveals.forEach(function (el) {
      var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.hasAttribute('data-reveal'); });
      var i = sibs.indexOf(el);
      if (sibs.length > 1) el.style.setProperty('--d', (i % 4) * 0.08 + 's');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Enquiry form (static: opens the visitor's mail app) ---------- */
  var form = document.getElementById('enquiry');
  var status = form.querySelector('.form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var required = [form.elements.name, form.elements.phone];
    var missing = required.filter(function (i) {
      var empty = !i.value.trim();
      i.setAttribute('aria-invalid', String(empty));
      return empty;
    });
    if (missing.length) {
      status.className = 'form-status is-error';
      status.textContent = 'Add your ' + missing.map(function (i) { return i.labels[0].textContent.toLowerCase(); }).join(' and ') + ' so we can get back to you.';
      missing[0].focus();
      return;
    }
    var d = new FormData(form);
    var body = [
      'Name: ' + d.get('name'),
      'Phone: ' + d.get('phone'),
      'Email: ' + (d.get('email') || '-'),
      'Trip type: ' + d.get('trip'),
      'Destination: ' + (d.get('destination') || 'Not decided'),
      'Travel month: ' + (d.get('date') || 'Flexible'),
      'Notes: ' + (d.get('message') || '-')
    ].join('\n');
    window.location.href = 'mailto:sales@credenceholidays.com?subject=' +
      encodeURIComponent('Trip enquiry: ' + d.get('trip') + ' for ' + d.get('name')) +
      '&body=' + encodeURIComponent(body);
    status.className = 'form-status is-ok';
    status.textContent = 'Your enquiry is ready in your email app. Hit send and we\'ll reply with a plan.';
  });
  form.querySelectorAll('input').forEach(function (i) {
    i.addEventListener('input', function () { if (i.value.trim()) i.removeAttribute('aria-invalid'); });
  });

  /* ---------- Newsletter ---------- */
  var news = document.getElementById('news');
  news.addEventListener('submit', function (e) {
    e.preventDefault();
    var s = document.querySelector('.news-status');
    var email = news.querySelector('input');
    if (!email.checkValidity()) { s.textContent = 'Enter a valid email address.'; email.focus(); return; }
    window.location.href = 'mailto:sales@credenceholidays.com?subject=' +
      encodeURIComponent('Subscribe me to monthly deals') + '&body=' + encodeURIComponent('Please send monthly deals to ' + email.value);
    s.textContent = 'Send the email that just opened to confirm your subscription.';
    news.reset();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
