/* AILON Design System v1.0 — shared runtime.
   Additive and defensive: it never rewrites an app's own markup, only decorates
   the elements that ask for it.

   Usage (any app, any depth):
     <link rel="stylesheet" href="../_shared/ailon-design.css?v=1">
     <script src="../_shared/ailon-design.js?v=1" defer></script>

   Opt in per page:
     <body data-ailon-hero>          -> injects the slow aurora into .ai-hero
     <html data-ailon-ribbon>        -> 2px brand rule at the top
     <element class="ai-reveal">     -> fades in on scroll
*/
(function () {
  'use strict';
  var doc = document;
  var html = doc.documentElement;

  function ready(fn) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function ensureFont() {
    var links = doc.querySelectorAll('link[href*="fonts.googleapis.com"]');
    for (var i = 0; i < links.length; i++) {
      if (/family=[^"']*Heebo/i.test(links[i].href)) return;
    }
    var pre = doc.createElement('link');
    pre.rel = 'preconnect';
    pre.href = 'https://fonts.gstatic.com';
    pre.crossOrigin = 'anonymous';
    doc.head.appendChild(pre);
    var l = doc.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&display=swap';
    doc.head.appendChild(l);
  }

  function decorate(el) {
    if (!el || el.querySelector(':scope > .ai-aurora')) return;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    if (getComputedStyle(el).overflow === 'visible') el.style.overflow = 'hidden';

    var a = doc.createElement('div');
    a.className = 'ai-aurora';
    a.setAttribute('aria-hidden', 'true');
    var c = doc.createElement('span');
    c.className = 'ai-aurora-c';
    a.appendChild(c);
    el.insertBefore(a, el.firstChild);

    var g = doc.createElement('div');
    g.className = 'ai-grain';
    g.setAttribute('aria-hidden', 'true');
    el.insertBefore(g, el.firstChild);
  }

  function reveal() {
    var items = doc.querySelectorAll('.ai-reveal:not(.ai-in)');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('ai-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('ai-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    Array.prototype.forEach.call(items, function (el, i) {
      el.style.setProperty('--ai-d', Math.min(i, 8) * 45 + 'ms');
      io.observe(el);
    });
  }

  ready(function () {
    html.classList.add('ailon-design');
    ensureFont();

    if (html.hasAttribute('data-ailon-ribbon') || (doc.body && doc.body.hasAttribute('data-ailon-ribbon'))) {
      var r = doc.createElement('div');
      r.className = 'ai-ribbon';
      r.setAttribute('aria-hidden', 'true');
      doc.body.appendChild(r);
    }

    if (doc.body && doc.body.hasAttribute('data-ailon-hero')) {
      Array.prototype.forEach.call(doc.querySelectorAll('.ai-hero'), decorate);
    }

    reveal();
    // Apps that render after load (SPA-style) can call window.AILON_DESIGN.reveal()
    window.AILON_DESIGN = { reveal: reveal, decorate: decorate };
  });
})();
