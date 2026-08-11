'use strict';

/* ================= utils ================= */

const $ = id => document.getElementById(id);

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// JS-string-literal safe inside a double-quoted HTML attribute:
// backslashes and single quotes are escaped for the JS engine, double quotes
// are HTML-escaped so the attribute stays valid.
function jsq(s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;');
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
  ['#2563eb', '#06b6d4'],
  ['#059669', '#84cc16'],
  ['#ea580c', '#f43f5e'],
  ['#7e22ce', '#4f46e5'],
  ['#0d9488', '#2563eb'],
  ['#b91c1c', '#ea580c'],
  ['#0ea5e9', '#6366f1'],
];

function hashStr(s) {
  let h = 0;
  for (const ch of String(s || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

function paletteFor(name) {
  return PALETTES[hashStr(name) % PALETTES.length];
}

/* ---------- inline SVG icons ---------- */

const ICONS = {
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>',
  sheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
  pres: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20M12 3v18M8 21h8"/><path d="M6 7h3l-1.5 4H7.5L6 7zM13 7h5l-1.5 4H14.5L13 7z"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="14" height="14" rx="2"/><path d="M16 10l6-3v10l-6-3"/></svg>',
  site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
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
  search: { active: false, controller: null, q: '' },
  toastTimer: null,
  commits: null,
};

/* ================= animations ================= */

function countUp(el, target, format) {
  const dur = 900;
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
    }, { threshold: 0.12 });
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
  window.scrollTo(0, 0);
  if (!state.index) return;
  if (name === 'server' && !state.rendered.server) { state.rendered.server = true; renderServer(); }
  if (name === 'dms' && !state.rendered.dms) { state.rendered.dms = true; renderDmGroups(); }
  if (name === 'docs' && !state.rendered.docs) { state.rendered.docs = true; renderDocs(); }
  if (name === 'media' && !state.rendered.media) { state.rendered.media = true; renderMedia(); }
  requestAnimationFrame(observeReveals);
}

function backToBrowse() { switchTab(state._prevTab || 'home'); }

/* ================= home ================= */

function renderHome() {
  const idx = state.index;
  const s = idx.stats;
  const gen = idx.generated ? fmtDate(new Date(idx.generated).getTime(), true) : '—';
  const latestCommit = state.commits && state.commits.length
    ? fmtDate(new Date(state.commits[0].commit.author.date).getTime(), true)
    : null;

  const statTiles = [
    { n: s.messages, lbl: 'Сообщений', accent: true },
    { n: s.chats, lbl: 'Чатов', fmt: 'short' },
    { n: s.docs + (idx.google_docs ? idx.google_docs.length : 0), lbl: 'Документов' },
    { n: s.media, lbl: 'Медиа' },
    { n: null, lbl: 'Обновлено', text: latestCommit || gen, wide: true },
  ];

  $('heroStats').innerHTML = statTiles.map(t => {
    const num = t.text != null
      ? `<span class="stat-num" style="font-size:18px;letter-spacing:0">${esc(t.text)}</span>`
      : `<span class="stat-num" data-count="${t.n}"${t.fmt ? ' data-fmt="' + t.fmt + '"' : ''}>0</span>`;
    return `<div class="stat${t.accent ? ' accent' : ''}${t.wide ? ' stat-wide' : ''}">${num}<span class="stat-lbl">${t.lbl}</span></div>`;
  }).join('');
  animateStats($('heroStats'));

  renderRecent();
  observeReveals();
}

function renderRecent() {
  const top = [...state.index.chats].sort((a, b) => b.count - a.count).slice(0, 8);
  let html = `
    <div class="section-title">Топ чатов</div>
    <div class="chat-grid">${top.map(chatCard).join('')}</div>`;
  if (state.commits && state.commits.length) {
    html += `
    <div class="section-title">Последние обновления</div>
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
  renderRecent();
  observeReveals();
}

function chatCard(c) {
  const badge = c.count >= 1000
    ? `<span class="badge many">${fmtCount(c.count)}</span>`
    : `<span class="badge few">${fmtCount(c.count)}</span>`;
  return `
    <a class="chat-card reveal" onclick="openChat('${jsq(c.id)}')">
      <div class="cc-title">${esc(c.title)}</div>
      <div class="cc-sub">${badge}<span>${esc(c.group)}</span></div>
    </a>`;
}

/* ================= server ================= */

function renderServer() {
  const list = state.index.chats.filter(c => c.group === 'Серверные чаты');
  $('serverList').innerHTML = `
    <div class="panel">
      <div class="panel-title">Серверные чаты <span class="p-count">${list.length}</span></div>
      <div class="chat-grid">${list.map(chatCard).join('')}</div>
    </div>`;
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
  let html = '';
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
        <div class="dg-title">${avHtml}<span class="dg-txt">${esc(acct)}${nickHtml}</span><span class="dg-count">${list.length}</span></div>
        <div class="dm-grid">${list.map(dmCard).join('')}</div>
      </div>`;
  }
  $('dmGroups').innerHTML = html ||
    '<div class="panel"><div class="panel-title">Переписки</div><p class="empty">Нет переписок.</p></div>';
  observeReveals();
}

function dmCard(c) {
  const nm = dmTitle(c);
  const [c1, c2] = paletteFor(nm);
  const av = c.av
    ? `<div class="dm-avatar" style="background:linear-gradient(135deg,${c1},${c2})">${esc(initial(nm))}<img src="${esc(c.av)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></div>`
    : `<div class="dm-avatar" style="background:linear-gradient(135deg,${c1},${c2})">${esc(initial(nm))}</div>`;
  return `
    <div class="dm-card" onclick="openChat('${jsq(c.id)}')">
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
    <div class="section-title">Документы из архива · ${docs.length}</div>
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
        <div class="mc-title">${esc(cat)} <span class="mc-count">· ${items.length}</span></div>
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
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span class="mi-file">${esc(it.name)}</span>
        </div>
        <audio controls preload="none" src="${esc(url)}"></audio>
      </div>`;
  }
  return `
    <a class="media-item" href="${esc(url)}" download>
      <div class="mi-file">${esc(it.name)}</div>
      <div class="mi-name" style="position:static;background:none;color:var(--text-3);font-size:11px">${fmtSize(it.size)}</div>
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

async function openChat(id) {
  const c = state.index.chats.find(x => x.id === id);
  if (!c) return;
  state.chat = c;
  state.nextChunk = 0;
  state.loading = false;
  $('chatHead').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;min-width:0">
      <button class="btn btn-ghost" style="padding:7px 12px;font-size:13px" onclick="backToBrowse()">&#8592; Назад</button>
      <div style="min-width:0">
        <div class="ch-title">${esc(c.title)}</div>
        <div class="ch-sub">${esc(c.group)} · ${fmtCount(c.count)} сообщений · ${c.src}${c.merged ? ' · объединён' : ''}</div>
      </div>
    </div>`;
  $('chatScroll').innerHTML = '';
  $('chatLoading').style.display = 'none';
  switchTab('chat');
  fillChatSide();
  await loadMore();
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

async function loadMore() {
  const c = state.chat;
  if (!c || state.loading || state.nextChunk >= c.chunks.length) return;
  state.loading = true;
  $('chatLoading').style.display = 'block';
  try {
    const res = await fetch(c.chunks[state.nextChunk]);
    const msgs = await res.json();
    state.nextChunk++;
    const scroll = $('chatScroll');
    const nearBottom = scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 80;
    const frag = document.createDocumentFragment();
    for (const m of msgs) frag.appendChild(renderMessage(m));
    scroll.appendChild(frag);
    if (nearBottom) scroll.scrollTop = scroll.scrollHeight;
  } catch (e) {
    toast('Не удалось загрузить сообщения');
  } finally {
    state.loading = false;
    $('chatLoading').style.display = 'none';
  }
}

/* ================= message rendering ================= */

function renderMessage(m) {
  const div = document.createElement('div');
  div.className = 'msg';
  if (m.sy) {
    div.classList.add('sys');
    div.innerHTML = `<div class="msg-content">${esc(m.sy)}</div>`;
    return div;
  }
  const col = paletteFor(m.n);
  const c1 = m.cs || col[0];
  const avHtml = m.av
    ? `<div class="msg-av-wrap">
         <div class="msg-av has-img" style="background:linear-gradient(135deg,${c1},${col[1]})">
           <span>${esc(initial(m.n))}</span>
           <img src="${esc(m.av)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">
         </div>
       </div>`
    : `<div class="msg-av-wrap">
         <div class="msg-av" style="background:linear-gradient(135deg,${c1},${col[1]})">${esc(initial(m.n))}</div>
       </div>`;

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

/* ================= search ================= */

function bindSearch() {
  const input = $('searchInput');
  let timer = null;
  const go = () => {
    const q = input.value.trim();
    if (q.length < 2) { showSearchResults(null); return; }
    runSearch(q);
  };
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(go, 450);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { clearTimeout(timer); go(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
    if (e.key === 'Escape' && document.activeElement === input) input.blur();
  });
}

async function runSearch(q) {
  const idx = state.index;
  if (state.search.controller) state.search.controller.abort();
  const controller = new AbortController();
  state.search.controller = controller;
  state.search.q = q;
  const results = [];
  const total = idx.chats.reduce((s, c) => s + c.chunks.length, 0);
  let done = 0;
  const ql = q.toLowerCase();
  $('chatProgress').style.display = 'flex';
  $('cpFill').style.width = '0%';
  $('cpLabel').textContent = '0%';
  showSearchResults(null);
  switchTab('home');

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
      const pct = Math.round(100 * done / total);
      $('cpFill').style.width = pct + '%';
      $('cpLabel').textContent = pct + '%';
      if (done % 15 === 0) await new Promise(r => setTimeout(r, 0));
    }
    if (results.length >= 500) break;
  }

  state.search.controller = null;
  $('chatProgress').style.display = 'none';
  showSearchResults(results);
}

function showSearchResults(results) {
  const el = $('searchRes');
  if (!results) { el.innerHTML = ''; return; }
  if (!results.length) {
    el.innerHTML = `
      <div class="panel search-res">
        <div class="sr-head">Поиск</div>
        <p class="empty">Ничего не найдено по запросу.</p>
      </div>`;
    return;
  }
  el.innerHTML = `
    <div class="panel search-res">
      <div class="sr-head">Результаты: ${results.length}</div>
      <div class="sr-list">
        ${results.map(r => `
          <div class="sr-item" onclick="openChat('${jsq(r.chat.id)}')">
            <div class="sr-chat">${esc(r.chat.group)} · ${esc(r.chat.title)}</div>
            <div class="sr-text">${snippet(r)}</div>
            <div class="sr-author">${esc(r.m.n || '')} · ${esc(r.m.d || fmtDate(r.m.t, true))}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

function snippet(r) {
  const plain = String(r.m.c || r.m.r && r.m.r.c || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
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

function cancelSearch() {
  if (state.search.controller) state.search.controller.abort();
  $('chatProgress').style.display = 'none';
  toast('Поиск отменён');
}

/* ================= misc ================= */

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ================= init ================= */

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', () => switchTab(b.dataset.tab));
  });
  bindSearch();
  $('cpCancel').addEventListener('click', cancelSearch);
  $('lightbox').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });
  $('chatScroll').addEventListener('scroll', () => {
    const el = $('chatScroll');
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) loadMore();
  });
  try {
    const res = await fetch('data/index.json');
    state.index = await res.json();
    renderHome();
    fetchCommits();
  } catch (err) {
    $('heroStats').innerHTML = '<div class="panel"><p class="empty" style="color:var(--danger)">Не удалось загрузить данные.</p></div>';
  }
});
