/* AILON App Shell v1.0 — shared navigation, sharing, install & offline layer.
   Usage: <script src="../_shared/ailon-shell.js" defer></script>
   Optional: window.AILON_SHELL = { portal:'...', home:false, share:false, install:false } */
(function () {
  'use strict';
  var CFG = window.AILON_SHELL || {};
  var PORTAL = CFG.portal || 'https://lior-ailon.github.io/ailon-task-apps/portal.html';
  var isPortal = /portal\.html/i.test(location.pathname) || document.documentElement.hasAttribute('data-ailon-portal');

  function css() {
    if (document.getElementById('ailon-shell-css')) return;
    var l = document.createElement('link');
    l.id = 'ailon-shell-css';
    l.rel = 'stylesheet';
    var s = document.currentScript;
    var base = s && s.src ? s.src.replace(/ailon-shell\.js.*$/, '') : '_shared/';
    l.href = base + 'ailon-shell.css';
    document.head.appendChild(l);
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'ailon-toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  }

  function mkBtn(label, title, fn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('click', fn);
    return b;
  }

  function share() {
    var data = { title: document.title, text: (document.querySelector('meta[name="description"]') || {}).content || document.title, url: location.href };
    if (navigator.share) {
      navigator.share(data).catch(function () {});
      return;
    }
    var url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast('הקישור הועתק'); }, function () { window.prompt('העתק את הקישור:', url); });
    } else {
      window.prompt('העתק את הקישור:', url);
    }
  }

  var installEvt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installEvt = e;
    var b = document.getElementById('ailon-install');
    if (b) b.classList.remove('is-hidden');
  });

  function build() {
    css();
    var dock = document.createElement('div');
    dock.className = 'ailon-dock';
    dock.setAttribute('role', 'toolbar');
    dock.setAttribute('aria-label', 'פעולות מהירות');

    if (!isPortal && CFG.home !== false) {
      var h = mkBtn('\u2302', 'חזרה לפורטל AILON', function () { location.href = PORTAL; });
      h.id = 'ailon-home';
      dock.appendChild(h);
    }
    if (CFG.share !== false) dock.appendChild(mkBtn('\u21AA', 'שיתוף האפליקציה', share));

    if (CFG.install !== false) {
      var inst = mkBtn('\u2913', 'התקנת האפליקציה במסך הבית', function () {
        if (!installEvt) { toast('פתח את התפריט ובחר "הוסף למסך הבית"'); return; }
        installEvt.prompt();
        installEvt.userChoice.finally(function () { installEvt = null; inst.classList.add('is-hidden'); });
      });
      inst.id = 'ailon-install';
      inst.classList.add('is-hidden');
      dock.appendChild(inst);
    }
    if (document.querySelector('.ailon-fab')) dock.style.bottom = 'calc(var(--ailon-shell-gap) + 60px)';
    if (dock.children.length) document.body.appendChild(dock);

    window.addEventListener('keydown', function (e) {
      if (e.altKey && (e.key === 'h' || e.key === 'H') && !isPortal) { location.href = PORTAL; }
    });

    window.addEventListener('online', function () { var o = document.getElementById('ailon-offline'); if (o) o.remove(); });
    window.addEventListener('offline', function () {
      if (document.getElementById('ailon-offline')) return;
      var o = document.createElement('div');
      o.id = 'ailon-offline';
      o.className = 'ailon-offline';
      o.setAttribute('role', 'alert');
      o.textContent = 'אין חיבור לרשת — הנתונים עלולים שלא להתעדכן';
      document.body.appendChild(o);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
