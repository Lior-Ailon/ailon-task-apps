/* לוח הקהילה — בית הכנסת שיח יוסף, נתיבות | AILON Task v1.1.0 */
const VERSION = '1.1.0';
const RAD = Math.PI / 180, DAY = 86400000, J0 = 2440587.5, J2000 = 2451545;
const $ = s => document.querySelector(s);

/* ---------- חישובי שמש (NOAA/SunCalc) ---------- */
const toJulian = d => d.getTime() / DAY + J0;
const fromJulian = j => new Date((j - J0) * DAY);
const toDays = d => toJulian(d) - J2000;

function sunTimes(dateNoon, lat, lng, h0deg) {
  const lw = RAD * -lng;
  const d = toDays(dateNoon);
  const n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const ds = 0.0009 + lw / (2 * Math.PI) + n;
  const M = RAD * (357.5291 + 0.98560028 * ds);
  const L = M + RAD * (102.9372 + 180) +
    RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const e = RAD * 23.4397;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const Jnoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const c = (Math.sin(RAD * h0deg) - Math.sin(RAD * lat) * Math.sin(dec)) /
            (Math.cos(RAD * lat) * Math.cos(dec));
  if (c < -1 || c > 1) return null;
  const w = Math.acos(c) / (2 * Math.PI);
  return { rise: fromJulian(Jnoon - w), set: fromJulian(Jnoon + w), noon: fromJulian(Jnoon) };
}

function zmanimFor(date, s) {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const sr = sunTimes(noon, s.lat, s.lng, -0.833);
  const al = sunTimes(noon, s.lat, s.lng, -16.9);
  const o = s.offsets;
  const sha = (sr.set - sr.rise) / 12;
  const z = {};
  z.alot = al.rise;
  z.tefillin = new Date(+z.alot + o.tefillin * 60000);
  z.hanetz = sr.rise;
  z.sofShma = new Date(+z.alot + 3 * sha);
  z.sofTfila = new Date(+z.alot + 4 * sha);
  z.chatzot = sr.noon;
  z.minchaG = new Date(+z.chatzot + 30 * 60000);
  z.minchaK = new Date(+sr.set - 2.5 * sha);
  z.plag = new Date(+sr.set - 1.25 * sha);
  z.shkiya = sr.set;
  z.candles = new Date(+sr.set - o.candles * 60000);
  z.tzeit = new Date(+sr.set + o.tzeit * 60000);
  z.rt = new Date(+sr.set + o.rt * 60000);
  z.chatzotLaila = new Date(+z.chatzot + 12 * 3600000);
  return z;
}

/* ---------- הגדרות ---------- */
const DEFAULTS = {
  version: 1,
  shulName: 'בית הכנסת שיח יוסף ע"ש הרב יוסף חדד',
  city: 'נתיבות', tz: 'Asia/Jerusalem',
  lat: 31.423, lng: 34.589,
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
  halacha: [
    'הלכה יומית — עריכה במסך הניהול: הוסף כאן הלכות קצרות, כל שורה הלכה אחת.',
    'זמן תפילה בתפילת עמידה קודם לשקיעה עדיף, ובדיעבד עד צאת הכוכבים.',
    'הנחת תפילין מתחילה מזמן משיכיר, ונחה עד השקיעה.',
    'ספירת העומר נאמרת לפני עלינו לשלום — טוב להקפיד בערבית.'
  ],
  azkarot: [],                 // { name, day, month } תאריך עברי
  notices: [],                 // { title, text, from, until } תאריכים גרגוריאניים
  services: [],                // { name, value }
  password: '1234'
};

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
    const l = localStorage.getItem('shulboard.settings');
    if (l) s = deepMerge(s, JSON.parse(l));
  } catch (e) {}
  return s;
}

/* ---------- לוח שנה עברי (hebcal) ---------- */
let H = null, parshaCache = {};
const HEB_MONTHS = ['תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר',
  'סיון', 'תמוז', 'אב', 'אלול'];
const monthName = m => {
  if (m === 13) return 'אדר א׳';
  if (m === 14) return 'אדר ב׳';
  if (m > 6) return HEB_MONTHS[m - 7];
  return HEB_MONTHS[5 + m];
};

async function initHebcal() {
  try { H = await import('https://cdn.jsdelivr.net/npm/@hebcal/core@5/+esm'); }
  catch (e) { console.warn('hebcal לא נטען', e); }
}

function hebInfo(date, tz) {
  if (!H) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-CA',
      { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
    const gv = t => +parts.find(x => x.type === t).value;
    const local = new Date(gv('year'), gv('month') - 1, gv('day'), 12);
    const hd = new H.HDate(local);
    const info = { hd, isShabbat: hd.getDay() === 6, isFriday: hd.getDay() === 5 };
    try { info.hebDate = hd.render('he'); } catch (e) { info.hebDate = hd.toString(); }

    /* פרשת השבוע — אירוע PARSHA_HASHAVUA הבא */
    try {
      const hy = hd.getFullYear();
      if (!parshaCache[hy]) {
        const cal = H.HebrewCalendar.calendar({ year: hy, isHebrewYear: true, il: true, sedrot: true });
        parshaCache[hy] = cal.filter(e => e.getFlags() & H.flags.PARSHA_HASHAVUA);
      }
      const nx = parshaCache[hy].find(e => e.getDate().abs() >= hd.abs());
      if (nx) info.parsha = nx.render('he');
    } catch (e) {}

    /* חגים ומועדים */
    try {
      const fl = H.flags;
      const evs = H.HebrewCalendar.getHolidaysOnDate(hd, true) || [];
      const pick = test => evs.find(ev => ev.getFlags() & test);
      const ev = pick(fl.CHAG) || pick(fl.CHOL_HAMOED) || pick(fl.MAJOR_FAST) ||
                  pick(fl.ROSH_CHODESH) || pick(fl.MINOR_HOLIDAY) || pick(fl.MINOR_FAST);
      if (ev) {
        let name = ev.getDesc();
        try { name = ev.render('he') || name; } catch (e) {}
        info.holiday = name;
        info.isYomTov = !!(ev.getFlags() & fl.CHAG);
        info.isRoshChodesh = !!(ev.getFlags() & fl.ROSH_CHODESH) && !info.isYomTov;
      }
    } catch (e) {}

    try {
      const m = hd.getMonth(), d = hd.getDate();
      if ((m === 1 && d >= 16) || m === 2 || (m === 3 && d <= 5)) {
        const start = new H.HDate(16, 1, hd.getFullYear());
        info.omer = hd.abs() - start.abs() + 1;
      }
    } catch (e) {}

    const m = hd.getMonth(), d = hd.getDate();
    info.talGeshem = ((m === 8 && d >= 7) || (m > 8 && m <= 14)) ?
      'משיב הרוח ומוריד הגשם' : 'מוריד הטל';
    return info;
  } catch (e) { console.warn('hebInfo error', e); return null; }
}

/* ---------- אזכרות השבוע ---------- */
function azkarotOfWeek(s) {
  if (!H || !INFO || !s.azkarot.length) return [];
  const todayAbs = INFO.hd.abs();
  const out = [];
  for (const a of s.azkarot) {
    if (!a || !a.day || !a.month || !a.name) continue;
    let hd = null;
    try { hd = new H.HDate(a.day, a.month, INFO.hd.getFullYear()); } catch (e) {}
    if (!hd) continue;
    let diff = hd.abs() - todayAbs;
    if (diff < 0) { try { hd = new H.HDate(a.day, a.month, INFO.hd.getFullYear() + 1); diff = hd.abs() - todayAbs; } catch (e) {} }
    if (diff >= 0 && diff <= 7)
      out.push({ name: a.name, heb: a.day + ' ב' + monthName(a.month), days: diff });
  }
  out.sort((x, y) => x.days - y.days);
  return out;
}

/* ---------- הודעות פעילות ---------- */
function activeNotices(s, date) {
  const iso = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  return (s.notices || []).filter(n => {
    if (!n || !n.title) return false;
    if (n.from && iso < n.from) return false;
    if (n.until && iso > n.until) return false;
    return true;
  });
}

/* ---------- לוגו חגים ---------- */
const logoFor = name => {
  const n = name || '';
  const wrap = inner => `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"
    stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="color:var(--teal-light)">${inner}</svg>`;
  if (/ראש השנה|שופר/.test(n)) return wrap('<path d="M70 25 Q45 15 30 35 Q15 55 30 75 Q45 90 62 78"/><path d="M62 78 Q75 60 70 25"/><path d="M45 40 l-5 -8 M55 55 l7 -6 M40 62 l-8 5"/>');
  if (/כיפור/.test(n)) return wrap('<circle cx="50" cy="50" r="18"/><path d="M50 12 v12 M50 76 v12 M12 50 h12 M76 50 h12 M23 23 l9 9 M77 23 l-9 9 M23 77 l9 -9 M77 77 l-9 -9"/>');
  if (/סוכות/.test(n)) return wrap('<path d="M20 30 h60 M25 30 l-8 -10 M40 30 l-6 -10 M60 30 l-6 -10 M75 30 l-8 -10"/><path d="M28 30 v50 M72 30 v50 M50 30 v50"/><circle cx="50" cy="55" r="6"/>');
  if (/חנוכה/.test(n)) return wrap('<path d="M50 20 v45"/><path d="M35 30 v35 M65 30 v35"/><path d="M50 65 h-25 l25 15 25 -15 h-25"/>');
  if (/פורים/.test(n)) return wrap('<circle cx="42" cy="42" r="24"/><path d="M66 66 l16 16"/><path d="M34 38 q4 -5 8 0 M48 38 q4 -5 8 0"/>');
  if (/פסח/.test(n)) return wrap('<rect x="25" y="30" width="50" height="45" rx="6"/><path d="M25 42 h50 M50 30 v45"/><circle cx="38" cy="52" r="4" fill="currentColor"/><circle cx="62" cy="60" r="4" fill="currentColor"/>');
  if (/שבועות/.test(n)) return wrap('<path d="M35 25 h30 M35 25 v55 M65 25 v55"/><path d="M20 35 h70 M20 80 h70"/><path d="M20 35 v45 M80 35 v45"/>');
  if (/ראש חודש/.test(n)) return wrap('<path d="M62 25 a28 28 0 1 0 0 50 a22 28 0 1 1 0 -50" fill="currentColor" stroke="none" opacity="0.9"/>');
  return wrap('<path d="M25 25 h50 M25 75 h50 M30 25 v50 M70 25 v50"/><path d="M25 35 q12 8 25 0 t25 0 M25 50 q12 8 25 0 t25 0 M25 65 q12 8 25 0 t25 0"/>');
};

/* ---------- מניינים ---------- */
const pad = n => String(n).padStart(2, '0');
const fmt = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
const fmt12 = d => d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

function nextFridayCandles(from, s) {
  for (let i = 1; i <= 8; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    if (d.getDay() === 5) return zmanimFor(d, s).candles;
  }
  return null;
}

function resolveItem(it, z, s, today) {
  let t = null;
  if (it.time) t = it.time;
  else if (it.auto === 'candles') t = fmt(z.candles);
  else if (it.auto === 'tzeit') t = fmt(z.tzeit);
  else if (it.auto === 'candlesNext') {
    const c = nextFridayCandles(today, s);
    if (c) t = fmt(c);
  }
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return { name: it.name, time: t, date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m) };
}

function dayType(info) {
  if (!info) return 'weekday';
  if (info.isShabbat || info.isYomTov) return 'shabbat';
  if (info.isFriday) return 'friday';
  return 'weekday';
}

function buildSeq(date, s, info, z) {
  const type = dayType(info);
  const p = s.profiles[type] || s.profiles.weekday;
  const items = p.items.map(it => resolveItem(it, z, s, date)).filter(Boolean)
    .sort((a, b) => a.date - b.date);
  items.label = p.label;
  return items;
}

function nextMinyan(now, s, info, z) {
  const seq = buildSeq(now, s, info, z);
  const up = seq.filter(m => m.date > now);
  if (up.length) return { ...up[0], today: true, seq };
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const z2 = zmanimFor(t, s);
  const info2 = hebInfo(t, s.tz);
  const seq2 = buildSeq(t, s, info2, z2);
  if (seq2.length) return { ...seq2[0], today: false, seq };
  return null;
}

function hebrewCountdown(ms) {
  if (ms < 0) return '';
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'עכשיו';
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return 'בעוד ' + m + ' דק׳';
  if (m === 0) return h === 1 ? 'בעוד שעה' : 'בעוד ' + h + ' שעות';
  return 'בעוד ' + h + (h === 1 ? ' שעה' : ' שעות') + ' ו-' + m + ' דק׳';
}

/* ---------- רינדור ---------- */
let S = null, INFO = null, Z = null, NEXT = null, curPanel = 0;
const AZK_LABEL = ['היום', 'מחר', 'בעוד יומיים'];

function buildDynamicPanels() {
  ['panel-azkarot', 'panel-notices', 'panel-services'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  const main = $('#main');
  const azk = azkarotOfWeek(S);
  if (azk.length) {
    main.insertAdjacentHTML('beforeend', `
      <section class="panel" id="panel-azkarot">
        <h2 class="panel-title">אזכרות השבוע</h2>
        <div class="list" style="width:min(80vw,820px)">
          ${azk.map(a => `<div class="z-row"><span class="z-label" style="color:var(--text)">${a.name}</span>
            <span class="z-val" style="color:var(--teal-light)">${a.heb} • ${a.days < 3 ? AZK_LABEL[a.days] : 'בעוד ' + a.days + ' ימים'}</span></div>`).join('')}
        </div>
        <div class="note-line">יעלו זכרותם לברכה</div>
      </section>`);
  }
  const not = activeNotices(S, new Date());
  if (not.length) {
    main.insertAdjacentHTML('beforeend', `
      <section class="panel" id="panel-notices">
        <h2 class="panel-title">הודעות</h2>
        ${not.map(n => `<div class="notice-card"><div class="notice-title">${n.title}</div>
          ${n.text ? `<div class="notice-text">${n.text}</div>` : ''}</div>`).join('')}
      </section>`);
  }
  if (S.services && S.services.length) {
    main.insertAdjacentHTML('beforeend', `
      <section class="panel" id="panel-services">
        <h2 class="panel-title">שירותי הקהילה</h2>
        <div class="list" style="width:min(80vw,820px)">
          ${S.services.map(v => `<div class="z-row"><span class="z-label" style="color:var(--text)">${v.name}</span>
            <span class="z-val" style="font-size:clamp(14px,1.4vw,26px);color:var(--teal-light)">${v.value || ''}</span></div>`).join('')}
        </div>
      </section>`);
  }
}

function renderStatic() {
  $('#shulName').textContent = S.shulName;
  $('#shulCity').textContent = S.city;
  if (INFO) {
    $('#hebDate').textContent = INFO.hebDate || '';
    $('#parsha').textContent = INFO.parsha || (INFO.isShabbat ? 'שבת שלום' : '');
    $('#special').textContent = INFO.holiday || '';
    $('#holidayLogo').innerHTML = logoFor(INFO.holiday);
    $('#talGeshem').textContent = INFO.talGeshem;
    $('#ftrTal').textContent = 'בתפילה: ' + INFO.talGeshem;
    if (INFO.omer) {
      $('#omerBox').style.display = 'block';
      $('#omerBox').textContent = 'היום — ' + INFO.omer + ' ימים לעומר';
    } else $('#omerBox').style.display = 'none';
  } else $('#holidayLogo').innerHTML = logoFor('');
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / DAY);
  $('#halachaText').textContent = S.halacha.length ? S.halacha[doy % S.halacha.length] : '';
}

function renderZmanim() {
  const rows = [
    ['עלות השחר', Z.alot], ['הנחת תפילין', Z.tefillin],
    ['הנץ החמה', Z.hanetz], ['סוף קריאת שמע', Z.sofShma],
    ['סוף תפילה', Z.sofTfila], ['חצות היום', Z.chatzot],
    ['מנחה גדולה', Z.minchaG], ['מנחה קטנה', Z.minchaK],
    ['פלג המנחה', Z.plag], ['שקיעה', Z.shkiya],
    ['צאת הכוכבים', Z.tzeit], ['רבנו תם', Z.rt]
  ];
  $('#zmanimGrid').innerHTML = rows.map(([label, d]) =>
    `<div class="z-row"><span class="z-label">${label}</span><span class="z-val">${fmt12(d)}</span></div>`
  ).join('');
  const sp = $('#zmanimSpecial');
  if (INFO && INFO.isFriday)
    sp.innerHTML = `<div class="lbl">כניסת שבת</div><div class="big">${fmt12(Z.candles)}</div>`;
  else if (INFO && INFO.isShabbat)
    sp.innerHTML = `<div class="lbl">יציאת שבת</div><div class="big">${fmt12(Z.tzeit)}</div>`;
  else sp.innerHTML = '';
}

function renderMinyan() {
  if (!NEXT) return;
  $('#minyanTitle').textContent = NEXT.seq.label || 'סדר היום';
  const now = new Date();
  $('#minyanList').innerHTML = NEXT.seq.map(m => {
    const cls = (NEXT.today && m.date.getTime() === NEXT.date.getTime())
      ? 'm-row next' : (m.date < now ? 'm-row m-done' : 'm-row');
    return `<div class="${cls}"><span class="m-name">${m.name}</span><span class="m-time">${m.time}</span></div>`;
  }).join('');
}

function renderNext() {
  if (!NEXT) return;
  $('#nextName').textContent = (NEXT.today ? '' : 'מחר — ') + NEXT.name;
  $('#nextTime').textContent = NEXT.time;
}

function tick() {
  const now = new Date();
  $('#clockTime').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  $('#clockSeconds').textContent = pad(now.getSeconds());
  $('#gregDate').textContent = now.toLocaleDateString('he-IL',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('#ftrDate').textContent = now.toLocaleDateString('he-IL');
  if (NEXT) $('#nextCountdown').textContent = hebrewCountdown(NEXT.date - now);
}

function showPanel(i) {
  const ps = document.querySelectorAll('.panel');
  curPanel = ((i % ps.length) + ps.length) % ps.length;
  ps.forEach((p, k) => p.classList.toggle('active', k === curPanel));
}

async function fullRefresh() {
  S = await loadSettings();
  const now = new Date();
  Z = zmanimFor(now, S);
  INFO = hebInfo(now, S.tz);
  NEXT = nextMinyan(now, S, INFO, Z);
  buildDynamicPanels();
  renderStatic();
  renderZmanim();
  renderMinyan();
  renderNext();
  tick();
  const ps = document.querySelectorAll('.panel');
  if (curPanel >= ps.length) showPanel(0);
}

(async function main() {
  await initHebcal();
  await fullRefresh();
  setInterval(tick, 1000);
  setInterval(fullRefresh, 60000);
  setInterval(() => showPanel(curPanel + 1), 14000);
  document.addEventListener('click', () => showPanel(curPanel + 1));
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') showPanel(curPanel + 1);
    if (e.key === 'ArrowRight') showPanel(curPanel - 1);
  });
})();
