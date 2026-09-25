/* ============================================================
   Pradeep Realty — interactions
   Vanilla JS. No dependencies.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = $$('.reveal');
  revealEls.forEach(function (el) {
    var d = el.getAttribute('data-delay');
    if (d) el.style.setProperty('--rd', d + 'ms');
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealIO.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------------- Navbar: sticky state + progress ---------------- */
  var nav = $('#nav');
  var progress = $('#navProgress');
  var toTop = $('#toTop');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle('is-stuck', y > 40);
    if (toTop) toTop.classList.toggle('is-shown', y > 700);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

    updateTimeline();
    ticking = false;
  }
  function requestScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);

  /* ---------------- Mobile menu ---------------- */
  var toggle = $('#navToggle');
  var links = $('#navLinks');

  function closeMenu() {
    links.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked');
  }

  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
  });

  $$('#navLinks a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('is-open')) closeMenu();
  });

  /* ---------------- Smooth scroll for anchors ---------------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- Active nav link ---------------- */
  var sections = $$('main section[id]');
  var navMap = {};
  $$('#navLinks a[href^="#"]').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });

  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = navMap[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.keys(navMap).forEach(function (k) { navMap[k].classList.remove('is-current'); });
          link.classList.add('is-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  /* ---------------- Animated counters ---------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-target')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }

    var duration = 1800;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  var counterNums = $$('.counter__num');
  if (!('IntersectionObserver' in window)) {
    counterNums.forEach(animateCount);
  } else {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        countIO.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counterNums.forEach(function (el) { countIO.observe(el); });
  }

  /* ---------------- Process timeline progressive fill ---------------- */
  var timeline = $('#timeline');
  var tlFill = $('#tlFill');
  var steps = $$('.step');

  function updateTimeline() {
    if (!timeline || !tlFill) return;
    var rect = timeline.getBoundingClientRect();
    var vh = window.innerHeight;
    var startAt = vh * 0.82;
    var span = rect.height + vh * 0.28;
    var pct = Math.min(Math.max((startAt - rect.top) / span, 0), 1);
    var horizontal = window.innerWidth >= 900;

    if (reduceMotion) pct = rect.top < vh ? 1 : 0;

    if (horizontal) { tlFill.style.width = pct * 100 + '%'; tlFill.style.height = '100%'; }
    else { tlFill.style.height = pct * 100 + '%'; tlFill.style.width = '100%'; }

    steps.forEach(function (step, i) {
      step.classList.toggle('is-live', pct >= (i + 0.35) / steps.length);
    });
  }

  /* ---------------- Property filters ---------------- */
  var filters = $$('.filter');
  var props = $$('#propertyGrid .prop');

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.getAttribute('data-filter');
      filters.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      props.forEach(function (p, i) {
        var show = type === 'all' || p.getAttribute('data-type') === type;
        p.classList.toggle('is-hidden', !show);
        if (!show || reduceMotion) return;
        p.classList.remove('is-in');
        p.style.setProperty('--rd', (i % 3) * 80 + 'ms');
        // force reflow so the transition replays
        void p.offsetWidth;
        p.classList.add('is-in');
      });
    });
  });

  /* ---------------- Testimonials carousel ---------------- */
  var slides = $$('.slide');
  var dotsWrap = $('#dots');
  var index = 0;
  var timer = null;
  var AUTOPLAY = 6000;

  if (slides.length && dotsWrap) {
    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'dot' + (i === 0 ? ' is-active' : '');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
      dot.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(dot);
    });

    var dots = $$('.dot', dotsWrap);

    var go = function (n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
    };

    var start = function () {
      if (reduceMotion) return;
      timer = window.setInterval(function () { go(index + 1); }, AUTOPLAY);
    };
    var stop = function () { window.clearInterval(timer); };
    var restart = function () { stop(); start(); };

    $('#nextBtn').addEventListener('click', function () { go(index + 1); restart(); });
    $('#prevBtn').addEventListener('click', function () { go(index - 1); restart(); });

    var slider = $('#slider');
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', start);

    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : restart();
    });

    // Touch swipe
    var startX = 0;
    slider.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      start();
    }, { passive: true });

    start();
  }

  /* ---------------- Contact form ---------------- */
  var form = $('#contactForm');
  if (form) {
    var showError = function (name, msg) {
      var field = form.querySelector('#' + name).closest('.field');
      var slot = form.querySelector('[data-err="' + name + '"]');
      field.classList.toggle('has-error', !!msg);
      if (slot) slot.textContent = msg || '';
      return !msg;
    };

    ['name', 'phone'].forEach(function (id) {
      var input = form.querySelector('#' + id);
      input.addEventListener('input', function () { showError(id, ''); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        name: form.querySelector('#name').value.trim(),
        phone: form.querySelector('#phone').value.trim(),
        interest: form.querySelector('#interest').value,
        message: form.querySelector('#message').value.trim()
      };

      var ok = true;
      ok = showError('name', data.name.length < 2 ? 'Please enter your name.' : '') && ok;
      ok = showError('phone', /^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, '').slice(-10))
        ? '' : 'Enter a valid 10-digit mobile number.') && ok;
      if (!ok) return;

      var text =
        'New enquiry from website%0A%0A' +
        'Name: ' + encodeURIComponent(data.name) + '%0A' +
        'Phone: ' + encodeURIComponent(data.phone) + '%0A' +
        'Interest: ' + encodeURIComponent(data.interest) +
        (data.message ? '%0AMessage: ' + encodeURIComponent(data.message) : '');

      $('#formOk').hidden = false;
      window.open('https://wa.me/919538844427?text=' + text, '_blank', 'noopener');
      form.reset();
    });
  }

  /* ---------------- Footer year ---------------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------- Init ---------------- */
  onScroll();
})();
