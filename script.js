/* ============================================================================
   Petar Danadzhiev — personal site
   Data-driven: fetches data/*.json on load and generates each section's tabs.
   Vanilla JS. Accessible tabs · particle canvas · nav · contact form.
   (The old 3D cursor-tilt was removed for performance.)
   ============================================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ======================================================================
     Small helpers
     ====================================================================== */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // Like esc(), but turns newlines (a literal \n in the JSON string) into <br>.
  // Escapes FIRST so the text stays safe; use for prose fields, not labels.
  // Tip: a blank line between paragraphs is just two newlines (\n\n).
  function multiline(s) {
    return esc(s).replace(/\n/g, '<br>');
  }
  function setText(sel, txt) {
    var el = document.querySelector(sel);
    if (el) el.textContent = txt == null ? '' : txt;
  }

  /* ======================================================================
     Social icon set (keyed by `network` in the JSON)
     ====================================================================== */
  var ICONS = {
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-1 1.82-2.05 3.75-2.05C21.3 8.59 22 10.9 22 14v7h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21h-4V9Z"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1.4 2L12 12l7.6-5H4.4ZM20 8.2l-8 5.3-8-5.3V17h16V8.2Z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-7.5 8.6L23 22h-6.8l-5-6.6L5.4 22H2.3l8-9.2L2 2h6.9l4.6 6 5.4-6Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z"/></svg>',
    website: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-2.9a15.7 15.7 0 0 0-1.2-3.6A8 8 0 0 1 18.9 8ZM12 4.2c.8 1 1.5 2.4 1.9 3.8h-3.8c.4-1.4 1.1-2.8 1.9-3.8ZM4.3 14a8 8 0 0 1 0-4h3a17 17 0 0 0 0 4h-3Zm.8 2h2.9c.3 1.3.7 2.5 1.2 3.6A8 8 0 0 1 5.1 16Zm2.9-8H5.1a8 8 0 0 1 3.8-3.6A15.7 15.7 0 0 0 8 8Zm4 11.8c-.8-1-1.5-2.4-1.9-3.8h3.8c-.4 1.4-1.1 2.8-1.9 3.8Zm2.3-5.8H9.7a15 15 0 0 1 0-4h4.6a15 15 0 0 1 0 4Zm.7 5.4c.5-1.1.9-2.3 1.2-3.4h2.9a8 8 0 0 1-4.1 3.4ZM16.9 14a17 17 0 0 0 0-4h3a8 8 0 0 1 0 4h-3Z"/></svg>'
  };

  /* ======================================================================
     Content render helpers (compose into section panels)
     ====================================================================== */
  function renderTags(arr) {
    if (!arr || !arr.length) return '';
    return '<div class="tags">' + arr.map(function (t) {
      return '<span class="tag">' + esc(t) + '</span>';
    }).join('') + '</div>';
  }
  function renderBullets(arr) {
    if (!arr || !arr.length) return '';
    return '<ul class="bullets">' + arr.map(function (b) {
      return '<li>' + multiline(b) + '</li>';
    }).join('') + '</ul>';
  }
  function renderChips(arr) {
    return '<div class="chips">' + (arr || []).map(function (c) {
      return '<span class="chip">' + esc(c) + '</span>';
    }).join('') + '</div>';
  }
  function renderMeters(arr) {
    return '<div class="skills">' + (arr || []).map(function (s) {
      var lvl = Math.max(0, Math.min(100, Number(s.level) || 0));
      return '<div class="skill"><span class="skill__name">' + esc(s.name) +
        '</span><span class="meter" data-level="' + lvl + '"><i></i></span></div>';
    }).join('') + '</div>';
  }
  function renderList(arr) {
    return '<ul class="list">' + (arr || []).map(function (i) {
      return '<li><strong>' + esc(i.title) + '</strong><span>' + esc(i.meta) + '</span></li>';
    }).join('') + '</ul>';
  }
  function renderFacts(arr) {
    return '<ul class="facts">' + (arr || []).map(function (f) {
      return '<li><span>' + esc(f.label) + '</span><strong>' + esc(f.value) + '</strong></li>';
    }).join('') + '</ul>';
  }
  function renderLinks(arr) {
    if (!arr || !arr.length) return '';
    return '<p class="links">' + arr.map(function (l) {
      return '<a href="' + esc(l.href) + '" target="_blank" rel="noopener">' + esc(l.label) + ' ↗</a>';
    }).join(' ') + '</p>';
  }
  function renderSocials(arr) {
    return (arr || []).map(function (s) {
      var icon = ICONS[s.network] || ICONS.website;
      var label = s.network ? s.network.charAt(0).toUpperCase() + s.network.slice(1) : 'Link';
      var ext = s.network === 'email' ? '' : ' target="_blank" rel="noopener"';
      return '<li><a href="' + esc(s.href) + '"' + ext + ' aria-label="' + esc(label) + '">' + icon + '</a></li>';
    }).join('');
  }

  /* ======================================================================
     Tab labels + per-section panel builders
     ====================================================================== */
  function twoLineLabel(item) {
    return '<span class="tab__title">' + esc(item.title || item.label) + '</span>' +
      (item.meta ? '<span class="tab__meta">' + esc(item.meta) + '</span>' : '');
  }
  function textLabel(item) {
    return esc(item.label || item.title);
  }

  // Experience & education share the same "entry" layout (bullets optional).
  function entryPanel(item) {
    return '<div class="entry__head"><h3>' + esc(item.title) + '</h3>' +
      (item.org ? '<p class="entry__org">' + esc(item.org) + '</p>' : '') +
      (item.date ? '<p class="entry__date">' + esc(item.date) + '</p>' : '') + '</div>' +
      (item.summary ? '<p>' + multiline(item.summary) + '</p>' : '') +
      renderBullets(item.bullets) +
      renderTags(item.tags);
  }

  function projectsPanel(item) {
    // Labeled "stat" grid — only the fields that are filled in show up.
    var meta = [
      ['Duration', item.duration],
      ['Role', item.role],
      ['Team size', item.teamSize]
    ].filter(function (p) { return p[1] != null && p[1] !== ''; });
    var metaHtml = meta.length
      ? '<ul class="proj__meta">' + meta.map(function (p) {
          return '<li><span class="k">' + esc(p[0]) + '</span><span class="v">' + esc(p[1]) + '</span></li>';
        }).join('') + '</ul>'
      : '';

    return '<h3>' + esc(item.title) + '</h3>' +
      metaHtml +
      (item.summary ? '<p>' + multiline(item.summary) + '</p>' : '') +
      (item.responsibilities && item.responsibilities.length
        ? '<h4 class="proj__subhead">Main responsibilities</h4>' + renderBullets(item.responsibilities)
        : '') +
      (item.tools && item.tools.length
        ? '<h4 class="proj__subhead">Tools &amp; technologies</h4>' + renderTags(item.tools)
        : '') +
      renderLinks(item.links);
  }

  // Personal and skills tabs all declare a `type` per tab.
  function byTypePanel(item) {
    switch (item.type) {
      case 'text':   return '<h3>' + esc(item.heading) + '</h3><p>' + multiline(item.body) + '</p>';
      case 'facts':  return renderFacts(item.items);
      case 'chips':  return renderChips(item.items);
      case 'meters': return renderMeters(item.items);
      case 'list':   return renderList(item.items);
      default:       return '';
    }
  }

  /* ======================================================================
     Skill meters — fill to data-level (re-animates each time a panel opens)
     ====================================================================== */
  function setMeters(scope) {
    if (!scope) return;
    scope.querySelectorAll('.meter').forEach(function (m) {
      var lvl = m.getAttribute('data-level');
      var bar = m.querySelector('i');
      if (!bar || lvl === null) return;
      bar.style.width = '0%';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { bar.style.width = lvl + '%'; });
      });
    });
  }

  /* ======================================================================
     Accessible tabs (one initializer per [data-tabs] block, fully scoped)
     ====================================================================== */
  function initTabs(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) {
      return document.getElementById(t.getAttribute('aria-controls'));
    });

    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[j]) panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
      setMeters(panels[i]);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var ni = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ni = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ni = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') ni = 0;
        else if (e.key === 'End') ni = tabs.length - 1;
        if (ni !== null) { e.preventDefault(); select(ni, true); }
      });
    });
  }

  /* ======================================================================
     Generic tabbed-section builder — fills an existing .tabs scaffold
     ====================================================================== */
  function buildTabbedSection(tabsEl, items, labelFn, panelFn, panelTag) {
    var prefix = tabsEl.getAttribute('data-section');
    var tablist = tabsEl.querySelector('.tablist');
    var panels = tabsEl.querySelector('.tabpanels');
    if (!tablist || !panels) return;
    tablist.innerHTML = '';
    panels.innerHTML = '';

    (items || []).forEach(function (item, i) {
      var btn = document.createElement('button');
      btn.className = 'tab';
      btn.setAttribute('role', 'tab');
      btn.id = prefix + '-t' + i;
      btn.setAttribute('aria-controls', prefix + '-p' + i);
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      if (i !== 0) btn.tabIndex = -1;
      btn.innerHTML = labelFn(item);
      tablist.appendChild(btn);

      var panel = document.createElement(panelTag || 'div');
      panel.className = 'tabpanel';
      panel.setAttribute('role', 'tabpanel');
      panel.id = prefix + '-p' + i;
      panel.setAttribute('aria-labelledby', prefix + '-t' + i);
      panel.tabIndex = 0;
      if (i !== 0) panel.hidden = true;
      panel.innerHTML = panelFn(item);
      panels.appendChild(panel);
    });

    initTabs(tabsEl);
  }

  // Declare every tabbed section once; render in a loop.
  var SECTIONS = [
    { key: 'personal',       label: textLabel,    panel: byTypePanel,   tag: 'div' },
    { key: 'experience',     label: twoLineLabel, panel: entryPanel,    tag: 'article' },
    { key: 'education',      label: twoLineLabel, panel: entryPanel,    tag: 'article' },
    { key: 'courses',        label: twoLineLabel, panel: entryPanel,    tag: 'article' },
    { key: 'skills',         label: textLabel,    panel: byTypePanel,   tag: 'div' },
    { key: 'projects',       label: textLabel,    panel: projectsPanel, tag: 'article' }
  ];

  /* ======================================================================
     Hero + contact (not tab lists) — fill the static targets
     ====================================================================== */
  function renderHero(p) {
    if (!p) return;
    setText('#heroName', p.name);
    var roleEl = document.getElementById('heroRole');
    if (roleEl) {
      roleEl.innerHTML = esc(p.role) +
        (p.roleAccent ? ' · <span class="accent">' + esc(p.roleAccent) + '</span>' : '');
    }
    setText('#heroTagline', p.tagline);

    var status = document.querySelector('.hero__status');
    if (status && p.status) status.setAttribute('title', p.status);

    var cta = document.getElementById('heroCta');
    if (cta) {
      cta.innerHTML = (p.ctas || []).map(function (c) {
        var cls = c.style === 'ghost' ? 'btn btn--ghost' : 'btn btn--primary';
        return '<a class="' + cls + '" href="' + esc(c.href) + '"' + (c.download ? ' download' : '') + '>' + esc(c.label) + '</a>';
      }).join('');
    }

    var soc = document.getElementById('heroSocial');
    if (soc) soc.innerHTML = renderSocials(p.socials);
  }

  function renderContact(c, socials) {
    if (!c) return;
    var list = document.getElementById('contactList');
    if (list) {
      list.innerHTML = (c.details || []).map(function (d) {
        var val = d.href
          ? '<a href="' + esc(d.href) + '">' + esc(d.value) + '</a>'
          : '<span>' + esc(d.value) + '</span>';
        return '<li><span class="contact__ico" aria-hidden="true">' + esc(d.icon) + '</span>' + val + '</li>';
      }).join('');
    }
    var soc = document.getElementById('contactSocial');
    if (soc) soc.innerHTML = renderSocials(socials);
  }

  function animateVisibleMeters() {
    document.querySelectorAll('.tabpanel:not([hidden])').forEach(setMeters);
  }

  /* ======================================================================
     Floating particle "constellation" canvas (data-independent)
     ====================================================================== */
  function startParticles() {
    var canvas = document.getElementById('particles');
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext('2d');
    var w, h, dpr, pts, raf, running = false;

    function build() {
      // Cap DPR at 1.5: a full-screen canvas at 2x is ~4x the fill-rate for a
      // faint decorative layer nobody inspects pixel-for-pixel.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      var count = Math.min(60, Math.floor(window.innerWidth * window.innerHeight / 24000));
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28 * dpr,
          vy: (Math.random() - 0.5) * 0.28 * dpr,
          r: (Math.random() * 1.6 + 0.6) * dpr
        });
      }
    }

    function step() {
      running = true;
      ctx.clearRect(0, 0, w, h);
      var link = 110 * dpr, link2 = link * link;
      var i, j, p, q, dx, dy;

      // Advance all points first (cheap, no drawing).
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
      }

      // All connecting lines in ONE path + ONE stroke (was one stroke() per
      // pair — thousands of draw calls per frame). Uniform alpha instead of a
      // per-distance fade; the difference is imperceptible for this effect.
      ctx.strokeStyle = 'rgba(255, 120, 30, 0.14)';
      ctx.lineWidth = dpr * 0.6;
      ctx.beginPath();
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        for (j = i + 1; j < pts.length; j++) {
          q = pts[j];
          dx = p.x - q.x; dy = p.y - q.y;
          if (dx * dx + dy * dy < link2) {
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
          }
        }
      }
      ctx.stroke();

      // All dots in ONE path + ONE fill.
      ctx.fillStyle = 'rgba(255, 150, 60, 0.7)';
      ctx.beginPath();
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        ctx.moveTo(p.x + p.r, p.y);
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      ctx.fill();

      raf = requestAnimationFrame(step);
    }

    build();
    step();

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(build, 200);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); running = false; }
      else if (!running) { step(); }
    });
  }

  /* ======================================================================
     Navigation — mobile toggle + active-link highlight on scroll
     ====================================================================== */
  function initNav() {
    var toggle = document.getElementById('navToggle');
    var navLinks = document.getElementById('navLinks');
    if (toggle && navLinks) {
      toggle.addEventListener('click', function () {
        var open = navLinks.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
      navLinks.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          navLinks.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    var linkEls = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
    if (linkEls.length && 'IntersectionObserver' in window) {
      var byId = {};
      linkEls.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var link = byId[en.target.id];
            if (link) {
              linkEls.forEach(function (a) { a.classList.remove('is-active'); });
              link.classList.add('is-active');
            }
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      document.querySelectorAll('main section[id]').forEach(function (s) { io.observe(s); });
    }
  }

  function setYear() {
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  }

  function showLoadError(err) {
    var banner = document.getElementById('loadError');
    if (banner) banner.hidden = false;
    console.error('Site data failed to load:', err);
  }

  /* ======================================================================
     Data loading + boot
     ====================================================================== */
  function loadData() {
    var names = ['profile', 'personal', 'experience', 'education', 'courses', 'skills', 'projects', 'contact'];
    return Promise.all(names.map(function (n) {
      return fetch('data/' + n + '.json').then(function (res) {
        if (!res.ok) throw new Error(n + '.json → HTTP ' + res.status);
        return res.json();
      }).then(function (data) { return [n, data]; });
    })).then(function (entries) {
      var out = {};
      entries.forEach(function (e) { out[e[0]] = e[1]; });
      return out;
    });
  }

  function boot() {
    // Pieces that don't depend on the JSON — start them right away.
    startParticles();
    initNav();
    setYear();

    loadData().then(function (data) {
      renderHero(data.profile);

      SECTIONS.forEach(function (s) {
        var el = document.querySelector('.tabs[data-section="' + s.key + '"]');
        if (el) buildTabbedSection(el, data[s.key], s.label, s.panel, s.tag);
      });

      renderContact(data.contact, data.profile && data.profile.socials);
      animateVisibleMeters();
    }).catch(showLoadError);
  }

  boot();
})();
