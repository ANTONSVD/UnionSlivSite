'use strict';

/* ================= utils ================= */

const $ = id => document.getElementById(id);

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function jsq(s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;');
}

function stripHtml(s) {
  return String(s == null ? '' : s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

function fmtSize(bytes) {
  if (bytes == null || bytes === '') return '';
  const n = Number(bytes);
  if (!n) return '0 Б';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  let i = 0, v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return (i ? v.toFixed(1).replace(/\.0$/, '') : String(v)) + ' ' + units[i];
}

function fmtCount(n) {
  n = Number(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'М';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'К';
  return String(n);
}

function fmtInt(n) {
  return String(Number(n) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function initial(name) {
  name = String(name || '').trim();
  return name ? Array.from(name)[0].toUpperCase() : '?';
}

function fmtDate(ms, withTime) {
  if (!ms) return '';
  const d = new Date(ms);
  const p = n => String(n).padStart(2, '0');
  const date = `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  return withTime ? `${date}, ${p(d.getHours())}:${p(d.getMinutes())}` : date;
}

const PALETTES = [
  ['#7c3aed', '#db2777'],
  ['#6366f1', '#22d3ee'],
  ['#8b5cf6', '#ec4899'],
  ['#4f46e5', '#a855f7'],
  ['#0ea5e9', '#6366f1'],
  ['#a21caf', '#f472b6'],
  ['#7e22ce', '#3b82f6'],
  ['#db2777', '#f59e0b'],
];

function hashStr(s) {
  let h = 0;
  for (const ch of String(s || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

// Stable per-message key used to jump to a specific message from search.
function msgKey(m) {
  if (m.i) return 'i:' + m.i;
  return 'h:' + hashStr((m.t || 0) + '|' + (m.n || '') + '|' + (m.c || ''));
}

function paletteFor(name) {
  return PALETTES[hashStr(name) % PALETTES.length];
}

/* ---------- icons ---------- */

const ICONS = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  sheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
  site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
  pres: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20M12 3v18M8 21h8"/><path d="M6 7h3l-1.5 4H7.5L6 7zM13 7h5l-1.5 4H14.5L13 7z"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="14" height="14" rx="2"/><path d="M16 10l6-3v10l-6-3"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
};

function gdocIcon(type) {
  const t = ['doc', 'sheet', 'pres', 'video', 'site'].includes(type) ? type : 'site';
  return `<span class="gdoc-ico ${t}">${ICONS[t]}</span>`;
}

/* ================= state ================= */

const state = {
  index: null,
  rendered: { server: false, dms: false, docs: false, media: false },
  _prevTab: 'home',
  chat: null,
  nextChunk: 0,
  loading: false,
  lastDayKey: null,
  firstDayKey: null,
  pendingMk: null,
  search: { controller: null, q: '', idx: 0 },
  toastTimer: null,
  commits: null,
};

/* ================= fx: particles ================= */

function initFx() {
  const cv = $('fx');
  if (!cv || !cv.getContext) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = cv.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0, pts = [], raf = null, running = true;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * DPR;
    cv.height = H * DPR;
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.max(28, Math.min(90, Math.floor(W * H / 20000)));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.6 + 0.6,
      hue: [233, 258, 265, 283, 302][Math.floor(Math.random() * 5)],
    }));
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const LINK = 120;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
      const mx = mouse.x - p.x, my = mouse.y - p.y;
      const md = Math.hypot(mx, my);
      if (md < 130) { p.x -= mx * 0.012; p.y -= my * 0.012; }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fillStyle = 'hsla(' + p.hue + ', 92%, 76%, 0.65)';
      ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          const d = Math.sqrt(d2);
          const o = (1 - d / LINK) * 0.16;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = 'hsla(258, 90%, 80%, ' + o + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(step);
  }

  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; raf = requestAnimationFrame(step); }
  });
  resize();
  raf = requestAnimationFrame(step);
}

/* ================= fx: tilt + magnet + spotlight ================= */

function initTilt() {
  if (matchMedia('(hover:none)').matches) return;
  document.addEventListener('pointermove', e => {
    const t = e.target && e.target.closest ? e.target.closest('[data-tilt]') : null;
    if (t) {
      const r = t.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
      t.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
  }, { passive: true });
  document.addEventListener('pointerout', e => {
    const t = e.target && e.target.closest ? e.target.closest('[data-tilt]') : null;
    if (t) t.style.transform = '';
  }, { passive: true });
}

function initMagnet() {
  if (matchMedia('(hover:none)').matches) return;
  document.addEventListener('pointermove', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-magnet]') : null;
    if (b) {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.18;
      const y = (e.clientY - r.top - r.height / 2) * 0.18;
      b.style.transform = `translate(${x}px, ${y}px)`;
    }
  }, { passive: true });
  document.addEventListener('pointerout', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-magnet]') : null;
    if (b) b.style.transform = '';
  }, { passive: true });
}

function bindSpotlight() {
  document.addEventListener('pointermove', e => {
    const st = e.target && e.target.closest ? e.target.closest('.stat') : null;
    if (!st) return;
    const r = st.getBoundingClientRect();
    st.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    st.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
}

/* ================= animations ================= */

function countUp(el, target, format) {
  const dur = 1100;
  const start = performance.now();
  const fmt = format || (n => fmtInt(n));
  const step = now => {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = fmt(target);
  };
  requestAnimationFrame(step);
}

let revealObserver = null;

function observeReveals() {
  const els = document.querySelectorAll('.reveal:not(.in)');
  if (!els.length) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          revealObserver.unobserve(e.target);
        }
      }
    }, { threshold: 0.1 });
  }
  els.forEach(el => revealObserver.observe(el));
}

function animateStats(rootEl) {
  rootEl.querySelectorAll('[data-count]').forEach(el => {
    const target = Number(el.dataset.count) || 0;
    const fmt = el.dataset.fmt === 'short' ? fmtCount : fmtInt;
    countUp(el, target, fmt);
  });
}

/* ================= views ================= */

function switchTab(name) {
  const cur = document.querySelector('.view.active');
  if (cur) {
    const cid = cur.id.replace('view-', '');
    if (cid !== name) state._prevTab = cid;
  }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = $('view-' + name);
  if (view) view.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === name));
  moveTabPill();
  window.scrollTo(0, 0);
  if (!state.index) return;
  if (name === 'server' && !state.rendered.server) { state.rendered.server = true; renderServer(); }
  if (name === 'dms' && !state.rendered.dms) { state.rendered.dms = true; renderDmGroups(); }
  if (name === 'docs' && !state.rendered.docs) { state.rendered.docs = true; renderDocs(); }
  if (name === 'media' && !state.rendered.media) { state.rendered.media = true; renderMedia(); }
  requestAnimationFrame(observeReveals);
}

function backToBrowse() { switchTab(state._prevTab || 'home'); }

/* ================= hero: live preview ================= */

function initHeroPreview() {
  const list = $('hpMsgs');
  if (!list || !state.index) return;
  let chat = null;
  try {
    chat = [...state.index.chats].filter(c => c.chunks && c.chunks.length)
      .sort((a, b) => b.count - a.count)[0];
  } catch (e) { return; }
  if (!chat) return;
  const title = $('hpTitle');
  if (title) title.textContent = chat.title;

  let stopped = false;
  let i = 0;
  let cur = [];

  const pump = async () => {
    if (stopped) return;
    try {
      const res = await fetch(chat.chunks[0]);
      const msgs = (await res.json()).filter(m => !m.sy && (m.c || m.a));
      if (msgs.length) cur = msgs;
      if (!cur.length) { stopped = true; return; }
      addNext();
    } catch (e) {
      stopped = true;
      list.innerHTML = '<div class="hp-msg in"><div class="hp-body"><div class="hp-text">Превью недоступно.</div></div></div>';
    }
  };

  const addNext = () => {
    if (stopped) return;
    const m = cur[i % cur.length];
    i++;
    const row = document.createElement('div');
    row.className = 'hp-msg';
    const [c1, c2] = paletteFor(m.n);
    row.innerHTML = `
      <span class="hp-av" style="background:linear-gradient(135deg,${c1},${c2})">${esc(initial(m.n))}</span>
      <div class="hp-body">
        <div class="hp-name">${esc(m.n || 'Неизвестно')}</div>
        <div class="hp-text">${esc(stripHtml(m.c || '').slice(0, 180) || '📎 вложение')}</div>
      </div>`;
    list.appendChild(row);
    requestAnimationFrame(() => row.classList.add('in'));
    while (list.children.length > 6) list.removeChild(list.firstChild);
    setTimeout(addNext, 1500 + Math.random() * 1600);
  };

  pump();
}

/* ================= marquee ================= */

function initMarquee() {
  const track = $('mqTrack');
  if (!track || !state.index) return;
  const chats = [...state.index.chats].sort((a, b) => b.count - a.count).slice(0, 40);
  const once = chats.map(c =>
    `<button type="button" class="mq-item" title="${esc(c.title)}" onclick="openChat('${jsq(c.id)}')">${esc(c.title)}<span class="mq-sep">✦</span></button>`).join('');
  track.innerHTML = once + once;
}

/* ================= home ================= */

function renderHome() {
  const idx = state.index;
  const s = idx.stats;
  const gen = idx.generated ? fmtDate(new Date(idx.generated).getTime(), true) : '—';
  const latestCommit = state.commits && state.commits.length
    ? fmtDate(new Date(state.commits[0].commit.author.date).getTime(), true)
    : null;

  $('chipMsgs').textContent = fmtInt(s.messages);
  $('chipChats').textContent = fmtCount(s.chats);

  const statTiles = [
    { n: s.messages, lbl: 'Сообщений', ico: 'chat', accent: true },
    { n: s.chats, lbl: 'Чатов', ico: 'grid', fmt: 'short' },
    { n: s.docs + (idx.google_docs ? idx.google_docs.length : 0), lbl: 'Документов', ico: 'doc' },
    { n: s.media, lbl: 'Медиафайлов', ico: 'image' },
    { text: latestCommit || gen, lbl: 'Последнее обновление', ico: 'clock', wide: true },
  ];

  $('heroStats').innerHTML = statTiles.map(t => {
    const num = t.text != null
      ? `<span class="stat-num plain">${esc(t.text)}</span>`
      : `<span class="stat-num" data-count="${t.n}"${t.fmt ? ' data-fmt="' + t.fmt + '"' : ''}>0</span>`;
    return `<div class="stat${t.accent ? ' accent' : ''}${t.wide ? ' stat-wide' : ''}" data-tilt>
      <div class="stat-top"><span class="stat-ico">${ICONS[t.ico]}</span></div>
      ${num}<span class="stat-lbl">${t.lbl}</span>
    </div>`;
  }).join('');
  animateStats($('heroStats'));

  renderRecent();
  observeReveals();
}

function renderRecent() {
  const top = [...state.index.chats].sort((a, b) => b.count - a.count).slice(0, 8);
  let html = `
    <div class="section-title"><span class="st-num">01</span> Топ чатов</div>
    <div class="chat-grid">${top.map(chatCard).join('')}</div>`;
  if (state.commits && state.commits.length) {
    html += `
    <div class="section-title"><span class="st-num">02</span> Последние обновления</div>
    <div class="panel upd-list">${state.commits.map(commitRow).join('')}</div>`;
  }
  $('recentList').innerHTML = html;
}

function commitRow(c) {
  const msg = String(c.commit.message || '').split('\n')[0] || 'Коммит';
  const short = String(c.sha || '').slice(0, 7);
  const when = fmtDate(new Date(c.commit.author.date).getTime(), true);
  const author = c.commit.author.name || '';
  return `
    <a class="upd-item" href="${esc(c.html_url)}" target="_blank" rel="noopener">
      <span class="upd-msg">${esc(msg)}</span>
      <span class="upd-meta">
        <span class="upd-auth">${esc(author)}</span>
        <span class="upd-sha">${esc(short)}</span>
        <span class="upd-date">${esc(when)}</span>
      </span>
    </a>`;
}

function fetchCommits() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  fetch('https://api.github.com/repos/ANTONSVD/UnionSlivSite/commits?per_page=6', {
    headers: { 'Accept': 'application/vnd.github+json' },
    signal: ctrl.signal
  })
    .then(r => {
      if (!r.ok) throw new Error('GitHub API ' + r.status);
      return r.json();
    })
    .then(data => {
      state.commits = Array.isArray(data) ? data : [];
      applyCommits();
    })
    .catch(() => {
      state.commits = state.commits || [];
      applyCommits();
    })
    .finally(() => clearTimeout(timer));
}

function applyCommits() {
  const list = state.commits || [];
  if (list.length) {
    const tile = document.querySelector('#heroStats .stat-wide .stat-num');
    if (tile) tile.textContent = fmtDate(new Date(list[0].commit.author.date).getTime(), true);
  }
  if (state.index) {
    renderRecent();
    observeReveals();
  }
}

function chatCard(c) {
  return `
    <a class="chat-card reveal" data-tilt onclick="openChat('${jsq(c.id)}')">
      <div class="cc-body">
        <div class="cc-info">
          <div class="cc-title">${esc(c.title)}</div>
          <div class="cc-sub"><span class="dot"></span>${esc(c.group)}</div>
        </div>
        <span class="cc-count">${fmtCount(c.count)}</span>
        <span class="cc-arrow">${ICONS.up}</span>
      </div>
    </a>`;
}

/* ================= server ================= */

function renderServer() {
  const list = state.index.chats.filter(c => c.group === 'Серверные чаты');
  $('serverList').innerHTML = `
    <div class="view-head">
      <div class="vh-eyebrow">СЕРВЕР</div>
      <h2 class="vh-title">Серверные <span class="grad">чаты</span></h2>
      <p class="vh-sub">${list.length} каналов · вся переписка сервера в одном архиве.</p>
    </div>
    <div class="chat-grid" style="margin-top:24px">${list.map(chatCard).join('')}</div>`;
  observeReveals();
}

/* ================= DMs ================= */

const ACCOUNTS = ['Ash Raw', 'kwetty', 'PABLO RIVERA', 'Racer thore'];

function dmTitle(c) {
  return String(c.title).replace(/^Direct Messages - /, '').trim() || 'Неизвестно';
}

function renderDmGroups() {
  const by = {};
  for (const c of state.index.chats) {
    if (!ACCOUNTS.includes(c.group)) continue;
    (by[c.group] = by[c.group] || []).push(c);
  }
  let html = `
    <div class="view-head">
      <div class="vh-eyebrow">ЛИЧНОЕ</div>
      <h2 class="vh-title">Переписки <span class="grad">участников</span></h2>
      <p class="vh-sub">Личные диалоги по аккаунтам архива.</p>
    </div>`;
  const acctMeta = state.index.accounts || {};
  for (const acct of ACCOUNTS) {
    const list = by[acct];
    if (!list || !list.length) continue;
    const meta = acctMeta[acct] || {};
    const avHtml = meta.av
      ? `<img class="dg-av" src="${esc(meta.av)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`
      : `<span class="dg-av dg-av-letter" style="background:linear-gradient(135deg,${paletteFor(acct)[0]},${paletteFor(acct)[1]})">${esc(initial(acct))}</span>`;
    const nickHtml = meta.name && meta.name !== acct ? `<span class="dg-nick">${esc(meta.name)}</span>` : '';
    html += `
      <div class="dm-group reveal">
        <div class="dg-title">${avHtml}<span class="dg-txt">${esc(acct)}${nickHtml}</span><span class="dg-count">${list.length} диалога</span></div>
        <div class="dm-grid">${list.map(dmCard).join('')}</div>
      </div>`;
  }
  $('dmGroups').innerHTML = html;
  observeReveals();
}

function dmCard(c) {
  const nm = dmTitle(c);
  const [c1, c2] = paletteFor(nm);
  const av = c.av
    ? `<div class="dm-avatar" style="background:linear-gradient(135deg,${c1},${c2})">${esc(initial(nm))}<img src="${esc(c.av)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></div>`
    : `<div class="dm-avatar" style="background:linear-gradient(135deg,${c1},${c2})">${esc(initial(nm))}</div>`;
  return `
    <div class="dm-card" data-tilt onclick="openChat('${jsq(c.id)}')">
      ${av}
      <div class="dm-info">
        <div class="dm-name">${esc(nm)}</div>
        <div class="dm-sub">${fmtCount(c.count)} сообщений</div>
      </div>
    </div>`;
}

/* ================= docs ================= */

function renderGoogleDocs() {
  const docs = state.index.google_docs;
  const host = document.createElement('div');
  if (!docs || !docs.length) {
    host.innerHTML = '<div class="panel"><div class="panel-title">Google Документы</div><p class="empty">Нет ссылок.</p></div>';
    $('googleDocs').appendChild(host);
    return;
  }
  const groups = [];
  const order = [];
  for (const d of docs) {
    if (!order.includes(d.group)) { order.push(d.group); groups[d.group] = []; }
    groups[d.group].push(d);
  }
  host.innerHTML = order.map(g => `
    <div class="gdoc-group reveal">
      <div class="dg-title">${esc(g)} <span class="dg-count">${groups[g].length}</span></div>
      <div class="gdoc-grid">${groups[g].map(gdocCard).join('')}</div>
    </div>`).join('');
  $('googleDocs').appendChild(host);
  observeReveals();
}

function gdocCard(d) {
  return `
    <a class="gdoc-card" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">
      ${gdocIcon(d.type)}
      <div class="gdoc-body">
        <div class="gdoc-name">${esc(d.title)}</div>
        <div class="gdoc-desc">${esc(d.desc || '')}</div>
      </div>
      <span class="gdoc-open">${ICONS.arrow}</span>
    </a>`;
}

function renderDocs() {
  renderGoogleDocs();
  const docs = state.index.docs;
  $('docList').innerHTML = docs.length ? `
    <div class="section-title"><span class="st-num">03</span> Документы из архива · ${docs.length}</div>
    <div class="doc-list reveal">${docs.map(docCard).join('')}</div>` : '';
  observeReveals();
}

function docCard(d) {
  return `
    <div class="doc-card" onclick="openDoc('${esc(d.id)}')">
      <div class="doc-ico">${ICONS.file}</div>
      <div>
        <div class="doc-name">${esc(d.title)}</div>
        <div class="doc-size">${fmtSize(d.size)} · ${esc(d.file)}</div>
      </div>
    </div>`;
}

function openDoc(id) {
  const d = state.index.docs.find(x => x.id === id);
  if (!d) return;
  $('googleDocs').style.display = 'none';
  $('docList').style.display = 'none';
  $('docViewer').style.display = 'block';
  $('docTitle').textContent = d.title;
  $('docMeta').textContent = `${fmtSize(d.size)} · ${d.file}`;
  $('docContent').textContent = d.content;
  window.scrollTo(0, 0);
}

function closeDoc() {
  $('docViewer').style.display = 'none';
  $('docList').style.display = '';
  $('googleDocs').style.display = '';
}

/* ================= media ================= */

function renderMedia() {
  const cats = state.index.media;
  const keys = Object.keys(cats);
  let html = '';
  for (const cat of keys) {
    const items = cats[cat];
    html += `
      <div class="mc reveal">
        <div class="mc-title">${esc(cat)}<span class="mc-count">· ${items.length}</span></div>
        <div class="mc-grid">${items.map(mediaItem).join('')}</div>
      </div>`;
  }
  $('mediaCats').innerHTML = html ||
    '<div class="panel"><p class="empty">Нет медиа.</p></div>';
  observeReveals();
}

function mediaItem(it) {
  const url = it.file;
  if (it.type === 'image') {
    return `
      <div class="media-item" onclick="openLightbox('${esc(url)}','${esc(it.name)}')">
        <img loading="lazy" src="${esc(url)}" alt="${esc(it.name)}" onerror="this.style.display='none'">
        <span class="mi-badge">Фото</span>
        <div class="mi-name">${esc(it.name)}</div>
      </div>`;
  }
  if (it.type === 'video') {
    return `
      <div class="media-item" onclick="openLightbox('${esc(url)}','${esc(it.name)}',true)">
        <video preload="metadata" muted playsinline src="${esc(url)}"></video>
        <span class="mi-badge">Видео</span>
        <div class="mi-name">${esc(it.name)}</div>
      </div>`;
  }
  if (it.type === 'audio') {
    return `
      <div class="media-item audio-item">
        <div class="mi-file">${esc(it.name)}</div>
        <audio controls preload="none" src="${esc(url)}"></audio>
      </div>`;
  }
  return `
    <a class="media-item file-item" href="${esc(url)}" download>
      <span class="mi-ficon">${ICONS.file}</span>
      <div class="mi-file">${esc(it.name)}</div>
      <div class="mi-name" style="position:static;opacity:1;transform:none;background:none;padding:0">${fmtSize(it.size)}</div>
    </a>`;
}

/* ================= lightbox ================= */

function openLightbox(url, caption, isVideo) {
  const lb = $('lightbox');
  const oldV = $('lbVideo');
  if (oldV) oldV.remove();
  const img = $('lbImg');
  img.style.display = isVideo ? 'none' : 'block';
  $('lbCaption').textContent = caption || '';
  if (isVideo) {
    const v = document.createElement('video');
    v.id = 'lbVideo';
    v.src = url;
    v.controls = true;
    v.autoplay = true;
    v.addEventListener('click', e => e.stopPropagation());
    lb.insertBefore(v, $('lbCaption'));
  } else {
    img.src = url;
  }
  lb.classList.add('show');
}

function closeLightbox() {
  const lb = $('lightbox');
  lb.classList.remove('show');
  const v = $('lbVideo');
  if (v) { v.pause(); v.remove(); }
  const img = $('lbImg');
  img.src = '';
  img.style.display = 'block';
}

/* ================= chat ================= */

async function openChat(id, mk) {
  const c = state.index.chats.find(x => x.id === id);
  if (!c) return;
  state.chat = c;
  state.nextChunk = c.chunks.length - 1;   // newest chunk first
  state.loading = false;
  state.pendingMk = mk || null;
  state.lastDayKey = null;
  state.firstDayKey = null;
  closeCmd();
  $('chatHead').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;min-width:0">
      <button class="btn btn-ghost" style="padding:7px 12px;font-size:13px" onclick="backToBrowse()">&#8592; Назад</button>
      <div style="min-width:0">
        <div class="ch-title">${esc(c.title)}</div>
        <div class="ch-sub">${esc(c.group)} · ${fmtCount(c.count)} сообщений · ${esc(c.src || '')}${c.merged ? ' · объединён' : ''}</div>
      </div>
    </div>`;
  $('chatScroll').innerHTML = '';
  $('chatLoading').style.display = 'none';
  switchTab('chat');
  fillChatSide();
  await loadChunk('init');
  if (state.pendingMk) await scanForMk();
}

function fillChatSide() {
  const c = state.chat;
  const list = state.index.chats
    .filter(x => x.group === c.group)
    .sort((a, b) => b.count - a.count);
  $('chatSide').innerHTML = `<div class="cs-title">${esc(c.group)}</div>` +
    list.map(x => `
      <div class="cs-item ${x.id === c.id ? 'active' : ''}" onclick="openChat('${jsq(x.id)}')">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.title)}</span>
        <span class="cs-count">${fmtCount(x.count)}</span>
      </div>`).join('');
}

function dayDividerNode(t) {
  const d = document.createElement('div');
  d.className = 'day-divider';
  d.innerHTML = `<span>${esc(fmtDate(t, false))}</span>`;
  return d;
}

function dateFromDayKey(dk) {
  const [y, mo, d] = String(dk).split('-').map(Number);
  return new Date(y, mo - 1, d).getTime();
}

// Loads chat chunks. 'init' shows the newest chunk (bottom); 'older' prepends
// the next older chunk above when the user scrolls up.
async function loadChunk(mode) {
  const c = state.chat;
  if (!c || state.loading) return;
  if (state.nextChunk < 0) return;            // nothing older left
  state.loading = true;
  $('chatLoading').style.display = 'flex';
  try {
    const k = state.nextChunk;
    const res = await fetch(c.chunks[k]);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const msgs = await res.json();
    state.nextChunk--;                         // walk toward the oldest
    const scroll = $('chatScroll');
    if (mode === 'init') {
      const frag = document.createDocumentFragment();
      let prevDay = state.lastDayKey;          // null on first open
      for (const m of msgs) {
        const dk = m.t ? dayKey(m.t) : null;
        if (dk && dk !== prevDay) { frag.appendChild(dayDividerNode(m.t)); prevDay = dk; }
        frag.appendChild(renderMessage(m));
      }
      if (msgs.length) state.lastDayKey = dayKey(msgs[msgs.length - 1].t);
      scroll.appendChild(frag);
      scroll.scrollTop = scroll.scrollHeight;  // show the newest messages
    } else {                                   // 'older' -> prepend above
      const frag = document.createDocumentFragment();
      const topEl = scroll.firstChild;
      const topDay = (topEl && topEl.dataset && topEl.dataset.day)
        ? topEl.dataset.day : state.firstDayKey;
      let prevDay = msgs.length ? dayKey(msgs[0].t) : null;
      for (let j = 0; j < msgs.length; j++) {
        const m = msgs[j];
        const dk = m.t ? dayKey(m.t) : null;
        if (j > 0 && dk !== prevDay) frag.appendChild(dayDividerNode(m.t));
        prevDay = dk;
        frag.appendChild(renderMessage(m));
      }
      const lastDay = msgs.length ? dayKey(msgs[msgs.length - 1].t) : null;
      if (lastDay && topDay && lastDay !== topDay) {
        frag.appendChild(dayDividerNode(dateFromDayKey(topDay)));
      }
      const prevTop = scroll.scrollTop;
      const prevH = scroll.scrollHeight;
      scroll.insertBefore(frag, scroll.firstChild);
      scroll.scrollTop = prevTop + (scroll.scrollHeight - prevH);
      if (msgs.length) state.firstDayKey = dayKey(msgs[0].t);
    }
  } catch (e) {
    console.error('loadChunk:', e);
    toast('Не удалось загрузить сообщения');
  } finally {
    state.loading = false;
    $('chatLoading').style.display = 'none';
  }
}

// Walk backward through chunks to locate a specific message (from search).
async function scanForMk() {
  const mk = state.pendingMk;
  if (!mk) return;
  const safe = s => String(s).replace(/["\\]/g, '\\$&');
  for (let guard = 0; guard < 5000; guard++) {
    const el = document.querySelector(`.msg[data-mk="${safe(mk)}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 1800);
      state.pendingMk = null;
      return;
    }
    if (state.nextChunk < 0) break;            // searched everything
    await loadChunk('older');
  }
  state.pendingMk = null;
  const scroll = $('chatScroll');
  scroll.scrollTop = scroll.scrollHeight;      // fallback: show newest
}

function dayKey(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/* ================= message rendering ================= */

function renderMessage(m) {
  const div = document.createElement('div');
  div.className = 'msg';
  div.dataset.mk = msgKey(m);
  if (m.sy) {
    div.classList.add('sys');
    div.innerHTML = `<div class="msg-content">${esc(m.sy)}</div>`;
    return div;
  }
  const col = paletteFor(m.n);
  const c1 = m.cs || col[0];
  const avHtml = m.av
    ? `<div class="msg-av-wrap"><div class="msg-av" style="background:linear-gradient(135deg,${c1},${col[1]})"><span>${esc(initial(m.n))}</span><img src="${esc(m.av)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></div></div>`
    : `<div class="msg-av-wrap"><div class="msg-av" style="background:linear-gradient(135deg,${c1},${col[1]})">${esc(initial(m.n))}</div></div>`;

  const body = `
    <div class="msg-body">
      <div class="msg-head">
        <span class="msg-name" style="color:${c1}">${esc(m.n || 'Неизвестно')}</span>
        <span class="msg-time">${m.d ? esc(m.d) : fmtDate(m.t, true)}</span>
      </div>
      ${m.r ? `<div class="msg-reply"><span class="rr">&#8617; ${esc(m.r.n || '')}</span><span>${esc(m.r.c || '')}</span></div>` : ''}
      ${m.c ? `<div class="msg-content">${m.c}</div>` : ''}
      ${renderAttachments(m.a)}
      ${renderEmbeds(m.e)}
      ${m.st ? m.st.map(s => `<img class="sticker" src="${esc(s)}" alt="sticker" loading="lazy">`).join('') : ''}
    </div>`;

  div.innerHTML = avHtml + body;
  if (m.t) div.dataset.day = dayKey(m.t);
  return div;
}

function renderAttachments(atts) {
  if (!atts || !atts.length) return '';
  const items = atts.map(a => {
    if (a.k === 'image') {
      const src = a.s || a.u || '';
      return `<img class="att-img" src="${esc(src)}" alt="${esc(a.t || '')}" loading="lazy"
               referrerpolicy="no-referrer" onclick="openLightbox('${esc(src)}','${esc(a.t || '')}')"
               onerror="this.style.display='none'">`;
    }
    if (a.k === 'video') {
      return `<video class="att-video" controls preload="metadata" src="${esc(a.s || a.u || '')}"></video>`;
    }
    if (a.k === 'audio') {
      return `<audio class="att-audio" controls preload="none" src="${esc(a.s || a.u || '')}"></audio>`;
    }
    return `<a class="att-file" href="${esc(a.u || a.s || '#')}" target="_blank" rel="noopener">
      <span>${esc(a.n || a.t || 'Файл')}</span> <span class="sz">${esc(a.sz || '')}</span></a>`;
  }).join('');
  return `<div class="attachments">${items}</div>`;
}

function renderEmbeds(embs) {
  if (!embs || !embs.length) return '';
  const items = embs.map(e => `
    <div class="embed" style="${e.cl ? 'border-left-color:' + e.cl + ';' : ''}">
      ${e.a ? `<div class="emb-author">${esc(e.a)}</div>` : ''}
      ${e.t ? `<div class="emb-title">${e.u ? `<a href="${esc(e.u)}" target="_blank" rel="noopener">${esc(e.t)}</a>` : esc(e.t)}</div>` : ''}
      ${e.d ? `<div class="emb-desc">${esc(e.d)}</div>` : ''}
      ${e.im ? `<img class="emb-thumb" src="${esc(e.im)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ''}
      ${e.th ? `<img class="emb-thumb" src="${esc(e.th)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">` : ''}
    </div>`).join('');
  return `<div class="embeds">${items}</div>`;
}

/* ================= command palette / search ================= */

function openCmd() {
  state.search.idx = 0;
  state.search.q = '';
  const input = $('cmdInput');
  input.value = '';
  $('cmdProgressRow').style.display = 'none';
  $('cmdResults').innerHTML = `<div class="cmd-empty">Начните вводить запрос — найду по всем 290 000+ сообщениям.</div>`;
  $('cmd').classList.add('show');
  $('cmdBackdrop').classList.add('show');
  setTimeout(() => input.focus(), 60);
}

function closeCmd() {
  if (state.search.controller) state.search.controller.abort();
  $('cmd').classList.remove('show');
  $('cmdBackdrop').classList.remove('show');
}

function bindCmd() {
  const input = $('cmdInput');
  let timer = null;
  const go = () => {
    const q = input.value.trim();
    if (q.length < 2) { showCmdResults(null, q); return; }
    runCmdSearch(q);
  };
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(go, 400);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCmd(); input.blur(); return; }
    const rows = [...document.querySelectorAll('.cmd-row')];
    if (!rows.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.search.idx = Math.min(rows.length - 1, state.search.idx + 1);
      markCmdRow(rows);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.search.idx = Math.max(0, state.search.idx - 1);
      markCmdRow(rows);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = rows[state.search.idx] || rows[0];
      if (row) openChat(row.dataset.chat, row.dataset.mk);
    }
  });
  $('cmdResults').addEventListener('click', e => {
    const row = e.target.closest('.cmd-row');
    if (row) openChat(row.dataset.chat, row.dataset.mk);
  });
  document.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;
    if ((ctrl && (e.key === 'k' || e.key === 'K')) || e.key === '/') {
      e.preventDefault();
      $('cmd').classList.contains('show') ? closeCmd() : openCmd();
    }
  });
}

function markCmdRow(rows) {
  rows.forEach((r, i) => r.classList.toggle('active', i === state.search.idx));
  const active = rows[state.search.idx];
  if (active) active.scrollIntoView({ block: 'nearest' });
}

async function runCmdSearch(q) {
  const idx = state.index;
  if (!idx) return;
  if (state.search.controller) state.search.controller.abort();
  const controller = new AbortController();
  state.search.controller = controller;
  state.search.q = q;
  const results = [];
  const total = idx.chats.reduce((s, c) => s + c.chunks.length, 0);
  let done = 0;
  const ql = q.toLowerCase();
  $('cmdProgressRow').style.display = 'flex';
  $('cmdResults').innerHTML = '';
  setCmdProgress(0);
  $('cmdStatus').textContent = 'Сканирую архив…';

  for (const c of idx.chats) {
    if (controller.signal.aborted) break;
    let found = 0;
    for (const ch of c.chunks) {
      if (controller.signal.aborted) break;
      try {
        const res = await fetch(ch, { signal: controller.signal });
        const msgs = await res.json();
        for (const m of msgs) {
          if (controller.signal.aborted) break;
          if (m.sy) continue;
          const hay = String(m.c || '') + ' ' + String(m.n || '') + ' ' +
                      String(m.r && m.r.c || '');
          if (hay.toLowerCase().includes(ql)) {
            results.push({ chat: c, m });
            if (++found >= 6) break;
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') break;
      }
      done++;
      const pct = total ? Math.round(100 * done / total) : 0;
      setCmdProgress(pct);
      $('cmdStatus').textContent = `Сканирую… ${done}/${total} файлов`;
      if (done % 12 === 0) await new Promise(r => setTimeout(r, 0));
    }
    if (results.length >= 200) break;
  }

  state.search.controller = null;
  state.search.idx = 0;
  if (controller.signal.aborted) return;
  $('cmdProgressRow').style.display = 'none';
  showCmdResults(results, q);
}

function setCmdProgress(pct) {
  const ring = $('cmdRing');
  ring.style.setProperty('--p', pct + '%');
  $('cmdRingPct').textContent = pct + '%';
}

function showCmdResults(results, q) {
  const el = $('cmdResults');
  if (!results) { el.innerHTML = ''; return; }
  if (!results.length) {
    el.innerHTML = `<div class="cmd-empty">Ничего не найдено по «${esc(q)}». Попробуйте короче.</div>`;
    return;
  }
  const byChat = new Map();
  for (const r of results) {
    if (!byChat.has(r.chat.id)) byChat.set(r.chat.id, { chat: r.chat, items: [] });
    byChat.get(r.chat.id).items.push(r);
  }
  el.innerHTML = [...byChat.values()].map(g => `
    <div class="cmd-res-group">
      <div class="cmd-res-title">${esc(g.chat.title)}<span>${g.items.length}</span></div>
      ${g.items.map(r => `
        <div class="cmd-row" data-chat="${jsq(g.chat.id)}" data-mk="${jsq(msgKey(r.m))}" tabindex="0">
          <div class="cmd-row-chat">${esc(r.chat.group)}</div>
          <div class="cmd-row-text">${snippet(r)}</div>
          <div class="cmd-row-meta">${esc(r.m.n || '')} · ${esc(r.m.d || fmtDate(r.m.t, true))}</div>
        </div>`).join('')}
    </div>`).join('');
}

function snippet(r) {
  const plain = stripHtml(r.m.c || (r.m.r && r.m.r.c) || '');
  const ql = state.search.q.toLowerCase();
  const i = plain.toLowerCase().indexOf(ql);
  if (i === -1) return esc(plain.slice(0, 220));
  const start = Math.max(0, i - 60);
  const end = Math.min(plain.length, i + ql.length + 140);
  const pre = (start > 0 ? '…' : '') + esc(plain.slice(start, i));
  const hit = esc(plain.slice(i, i + ql.length));
  const post = esc(plain.slice(i + ql.length, end)) + (end < plain.length ? '…' : '');
  return pre + '<mark>' + hit + '</mark>' + post;
}

/* ================= misc ================= */

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function moveTabPill() {
  const pill = $('tabPill');
  const tabs = $('tabs');
  const active = tabs.querySelector('.tab-btn.active');
  if (!pill || !active || !tabs.offsetWidth) return;
  pill.style.width = active.offsetWidth + 'px';
  pill.style.transform = `translateX(${active.offsetLeft}px)`;
}

function fakePreloaderProgress() {
  const fill = $('plFill');
  const pct = $('plPct');
  let p = 0;
  const timer = setInterval(() => {
    p += 3 + Math.random() * 7;
    if (p >= 88) { p = 88; clearInterval(timer); }
    fill.style.width = p + '%';
    pct.textContent = Math.round(p) + '%';
  }, 60);
}

/* ================= init ================= */

document.addEventListener('DOMContentLoaded', async () => {
  const _t0 = performance.now();
  fakePreloaderProgress();

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });

  $('cmdTrigger').addEventListener('click', openCmd);
  $('cmdBackdrop').addEventListener('click', closeCmd);
  $('lightbox').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('cmd').classList.contains('show')) closeCmd();
      else closeLightbox();
    }
  });

  $('chatScroll').addEventListener('scroll', () => {
    const el = $('chatScroll');
    if (el.scrollTop < 200) loadChunk('older');
  });

  const onScroll = () => {
    const y = window.scrollY;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    $('progressBar').style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    $('topbar').classList.toggle('scrolled', y > 12);
    $('backTop').classList.toggle('show', y > 700);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  $('backTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  initFx();
  initTilt();
  initMagnet();
  bindSpotlight();
  bindCmd();
  moveTabPill();
  window.addEventListener('resize', moveTabPill);

  await loadIndex();

  if (state.index) {
    initHeroPreview();
    initMarquee();
  }
  hidePreloader(_t0);
});

async function loadIndex() {
  try {
    const res = await fetch('data/index.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    state.index = await res.json();
    renderHome();
    fetchCommits();
    return true;
  } catch (err) {
    console.error('loadIndex:', err);
    const isFile = location.protocol === 'file:';
    const hint = isFile
      ? 'Файл открыт напрямую (file://). Запустите локальный сервер и откройте http://localhost:8000/'
      : 'Сервер не ответил на запрос данных. Нажмите «Повторить».';
    $('heroStats').innerHTML =
      '<div class="panel"><p class="empty" style="color:var(--danger)">Не удалось загрузить данные.</p>' +
      '<p class="empty" style="font-size:13px">' + hint + '</p>' +
      '<div class="hero-actions" style="margin-top:18px"><button class="btn btn-primary" id="retryBtn">Повторить</button></div></div>';
    $('retryBtn').addEventListener('click', () => {
      $('heroStats').innerHTML = '<div class="panel"><p class="empty">Загрузка…</p></div>';
      loadIndex();
    });
    return false;
  }
}

function hidePreloader(t0) {
  const fill = $('plFill');
  const pct = $('plPct');
  const finish = () => {
    fill.style.width = '100%';
    pct.textContent = '100%';
    const delay = Math.max(0, 700 - (performance.now() - t0));
    setTimeout(() => $('preloader').classList.add('hide'), delay);
  };
  setTimeout(finish, 350);
}
