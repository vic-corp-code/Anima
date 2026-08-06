/* Paws & Hearts — shared site behaviour for v3 pages. */
(function () {
  /* theme — stored choice wins, otherwise follow the OS.
     The pre-paint <script> in each page's <head> sets the initial attribute;
     this block keeps it in sync and wires the toggle. */
  var THEME_KEY = 'ph-theme';
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  var storedTheme = function () {
    try { var v = localStorage.getItem(THEME_KEY); return v === 'dark' || v === 'light' ? v : null; }
    catch (e) { return null; }
  };
  var systemTheme = function () { return media && media.matches ? 'dark' : 'light'; };

  var applyTheme = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var dark = theme === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.setAttribute('title', dark ? 'Light theme' : 'Dark theme');
    });
  };

  applyTheme(storedTheme() || systemTheme());

  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      applyTheme(next);
    });
  });

  /* follow the OS only while the visitor has not made a choice */
  if (media && media.addEventListener) {
    media.addEventListener('change', function () { if (!storedTheme()) applyTheme(systemTheme()); });
  }

  /* sticky header */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* compact menu */
  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
    var setMenu = function (open) {
      mobileNav.setAttribute('data-open', open ? 'true' : 'false');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    navToggle.addEventListener('click', function () { setMenu(mobileNav.getAttribute('data-open') !== 'true'); });
    mobileNav.addEventListener('click', function (ev) { if (ev.target.tagName === 'A') setMenu(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') setMenu(false); });
  }

  /* offset-aware in-page scrolling */
  if (header) {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (ev) {
        var id = link.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        ev.preventDefault();
        var y = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 16;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      });
    });
  }

  /* reveal on scroll */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* newsletter (footer) — graceful, no backend */
  var news = document.getElementById('newsletterForm');
  if (news) {
    var msg = document.getElementById('newsletterMsg');
    var email = document.getElementById('newsletterEmail');
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    news.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!email || !re.test(email.value.trim())) {
        if (email) email.setAttribute('aria-invalid', 'true');
        msg.setAttribute('data-state', 'error');
        msg.textContent = 'That email address does not look right.';
        return;
      }
      email.removeAttribute('aria-invalid');
      msg.setAttribute('data-state', 'ok');
      msg.textContent = 'You are on the list. One email a month, mostly photographs.';
      news.reset();
    });
  }
})();
