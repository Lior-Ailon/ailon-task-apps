/* BK — מערכת לניהול מסכים בבתי כנסת v1.0.1 */
/* ניהול לוח הקהילה — AILON Task v1.0.0 */
const CITIES = {
  'נתיבות': [31.423, 34.589], 'אשקלון': [31.669, 34.574], 'שדרות': [31.524, 34.600],
  'אופקים': [31.309, 34.615], 'באר שבע': [31.253, 34.791], 'ירושלים': [31.778, 35.222],
  'בני ברק': [32.087, 34.834], 'תל אביב': [32.086, 34.789], 'חיפה': [32.794, 34.989],
  'רחובות': [31.894, 34.813], 'קרית מלאכי': [31.706, 34.754]
};
const AUTO_OPTS = {
  '': 'שעה ידנית', candles: 'אוטומטי — כניסת שבת',
  tzeit: 'אוטומטי — צאת הכוכבים', candlesNext: 'אוטומטי — כניסת שבת הבאה'
};
const PROFILE_KEYS = ['weekday', 'friday', 'shabbat'];
let S = null, $ = s => document.querySelector(s);

const DEFAULTS = {
  version: 1,
  shulName: 'בית הכנסת שיח יוסף ע"ש הרב יוסף חדד',
  brand: 'AILON',
  city: 'נתיבות', tz: 'Asia/Jerusalem', lat: 31.423, lng: 34.589,
  offsets: { tefillin: 30, candles: 18, tzeit: 45, rt: 72 },
  profiles: {
    weekday: { label: 'סדר יום חול', items: [
      { name: 'שחרית א׳', time: '06:30' }, { name: 'שחרית ב׳', time: '09:00' },
      { name: 'מנחה גדולה', time: '12:45' }, { name: 'מנחה קטנה', time: '16:30' },
      { name: 'ערבית', time: '19:45' }
    ]},
    friday: { label: 'ערב שבת', items: [
      { name: 'שחרית', time: '06:30' }, { name: 'כניסת שבת', auto: 'candles' }
    ]},
    shabbat: { label: 'שבת וחג', items: [
      { name: 'שחרית', time: '08:45' }, { name: 'מנחה', auto: 'candlesNext' },
      { name: 'ערבית והבדלה', auto: 'tzeit' }
    ]}
  },
  halachot: {},
  halacha: [
    'הלכה יומית — עריכה במסך הניהול: הוסף כאן הלכות קצרות, כל שורה הלכה אחת.',
    'זמן תפילה בתפילת עמידה קודם לשקיעה עדיף, ובדיעבד עד צאת הכוכבים.',
    'הנחת תפילין מתחילה מזמן משיכיר, ונחה עד השקיעה.',
    'ספירת העומר נאמרת לפני עלינו לשלום — טוב להקפיד בערבית.'
  ],
  azkarot: [
    { name: 'כהן יעקב בן דוד', day: 18, month: 1 },
    { name: 'לוי יצחק בן אברהם', day: 20, month: 1 },
    { name: 'מזרחי שלמה בן משה', day: 22, month: 1 },
    { name: 'פרידמן דוד בן יוסף', day: 5, month: 3 },
    { name: 'ישראלי יהודה בן נחום', day: 12, month: 14 },
    { name: 'ביטון אליהו בן שמואל', day: 3, month: 9 }
  ],
  notices: [],
  services: [
    { name: 'רופא תורן — ד"ר לוי', value: '050-0000000 (לדוגמה)' },
    { name: 'גמ"ח הקהילה', value: 'אברהם כהן 050-0000000 (לדוגמה)' }
  ],
  yearBlessing: { names: ['אברהם כהן', 'יצחק לוי', 'יעקב ישראלי', 'שרה פרידמן', 'רבקה מזרחי', 'רחל ביטון', 'לאה שרעבי', 'מרים אוחיון'] },
  azkarot: [], notices: [], services: []
};

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function deepMerge(base, over) {
  const out = { ...base };
  for (const k of Object.keys(over || {})) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) &&
        base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]))
      out[k] = deepMerge(base[k], over[k]);
    else out[k] = over[k];
  }
  return out;
}

async function loadSettings() {
  let s = structuredClone(DEFAULTS);
  try {
    const r = await fetch('./settings.json?v=' + Date.now());
    if (r.ok) s = deepMerge(s, await r.json());
  } catch (e) {}
  try {
    const l = localStorage.getItem(LS_KEY);
    if (l) s = deepMerge(s, JSON.parse(l));
  } catch (e) {}
  return s;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 2600);
}

function fillForm() {
  $('#f_shulName').value = S.shulName;
  $('#f_panel_sec').value = (S.board || {}).panel_seconds ?? 14;
  $('#f_azk_sec').value = (S.board || {}).azk_page_seconds ?? 12;
  $('#f_brand').value = S.brand || '';
  const sel = $('#f_city');
  sel.innerHTML = Object.keys(CITIES).map(c => `<option>${c}</option>`).join('');
  if (!Object.keys(CITIES).includes(S.city)) sel.insertAdjacentHTML('beforeend', `<option>${S.city}</option>`);
  sel.value = S.city;
  $('#f_lat').value = S.lat; $('#f_lng').value = S.lng;
  $('#f_tefillin').value = S.offsets.tefillin;
  $('#f_candles').value = S.offsets.candles;
  $('#f_tzeit').value = S.offsets.tzeit;
  $('#f_rt').value = S.offsets.rt;
  $('#f_halacha').value = S.halacha.join('\n');
  $('#f_blessing').value = ((S.yearBlessing || {}).names || []).join('\n');
  $('#f_refua').value = (S.refua || []).join('\n');
  $('#f_donors').value = (S.donors || []).map(d => [d.name, d.tier].filter(Boolean).join(' | ')).join('\n');
  const pairsToText = o => Object.entries(o || {}).map(([k, v]) => k + ' | ' + v).join('\n');
  $('#f_haftara').value = pairsToText(S.haftara);
  $('#f_parshaNote').value = pairsToText(S.parshaNotes);
  renderProfiles();
  renderAzkarot();
  renderNotices();
  renderServices();
  renderLessons();
  renderEvents();
  renderHistory();
}

function renderProfiles() {
  const wrap = $('#profiles');
  wrap.innerHTML = PROFILE_KEYS.map(key => {
    const p = S.profiles[key];
    const rows = p.items.map((it, i) => `
      <div class="mrow" data-pk="${key}" data-i="${i}">
        <input class="mi-name" value="${it.name || ''}">
        <input class="mi-time" type="time" value="${it.time || ''}" ${it.auto ? 'disabled' : ''}>
        <select class="mi-auto">${Object.entries(AUTO_OPTS).map(([v, l]) =>
          `<option value="${v}" ${(it.auto || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="btn-danger" onclick="delRow('${key}',${i})">✕</button>
      </div>`).join('');
    return `<h2 style="margin-top:20px">${p.label} <span style="color:var(--dim);font-size:13px">(${key})</span></h2>
      <div class="profile-rows">${rows}</div>
      <button class="btn-sec" onclick="addRow('${key}')">+ הוסף מניין</button>`;
  }).join('');
}

function addRow(key) {
  S.profiles[key].items.push({ name: '', time: '' });
  renderProfiles();
}
function delRow(key, i) {
  S.profiles[key].items.splice(i, 1);
  renderProfiles();
}

function collectProfiles() {
  document.querySelectorAll('#profiles .mrow').forEach(row => {
    const key = row.dataset.pk, i = +row.dataset.i;
    const it = S.profiles[key].items[i];
    it.name = row.querySelector('.mi-name').value;
    const auto = row.querySelector('.mi-auto').value;
    if (auto) { it.auto = auto; delete it.time; }
    else { const t = row.querySelector('.mi-time').value; it.time = t; delete it.auto; }
  });
}


const HEB_MONTH_OPTS = [1,2,3,4,5,6,13,14,7,8,9,10,11,12];
const HEB_MONTH_NAMES = {1:'תשרי',2:'חשוון',3:'כסלו',4:'טבת',5:'שבט',6:'אדר',13:'אדר א׳',14:'אדר ב׳',7:'ניסן',8:'אייר',9:'סיון',10:'תמוז',11:'אב',12:'אלול'};

function renderAzkarot() {
  $('#azkarotRows').innerHTML = (S.azkarot||[]).map((a,i)=>`
    <div class="mrow" data-azk="${i}">
      <input class="azk-name" value="${a.name||''}" placeholder="שם הנפטר">
      <input class="azk-day" type="number" min="1" max="30" value="${a.day||''}" placeholder="יום" style="direction:ltr">
      <select class="azk-month">${HEB_MONTH_OPTS.map(m=>`<option value="${m}" ${a.month===m?'selected':''}>${HEB_MONTH_NAMES[m]}</option>`).join('')}</select>
      <label class="azk-sol-lbl"><input type="checkbox" class="azk-soldier" ${a.is_soldier?'checked':''}> חייל</label>
      <button class="btn-danger" onclick="delArr('azkarot',${i})">✕</button>
    </div>`).join('');
}
function addAzkara(){ (S.azkarot=S.azkarot||[]).push({name:'',day:'',month:1}); renderAzkarot(); }

function renderNotices() {
  $('#noticesRows').innerHTML = (S.notices||[]).map((n,i)=>`
    <div style="background:#122a4d;border-radius:12px;padding:12px;margin-bottom:10px" data-ntc="${i}">
      <div class="mrow" style="grid-template-columns:1.5fr 1fr 1fr auto;margin-bottom:6px">
        <input class="ntc-title" value="${(n.title||'').replace(/"/g,'&quot;')}" placeholder="כותרת">
        <input class="ntc-from" type="date" value="${n.from||''}" style="direction:ltr">
        <input class="ntc-until" type="date" value="${n.until||''}" style="direction:ltr">
        <button class="btn-danger" onclick="delArr('notices',${i})">✕</button>
      </div>
      <textarea class="ntc-text" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid #2a4a77;background:#0d2142;color:#fff;font-size:15px;min-height:56px;font-family:inherit" placeholder="טקסט (אופציונלי)">${n.text||''}</textarea>
    </div>`).join('');
}
function addNotice(){ (S.notices=S.notices||[]).push({title:'',from:'',until:'',text:''}); renderNotices(); }

function renderServices() {
  $('#servicesRows').innerHTML = (S.services||[]).map((v,i)=>`
    <div class="mrow" data-srv="${i}">
      <input class="srv-name" value="${(v.name||'').replace(/"/g,'&quot;')}" placeholder="שם השירות">
      <input class="srv-value" value="${(v.value||'').replace(/"/g,'&quot;')}" placeholder="פרטים / טלפון">
      <span></span>
      <button class="btn-danger" onclick="delArr('services',${i})">✕</button>
    </div>`).join('');
}
function addService(){ (S.services=S.services||[]).push({name:'',value:''}); renderServices(); }

const HEB_CIVIL_MONTHS = ['ניסן','אייר','סיון','תמוז','אב','אלול','תשרי','חשוון','כסלו','טבת','שבט','אדר','אדר ב׳'];
const DAYS_HEB = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

function renderLessons() {
  const box = $('#lessonsRows'); if (!box) return;
  S.lessons = S.lessons || [];
  box.innerHTML = S.lessons.map((l, i) => `
    <div class="row" data-lsn="${i}">
      <select class="lsn-day">${DAYS_HEB.map((d, k) => `<option value="${k}" ${+l.day === k ? 'selected' : ''}>${d}</option>`).join('')}</select>
      <input class="lsn-time" type="time" value="${l.time || ''}" placeholder="שעה">
      <input class="lsn-title" value="${l.title || ''}" placeholder="נושא השיעור">
      <input class="lsn-teacher" value="${l.teacher || ''}" placeholder="מעביר">
      <button class="btn-x" onclick="delArr('lessons', ${i})">✕</button>
    </div>`).join('');
}
function addLesson(){ (S.lessons = S.lessons || []).push({day:'6', time:'', title:'', teacher:''}); renderLessons(); }

function renderEvents() {
  const box = $('#eventsRows'); if (!box) return;
  S.events = S.events || [];
  box.innerHTML = S.events.map((e, i) => `
    <div class="row" data-ev="${i}">
      <input class="ev-title" value="${e.title || ''}" placeholder="כותרת האירוע">
      <input class="ev-date" type="date" value="${e.date || ''}">
      <input class="ev-until" type="date" value="${e.until || ''}" title="עד תאריך (לא חובה)">
      <input class="ev-text" value="${e.text || ''}" placeholder="פרטים">
      <button class="btn-x" onclick="delArr('events', ${i})">✕</button>
    </div>`).join('');
}
function addEvent(){ (S.events = S.events || []).push({title:'', date:'', until:'', text:''}); renderEvents(); }

function renderHistory() {
  const box = $('#historyRows'); if (!box) return;
  S.history = S.history || [];
  box.innerHTML = S.history.map((h, i) => `
    <div class="row" data-hst="${i}">
      <select class="hst-month">${HEB_CIVIL_MONTHS.map((m, k) => `<option value="${k + 1}" ${+h.month === k + 1 ? 'selected' : ''}>${m}</option>`).join('')}</select>
      <input class="hst-day" type="number" min="1" max="30" value="${h.day || ''}" placeholder="יום">
      <input class="hst-text" value="${h.text || ''}" placeholder="מה קרה בתאריך">
      <button class="btn-x" onclick="delArr('history', ${i})">✕</button>
    </div>`).join('');
}
function addHistory(){ (S.history = S.history || []).push({month:1, day:'', text:''}); renderHistory(); }

function delArr(key, i){ S[key].splice(i,1); renderAzkarot(); renderNotices(); renderServices(); renderLessons(); renderEvents(); renderHistory(); }

function collectExtra() {
  S.azkarot = [...document.querySelectorAll('#azkarotRows [data-azk]')].map(r=>({
    name: r.querySelector('.azk-name').value,
    day: +r.querySelector('.azk-day').value || '',
    month: +r.querySelector('.azk-month').value,
    is_soldier: r.querySelector('.azk-soldier').checked
  })).filter(a=>a.name && a.day);
  S.notices = [...document.querySelectorAll('#noticesRows [data-ntc]')].map(r=>({
    title: r.querySelector('.ntc-title').value,
    from: r.querySelector('.ntc-from').value,
    until: r.querySelector('.ntc-until').value,
    text: r.querySelector('.ntc-text').value
  })).filter(n=>n.title);
  S.services = [...document.querySelectorAll('#servicesRows [data-srv]')].map(r=>({
    name: r.querySelector('.srv-name').value,
    value: r.querySelector('.srv-value').value
  })).filter(v=>v.name);
  S.lessons = [...document.querySelectorAll('#lessonsRows [data-lsn]')].map(r=>({
    day: r.querySelector('.lsn-day').value,
    time: r.querySelector('.lsn-time').value,
    title: r.querySelector('.lsn-title').value.trim(),
    teacher: r.querySelector('.lsn-teacher').value.trim()
  })).filter(l=>l.title);
  S.events = [...document.querySelectorAll('#eventsRows [data-ev]')].map(r=>({
    title: r.querySelector('.ev-title').value.trim(),
    date: r.querySelector('.ev-date').value,
    until: r.querySelector('.ev-until').value,
    text: r.querySelector('.ev-text').value.trim()
  })).filter(e=>e.title);
  S.history = [...document.querySelectorAll('#historyRows [data-hst]')].map(r=>({
    month: +r.querySelector('.hst-month').value,
    day: +r.querySelector('.hst-day').value,
    text: r.querySelector('.hst-text').value.trim()
  })).filter(h=>h.day && h.text);
  const parsePairs = t => Object.fromEntries(t.split('\n').map(x => x.trim()).filter(Boolean).map(x => {
    const i = x.indexOf('|'); return i < 0 ? null : [x.slice(0, i).trim(), x.slice(i + 1).trim()];
  }).filter(Boolean));
  S.haftara = parsePairs(($('#f_haftara') || {}).value || '');
  S.parshaNotes = parsePairs(($('#f_parshaNote') || {}).value || '');
}

async function save() {
  if (!CUR) return;
  collectProfiles();
  collectExtra();
  S.shulName = $('#f_shulName').value;
  S.brand = $('#f_brand').value.trim() || 'AILON';
  S.lat = parseFloat($('#f_lat').value);
  S.lng = parseFloat($('#f_lng').value);
  S.offsets = {
    tefillin: +$('#f_tefillin').value, candles: +$('#f_candles').value,
    tzeit: +$('#f_tzeit').value, rt: +$('#f_rt').value
  };
  S.board = {
    panel_seconds: Math.max(3, +$('#f_panel_sec').value || 14),
    azk_page_seconds: Math.max(3, +$('#f_azk_sec').value || 12)
  };
  S.halacha = $('#f_halacha').value.split('\n').map(x => x.trim()).filter(Boolean);
  S.yearBlessing = { names: $('#f_blessing').value.split('\n').map(x => x.trim()).filter(Boolean) };
  S.refua = $('#f_refua').value.split('\n').map(x => x.trim()).filter(Boolean);
  S.donors = $('#f_donors').value.split('\n').map(x => x.trim()).filter(Boolean).map(x => {
    const i = x.indexOf('|'); return i < 0 ? { name: x, tier: '' } : { name: x.slice(0, i).trim(), tier: x.slice(i + 1).trim() };
  });
  const r = await api('save_settings', { shul_id: CUR.id, settings: S });
  if (r.success) toast('נשמר ✔ הלוח בטלוויזיה יתעדכן בתוך דקה');
  else toast(r.message || 'שמירה נכשלה');
}

/* ============ שכבת API — ניהול מרכזי ============ */
const API = 'https://base44.app/api/apps/69f63b4536d7a2c6688403df/functions/shulApi';
let TOKEN = localStorage.getItem('shulmgr.token') || '';
let USER = null, SHULS = [], CUR = null;

async function api(action, extra = {}) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, session_token: TOKEN, ...extra }) });
  const d = await r.json().catch(() => ({ success: false, message: 'שגיאת תקשורת' }));
  if (!d.success && (d.message || '').toLowerCase().includes('session')) doLogout(true);
  return d;
}

function showView(v) {
  $('#login').style.display = v === 'login' ? 'block' : 'none';
  $('#portal').style.display = v === 'portal' ? 'block' : 'none';
  $('#admin').classList.toggle('on', v === 'editor');
}

async function doLogin() {
  const u = $('#l_user').value.trim(), p = $('#l_pass').value;
  if (!u || !p) return toast('מלא שם משתמש וסיסמה');
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', username: u, password: p }) });
  const d = await r.json().catch(() => ({ success: false, message: 'שגיאת תקשורת' }));
  if (!d.success) return toast(d.message || 'התחברות נכשלה');
  TOKEN = d.token; USER = d.user;
  localStorage.setItem('shulmgr.token', TOKEN);
  $('#l_pass').value = '';
  await loadPortal();
}

async function doLogout(silent) {
  if (!silent) { try { await api('logout'); } catch (e) {} }
  TOKEN = ''; USER = null;
  localStorage.removeItem('shulmgr.token');
  showView('login');
}

function boardUrl(t) { return t.display_url || '../beit-knesset/?shul=' + encodeURIComponent(t.code); }

const STATUS_LABEL = { active: 'פעיל', trial: 'ניסיון', paused: 'מושהה' };
const STATUS_COLOR = { active: '#16a34a', trial: 'var(--gold)', paused: '#7a2f2f' };

async function loadPortal() {
  const r = await api('list_shuls');
  if (!r.success) return toast(r.message || 'טעינה נכשלה');
  SHULS = r.data || [];
  $('#hello').textContent = 'שלום, ' + ((USER && USER.display_name) || 'מנהל');
  const admin = USER && USER.role === 'admin';
  $('#addBtn').style.display = admin ? 'inline-block' : 'none';
  $('#shulList').innerHTML = SHULS.map((t, i) => `
    <div class="card">
      <div class="c-main">
        <div class="c-name">${t.name}</div>
        <div class="c-sub">${t.city || ''} · קוד: ${t.code} · <span class="badge" style="background:${STATUS_COLOR[t.status] || '#555'}">${STATUS_LABEL[t.status] || t.status}</span></div>
      </div>
      <div class="c-actions">
        <button class="btn-main" onclick="openShul('${t.id}')">ניהול תוכן</button>
        <a class="btn-sec" href="${boardUrl(t)}" target="_blank" style="text-decoration:none;display:inline-flex;align-items:center">לוח תצוגה</a>
        ${admin ? `<button class="btn-danger" onclick="delShul('${t.id}','${(t.name || '').replace(/'/g, "\\'")}')">מחיקה</button>` : ''}
      </div>
    </div>`).join('');
  showView('portal');
}

function showPortal() { showView('portal'); }

function toggleNew() {
  const w = $('#newWrap');
  w.style.display = w.style.display === 'none' ? 'block' : 'none';
}

async function createShul() {
  const name = $('#f_newName').value.trim(), code = $('#f_newCode').value.trim();
  if (!name || !code) return toast('שם וקוד הם חובה');
  const r = await api('create_shul', {
    name, code, city: $('#f_newCity').value,
    status: 'trial', subscription_type: '',
    display_url: '../beit-knesset/?shul=' + encodeURIComponent(code),
    settings: {}
  });
  if (!r.success) return toast(r.message || 'יצירה נכשלה');
  toast('נוסף ✔');
  $('#f_newName').value = ''; $('#f_newCode').value = '';
  toggleNew();
  loadPortal();
}

async function delShul(id, name) {
  if (!confirm('למחוק את "' + name + '" לצמיתות? אין ביטול.')) return;
  const r = await api('delete_shul', { shul_id: id });
  if (r.success) { toast('נמחק'); loadPortal(); } else toast(r.message || 'מחיקה נכשלה');
}

async function openShul(id) {
  const r = await api('get_shul', { shul_id: id });
  if (!r.success) return toast(r.message || 'טעינה נכשלה');
  CUR = r.data;
  S = deepMerge(structuredClone(DEFAULTS), CUR.settings || {});
  fillForm();
  $('#shulTitle').textContent = CUR.name;
  $('#boardLink').href = boardUrl(CUR);
  showView('editor');
  scrollTo(0, 0);
}

function openPwModal() { $('#pwModal').style.display = 'flex'; }
function closePwModal() { $('#pwModal').style.display = 'none'; }

async function changePassword() {
  const o = $('#pwOld').value, n = $('#pwNew').value, c = $('#pwNew2').value;
  if (!o || !n) return toast('מלא סיסמה נוכחית וחדשה');
  if (n !== c) return toast('הסיסמאות אינן תואמות');
  const r = await api('change_password', { old_password: o, new_password: n });
  if (r.success) { closePwModal(); toast('הסיסמה עודכנה ✔'); }
  else toast(r.message || 'עדכון נכשל');
}

$('#f_city') && 0; // placeholder
(async function main() {
  const cs = $('#f_city');
  cs.addEventListener('change', () => {
    const c = CITIES[cs.value];
    if (c) { $('#f_lat').value = c[0]; $('#f_lng').value = c[1]; }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && $('#login').style.display !== 'none') doLogin(); });
  if (TOKEN) {
    const r = await api('verify');
    if (r.success) { USER = r.user; await loadPortal(); return; }
  }
  showView('login');
})();
