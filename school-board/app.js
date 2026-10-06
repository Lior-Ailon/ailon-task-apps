/* לוח בית הספר — SB v1.0.0 | AILON Task */
const API = 'https://base44.app/api/apps/69f63b4536d7a2c6688403df/functions/schoolApi';
const $ = s => document.querySelector(s);
let CODE = new URLSearchParams(location.search).get('school') || 'neot-ashkelon';
let D = null;          // נתונים מהשרת
let PAGES = ['home','notices','events','media','schedule','birthdays'];
let curIdx = 0, mediaIdx = 0, noticePage = 0, curVideo = null;
const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

async function fetchBoard() {
  try {
    const r = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'get_board', code: CODE }) });
    const j = await r.json();
    if (!j.success) throw new Error(j.message||'fail');
    D = j;
    const st = j.settings || {};
    PAGES = (st.board && st.board.pages && st.board.pages.length) ? st.board.pages : PAGES;
    return true;
  } catch(e) {
    $('#loading').innerHTML = '<div style="font-size:22px;color:#f87171">לא נמצא לוח לקוד: ' + CODE + '</div>' +
      '<div style="color:var(--dim)">בדוק את הקישור או פנה לניהול בית הספר</div>';
    return false;
  }
}

/* ---------- עזרים ---------- */
function hebDateStr(d) {
  try {
    return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day:'numeric', month:'long', year:'numeric' }).format(d).replace(/ה$/,'');
  } catch(e){ return ''; }
}
function gregStr(d) { return DAYS[d.getDay()] + ', ' + d.getDate() + ' ב' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
function todayKey() { const d = new Date(); return d.getDay(); } // 0=ראשון
function daysUntil(iso) {
  const today = new Date(); today.setHours(0,0,0,0);
  const that = new Date(iso + 'T00:00:00');
  return Math.round((that - today) / 86400000);
}
function schedForToday() {
  const sc = (D.settings||{}).schedule || {};
  const day = todayKey();
  if (day === 5) return { label: sc.friday_label || 'יום ו׳', items: sc.friday || [] };
  if (day === 4) return { label: sc.thursday_label || 'יום ה׳', items: sc.thursday || [] };
  if (day === 0) return { label: sc.sunday_label || 'יום א׳', items: sc.sunday || [] };
  return { label: sc.weekdays_label || 'ימים ב׳-ד׳', items: sc.weekdays || [] };
}
function nextBreak() {
  const s = schedForToday();
  const now = new Date(), mins = now.getHours()*60 + now.getMinutes();
  for (const it of s.items) {
    const [h,m] = (it.time||'').split(':').map(Number);
    if (isNaN(h)) continue;
    if (h*60+m > mins) {
      const diff = (h*60+m) - mins;
      return { name: it.label, time: it.time, in: diff };
    }
  }
  return null;
}

/* ---------- רינדור עמודים ---------- */
function renderHome() {
  $('#h_name').innerHTML = escHtml(D.name);
  const st = D.settings || {};
  if (st.motto) { $('#h_motto').textContent = '״' + st.motto + '״'; $('#h_motto').classList.remove('hidden'); }
  if (st.principal) { $('#h_value').innerHTML = '<div class="vt">צוות בית הספר</div><div class="vx">' + escHtml(st.principal) + '</div>'; $('#h_value').classList.remove('hidden'); }
  tickClock();
}
function escHtml(s){ return (s||'').toString().replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function noticeChunks(arr, n) { const out=[]; for(let i=0;i<arr.length;i+=n) out.push(arr.slice(i,i+n)); return out; }

function renderNotices() {
  const chunks = noticeChunks(D.notices || [], 4);
  if (noticePage >= chunks.length) noticePage = 0;
  const items = chunks[noticePage] || [];
  $('#n_grid').innerHTML = items.map((n,i)=>`
    <div class="ntc${i%2?' alt':''}">
      <h3>${escHtml(n.title)}</h3>
      ${n.text?'<p>'+escHtml(n.text)+'</p>':''}
    </div>`).join('') || '<p class="sub">אין הודעות חדשות</p>';
}

function renderEvents() {
  const evts = (D.events || []).slice(0, 5);
  $('#e_list').innerHTML = evts.map((e,i)=>{
    const d = new Date(e.event_date + 'T00:00:00');
    const du = daysUntil(e.event_date);
    let count;
    if (du === 0) count = 'היום!';
    else if (du === 1) count = 'מחר';
    else count = 'בעוד ' + du + ' ימים';
    return `
    <div class="evt${i===0?' evt-next':''}">
      <div class="evt-date"><div class="d">${d.getDate()}</div><div class="m">${MONTHS[d.getMonth()]}</div></div>
      <div class="evt-body">
        <h3>${escHtml(e.title)}</h3>
        ${e.description?'<p>'+escHtml(e.description)+'</p>':''}
        ${e.location?'<div class="loc">'+escHtml(e.location)+'</div>':''}
        ${e.event_time?'<div class="loc">'+e.event_time+'</div>':''}
      </div>
      <div class="evt-count">${count}</div>
    </div>`;
  }).join('') || '<p class="sub">אין אירועים קרובים</p>';
}

function renderMedia() {
  const list = D.media || [];
  if (!list.length) { $('#m_wrap').innerHTML = '<p class="sub">אין תמונות וסרטונים</p>'; return; }
  if (mediaIdx >= list.length) mediaIdx = 0;
  const m = list[mediaIdx];
  const isImg = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(m.media_url||'');
  stopVideo();
  $('#m_wrap').innerHTML = (isImg
      ? `<img src="${escHtml(m.media_url)}" alt="">`
      : `<video src="${escHtml(m.media_url)}" autoplay muted playsinline></video>`)
    + (m.title ? `<div class="media-title">${escHtml(m.title)}</div>` : '');
  if (!isImg) {
    const v = $('#m_wrap video');
    if (v) { curVideo = v; v.onended = ()=> nextPanel(); }
  }
}
function stopVideo(){ const v = $('#m_wrap video'); if (v) { try{v.pause();}catch(e){} } curVideo = null; }

function renderSchedule() {
  const s = schedForToday();
  $('#s_title').innerHTML = 'מערכת <span class="accent">היום</span> — ' + escHtml(s.label);
  const now = new Date(), mins = now.getHours()*60 + now.getMinutes();
  let nextFound = false;
  $('#s_rows').innerHTML = s.items.map(it=>{
    const [h,m] = (it.time||'').split(':').map(Number);
    const isNext = !nextFound && !isNaN(h) && h*60+m > mins;
    if (isNext) nextFound = true;
    return `<div class="sched-row${isNext?' next':''}">
      <span class="t" style="direction:ltr">${escHtml(it.time||'')}</span>
      <span class="lbl">${escHtml(it.label)}</span>
      ${isNext?'<span style="color:var(--gold);font-size:18px;font-weight:700">הבא</span>':'<span></span>'}
    </div>`;
  }).join('') || '<p class="sub">אין מערכת להיום</p>';
}

function renderBirthdays() {
  const now = new Date();
  const list = (D.birthdays || []).filter(b => b.event_date)
    .map(b => ({ ...b, d: new Date(b.event_date + 'T00:00:00') }))
    .filter(b => b.d.getMonth() === now.getMonth() && b.d.getDate() >= now.getDate() - 2)
    .sort((a,b)=>a.d.getDate()-b.d.getDate())
    .slice(0, 6);
  $('#b_grid').innerHTML = list.map(b=>`
    <div class="bday">
      <div class="cake"></div>
      <div class="bn">${escHtml(b.title)}</div>
      <div class="bm">${b.d.getDate()} ב${MONTHS[b.d.getMonth()]}</div>
    </div>`).join('') || '<p class="sub">אין ימי הולדת בימים הקרובים</p>';
}

/* ---------- רוטציה ---------- */
function showPage(idx) {
  stopVideo();
  curIdx = idx;
  const id = PAGES[idx];
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  const el = $('#p-' + id);
  if (!el) { nextPanel(); return; }
  el.classList.add('on');
  if (id === 'home') renderHome();
  if (id === 'notices') { noticePage = 0; renderNotices(); }
  if (id === 'events') renderEvents();
  if (id === 'media') renderMedia();
  if (id === 'schedule') renderSchedule();
  if (id === 'birthdays') renderBirthdays();
  renderDots();
  // משך שהייה
  let secs = ((D.settings||{}).board||{}).panel_seconds || 10;
  if (id === 'media' && curVideo && curVideo.duration) {
    secs = Math.max(secs, Math.ceil(curVideo.duration) + 1);
  }
  clearTimeout(showPage._t);
  showPage._t = setTimeout(nextPanel, secs * 1000);
}
function nextPanel() {
  if (!PAGES.length) return;
  showPage((curIdx + 1) % PAGES.length);
}
function renderDots() {
  $('#dots').classList.remove('hidden');
  $('#dots').innerHTML = PAGES.map((_,i)=>`<span class="${i===curIdx?'on':''}"></span>`).join('');
}

/* ---------- שעונים ---------- */
function tickClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
  const el = $('#h_clock'); if (el) el.textContent = hh + ':' + mm;
  const hd = $('#h_date'); if (hd) hd.textContent = gregStr(d) + ' · ' + hebDateStr(d);
  const bc = $('#bar_clock'); if (bc) bc.textContent = hh + ':' + mm + ':' + String(d.getSeconds()).padStart(2,'0');
  const bh = $('#bar_hdate'); if (bh) bh.textContent = hebDateStr(d);
  // הפסקה הבאה בסרגל
  const nb = nextBreak();
  const bn = $('#bar_next');
  if (nb) {
    if (nb.in <= 60 && nb.in > 0) { bn.classList.remove('hidden'); bn.textContent = nb.name + ' בעוד ' + nb.in + ' דק׳'; }
    else if (nb.in === 0) { bn.classList.remove('hidden'); bn.textContent = nb.name + ' — עכשיו!'; }
    else if (nb.in > 0) { bn.classList.remove('hidden'); bn.textContent = nb.name + ' · ' + nb.time; }
    else { bn.classList.add('hidden'); }
  }
}

/* ---------- אתחול ---------- */
(async function init(){
  if (!await fetchBoard()) return;
  document.title = D.name + ' — לוח בית הספר';
  $('#bar_name').textContent = D.name;
  $('#loading').classList.add('hidden');
  $('#bar').classList.remove('hidden');
  showPage(0);
  tickClock();
  setInterval(tickClock, 1000);
  setInterval(async ()=>{ // רענון נתונים כל דקה
    const ok = await fetchBoard();
    if (ok) renderDots();
  }, 60000);
})();
