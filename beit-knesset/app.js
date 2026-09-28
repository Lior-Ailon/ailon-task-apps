/* לוח הקהילה — בית הכנסת שיח יוסף, נתיבות | AILON Task v1.2.0 */
const VERSION = '1.2.0';
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
  brand: 'AILON',
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
  halachot: {},
  halacha: [
    'אין לדבר בין ישתבח לברכו, והמדבר צריך לחזור ולומר ברכו עם הציבור.',
    'המתפלל צריך לכוון בתפילת העמידה לפחות בפסוק הראשון של שמונה עשרה.',
    'מי שלא התפלל מנחה עד שקיעה — יתפלל ערבית שתיים ומתפלל מנחה אחריה.',
    'ספירת העומר טעוכה בלילה לפני עלינו לשלום, ואם שכח — יספור בלי ברכה כל הלילה.',
    'תפילין נבדקות פעמיים בשנה, בחול המועד פסח ובחול המועד סוכות.',
    'נרות שבת מדליקים עשרים דקות לפני השקיעה, ובתענית עם בין הערביים.',
    'הבדלה צריך לקדש עד צאת הכוכבים, ולא יאחר יותר משבוע.',
    'ברכת המזון טעונה כוונה, והעונה אמן אחר ברכות — כוונתו עולה.'
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

/* ---------- לוח שנה עברי ---------- */
let H = null, parshaCache = {};
const HEB_MONTHS = ['תשרי', 'חשוון', 'כסלו', 'טבת', 'שבט', 'אדר', 'ניסן', 'אייר',
  'סיון', 'תמוז', 'אב', 'אלול'];
const monthName = m => m === 13 ? 'אדר א׳' : m === 14 ? 'אדר ב׳' : HEB_MONTHS[(m > 6 ? m - 7 : m + 5)];

async function initHebcal() {
  try { H = await import('https://cdn.jsdelivr.net/npm/@hebcal/core@6/+esm'); }
  catch (e) { console.warn('hebcal לא נטען', e); }
}

/* ---------- דף יומי (פורט של daf.el, נחלת הכלל) ---------- */
const DAF_TABLE = [
  ['ברכות',64],['שבת',157],['עירובין',105],['פסחים',121],['שקלים',22],['יומא',88],
  ['סוכה',56],['ביצה',40],['ראש השנה',35],['תענית',31],['מגילה',32],['מועד קטן',29],
  ['חגיגה',27],['יבמות',122],['כתובות',112],['נדרים',91],['נזיר',66],['סוטה',49],
  ['גיטין',90],['קידושין',82],['בבא קמא',119],['בבא מציעא',119],['בבא בתרא',176],
  ['סנהדרין',113],['מכות',24],['שבועות',49],['עבודה זרה',76],['הוריות',14],
  ['זבחים',120],['מנחות',110],['חולין',142],['בכורות',61],['ערכין',34],['תמורה',34],
  ['כריתות',28],['מעילה',22],['קינים',4],['תמיד',9],['מידות',5],['נידה',73]
];
const DAF_START8 = 721163, DAF_CYCLE = 2711, DAF_OFFSETS = { 36: 21, 37: 24, 38: 32 };

function toGematria(n) {
  if (n === 15) return 'טו';
  if (n === 16) return 'טז';
  const map = [['ק',100],['צ',90],['פ',80],['ע',70],['ס',60],['נ',50],['מ',40],
    ['ל',30],['כ',20],['י',10],['ט',9],['ח',8],['ז',7],['ו',6],['ה',5],['ד',4],['ג',3],['ב',2],['א',1]];
  let out = '';
  for (const [ch, v] of map) while (n >= v) { out += ch; n -= v; }
  return out || 'א';
}

function dafYomiFor(abs) {
  if (!abs || abs < DAF_START8) return null;
  const day = (abs - DAF_START8) % DAF_CYCLE;
  let sofar = 0;
  for (let i = 0; i < DAF_TABLE.length; i++) {
    const last = DAF_TABLE[i][1];
    sofar += last - 1;
    if (day < sofar) {
      const daf = last + 1 - (sofar - day) + (DAF_OFFSETS[i] || 0);
      const gm = toGematria(daf);
      const num = gm.length > 1 ? gm.slice(0, -1) + '״' + gm.slice(-1) : gm + '׳';
      return 'דף יומי • ' + DAF_TABLE[i][0] + ' דף ' + num;
    }
  }
  return null;
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

    try {
      const hy = hd.getFullYear();
      if (!parshaCache[hy]) {
        const cal = H.HebrewCalendar.calendar({ year: hy, isHebrewYear: true, il: true, sedrot: true });
        parshaCache[hy] = cal.filter(e => e.getFlags() & H.flags.PARSHA_HASHAVUA);
      }
      const nx = parshaCache[hy].find(e => e.getDate().abs() >= hd.abs());
      if (nx) info.parsha = nx.render('he');
    } catch (e) {}

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

    try { info.dafYomi = dafYomiFor(hd.abs()); } catch (e) {}

    try {
      const m = hd.getMonth(), d = hd.getDate();
      if ((m === 1 && d >= 16) || m === 2 || (m === 3 && d <= 5)) {
        const start = new H.HDate(16, 1, hd.getFullYear());
        info.omer = hd.abs() - start.abs() + 1;
      }
    } catch (e) {}

    const m = hd.getMonth(), d = hd.getDate();
    const geshem = (m === 8 && d >= 7) || (m > 8 && m <= 14);
    info.talGeshem = geshem ? 'משיב הרוח ומוריד הגשם' : 'מוריד הטל';
    info.talTransition = (m === 1 && d === 15) || (m === 8 && d === 7);
    return info;
  } catch (e) { console.warn('hebInfo error', e); return null; }
}

/* ---------- אזכרות ---------- */
const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function azkarotData(s) {
  if (!H || !INFO || !(s.azkarot || []).length) return { week: [], far: [] };
  const todayAbs = INFO.hd.abs();
  const week = [], far = [];
  for (const a of s.azkarot) {
    if (!a || !a.day || !a.month || !a.name) continue;
    let hd = null;
    try { hd = new H.HDate(a.day, a.month, INFO.hd.getFullYear()); } catch (e) {}
    if (!hd) continue;
    let diff = hd.abs() - todayAbs;
    if (diff < 0) { try { hd = new H.HDate(a.day, a.month, INFO.hd.getFullYear() + 1); diff = hd.abs() - todayAbs; } catch (e) {} }
    const entry = { name: a.name, heb: a.day + ' ב' + monthName(a.month), days: diff,
      weekday: 'יום ' + WEEKDAYS[hd.getDay() % 7] };
    (diff >= 0 && diff <= 7 ? week : far).push(entry);
  }
  week.sort((x, y) => x.days - y.days);
  far.sort((x, y) => x.days - y.days);
  return { week, far: far.slice(0, 6) };
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

/* ---------- אייקונים ---------- */
const wrap = (inner, cls = '') => `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor"
  stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="${cls}"
  style="color:var(--teal-light)">${inner}</svg>`;

const ICONS = {
  shofar: '<path d="M70 25 Q45 15 30 35 Q15 55 30 75 Q45 90 62 78"/><path d="M62 78 Q75 60 70 25"/><path d="M45 40 l-5 -8 M55 55 l7 -6 M40 62 l-8 5"/>',
  kippur: '<circle cx="50" cy="50" r="18"/><path d="M50 12 v12 M50 76 v12 M12 50 h12 M76 50 h12 M23 23 l9 9 M77 23 l-9 9 M23 77 l9 -9 M77 77 l-9 -9"/>',
  sukkah: '<path d="M18 32 h64 M24 32 l-8 -12 M40 32 l-5 -12 M60 32 l-5 -12 M78 32 l-8 -12"/><path d="M26 32 v52 M74 32 v52 M50 32 v52"/><circle cx="40" cy="58" r="5"/><path d="M42 32 q4 8 0 12 M58 32 q-4 8 0 12"/>',
  minim: '<path d="M38 70 V28 M38 28 q-10 4 -10 16 M38 34 q-8 4 -8 14 M38 40 q-6 4 -6 12"/><ellipse cx="64" cy="52" rx="11" ry="14"/><path d="M60 38 h8 M58 66 h12"/>',
  chanukiya: '<path d="M50 18 v46"/><path d="M35 28 v36 M65 28 v36"/><path d="M50 64 h-26 l26 16 26 -16 h-26"/>',
  purim: '<circle cx="42" cy="42" r="24"/><path d="M66 66 l16 16"/><path d="M34 38 q4 -5 8 0 M48 38 q4 -5 8 0"/>',
  pesach: '<rect x="25" y="30" width="50" height="45" rx="6"/><path d="M25 42 h50 M50 30 v45"/><circle cx="38" cy="52" r="4" fill="currentColor"/><circle cx="62" cy="60" r="4" fill="currentColor"/>',
  shavuot: '<path d="M35 25 h30 M35 25 v55 M65 25 v55"/><path d="M20 35 h70 M20 80 h70"/><path d="M20 35 v45 M80 35 v45"/>',
  roshChodesh: '<path d="M62 25 a28 28 0 1 0 0 50 a22 28 0 1 1 0 -50" fill="currentColor" stroke="none" opacity="0.9"/>',
  torah: '<path d="M25 25 h50 M25 75 h50 M30 25 v50 M70 25 v50"/><path d="M25 35 q12 8 25 0 t25 0 M25 50 q12 8 25 0 t25 0 M25 65 q12 8 25 0 t25 0"/>',
  tal: '<path d="M35 62 q-12 -18 0 -28 q12 10 0 28" fill="none"/><path d="M52 70 q-13 -20 0 -32 q13 12 0 32" fill="none"/><path d="M70 62 q-10 -15 0 -24 q10 9 0 24" fill="none"/><path d="M30 80 h45" stroke-dasharray="2 7"/>',
  geshem: '<path d="M34 22 q-14 20 0 34 q14 -14 0 -34" fill="none"/><path d="M40 72 l-3 12 M52 74 l-2 10 M64 70 l-3 12 M28 74 l-2 8"/>',
  blessing: '<path d="M50 12 l6 16 17 2 -13 12 4 17 -14 -9 -14 9 4 -17 -13 -12 17 -2 z"/>',
  appleHoney: '<path d="M50 42 q-14 -8 -22 4 q-6 13 5 24 q8 8 17 4 q9 4 17 -4 q11 -11 5 -24 q-8 -12 -22 -4 z"/><path d="M50 42 v-9 M50 33 q7 -2 9 -8"/><rect x="64" y="58" width="20" height="17" rx="3"/><path d="M68 58 v-5 h12 v5"/>',
  sufganiya: '<circle cx="50" cy="55" r="25"/><circle cx="50" cy="55" r="8"/><path d="M38 34 l-4 -6 M50 30 v-8 M62 34 l4 -6"/><path d="M40 40 l3 3 M58 42 l-3 3 M44 68 l3 -2 M60 66 l-3 2"/>',
  sevivon: '<path d="M38 30 h24 v20 l-12 16 -12 -16 z"/><path d="M44 20 h12 M50 20 v10"/><path d="M50 38 v10 M45 43 h10"/>',
  matza: '<circle cx="50" cy="50" r="30"/><circle cx="42" cy="44" r="3.5" fill="currentColor" stroke="none"/><circle cx="58" cy="56" r="3.5" fill="currentColor" stroke="none"/><circle cx="57" cy="37" r="2.5" fill="currentColor" stroke="none"/><circle cx="40" cy="60" r="2.5" fill="currentColor" stroke="none"/><path d="M50 20 v-6 M50 80 v6 M20 50 h-6 M80 50 h6"/>',
  keara: '<circle cx="50" cy="52" r="34"/><circle cx="50" cy="52" r="6"/><circle cx="50" cy="28" r="5"/><circle cx="50" cy="76" r="5"/><circle cx="29" cy="40" r="5"/><circle cx="71" cy="40" r="5"/><circle cx="29" cy="64" r="5"/><circle cx="71" cy="64" r="5"/>',
  wheat: '<path d="M50 88 V38"/><ellipse cx="42" cy="38" rx="5" ry="10" transform="rotate(-30 42 38)"/><ellipse cx="58" cy="38" rx="5" ry="10" transform="rotate(30 58 38)"/><ellipse cx="42" cy="52" rx="5" ry="10" transform="rotate(-30 42 52)"/><ellipse cx="58" cy="52" rx="5" ry="10" transform="rotate(30 58 52)"/><path d="M40 14 q10 -8 20 0"/>',
  oznayim: '<path d="M50 38 L30 72 h40 z"/><path d="M50 52 L41 67 h18 z"/><path d="M42 34 l-4 -8 M58 34 l4 -8"/>',
  danceTorah: '<rect x="34" y="14" width="32" height="22" rx="4"/><path d="M34 18 v14 M66 18 v14"/><path d="M42 14 v-4 M58 14 v-4"/><circle cx="50" cy="52" r="8"/><path d="M50 60 v14 M50 74 l-8 14 M50 74 l8 14 M50 62 l-12 10 M50 62 l12 10"/><circle cx="22" cy="60" r="6"/><path d="M22 66 v12 M22 78 l-6 12 M22 78 l6 12 M22 68 l8 8 M22 68 l-6 -10"/><circle cx="78" cy="60" r="6"/><path d="M78 66 v12 M78 78 l-6 12 M78 78 l6 12 M78 68 l-8 8 M78 68 l6 -10"/>',
  rimon: '<path d="M50 40 q-18 -6 -18 14 q0 20 18 26 q18 -6 18 -26 q0 -20 -18 -14 z"/><path d="M50 40 v-12 M50 28 q8 -2 10 -8 M50 28 q-8 -2 -10 -8"/><circle cx="44" cy="54" r="2" fill="currentColor" stroke="none"/><circle cx="56" cy="58" r="2" fill="currentColor" stroke="none"/><circle cx="50" cy="66" r="2" fill="currentColor" stroke="none"/><circle cx="42" cy="66" r="2" fill="currentColor" stroke="none"/><circle cx="58" cy="50" r="2" fill="currentColor" stroke="none"/>'
};

const cleanHeb = s => (s || '').replace(/[\u0591-\u05C7]/g, '');

const logoFor = name => {
  const n = cleanHeb(name);
  if (/ראש השנה|שופר/.test(n)) return wrap(ICONS.shofar) + wrap(ICONS.appleHoney) + wrap(ICONS.rimon);
  if (/כיפור/.test(n)) return wrap(ICONS.kippur);
  if (/סוכות/.test(n)) return wrap(ICONS.sukkah) + wrap(ICONS.minim);
  if (/חנוכה/.test(n)) return wrap(ICONS.chanukiya) + wrap(ICONS.sevivon) + wrap(ICONS.sufganiya);
  if (/פורים/.test(n)) return wrap(ICONS.purim) + wrap(ICONS.oznayim);
  if (/פסח/.test(n)) return wrap(ICONS.matza) + wrap(ICONS.keara);
  if (/שמחת תורה|שמחת-תורה/.test(n)) return wrap(ICONS.danceTorah) + wrap(ICONS.torah);
  if (/שבועות/.test(n)) return wrap(ICONS.torah) + wrap(ICONS.wheat);
  if (/ראש חודש/.test(n)) return wrap(ICONS.roshChodesh);
  return wrap(ICONS.torah);
};

const candleSvg = level => {
  const colors = { today: 'var(--gold-light)', week: 'var(--teal-light)', far: '#5a7089' };
  const c = colors[level] || colors.far;
  return `<svg viewBox="0 0 60 80" fill="none">
    <g class="flame">
      <ellipse cx="30" cy="22" rx="7" ry="13" fill="${c}" opacity=".95"/>
      <ellipse cx="30" cy="26" rx="3" ry="7" fill="#fff" opacity=".9"/>
    </g>
    <rect x="24" y="34" width="12" height="30" rx="3" fill="#e8eef5"/>
    <path d="M18 70 h24" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
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
const AZK_LABEL = d => d === 0 ? 'היום — יום השנה' : d === 1 ? 'מחר' : 'בעוד ' + d + ' ימים';

function buildDynamicPanels() {
  ['panel-azkarot', 'panel-notices', 'panel-services', 'panel-blessing'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  const main = $('#main');
  const { week, far } = azkarotData(S);
  if (week.length || far.length) {
    main.insertAdjacentHTML('beforeend', `
      <section class="panel" id="panel-azkarot">
        <h2 class="panel-title">אזכרות</h2>
        <div class="azk-wrap">
          ${week.map(a => `
            <div class="azk-row ${a.days === 0 ? 'today candle-glow' : 'week candle-mid'}">
              <div class="azk-candle">${candleSvg(a.days === 0 ? 'today' : 'week')}</div>
              <div class="azk-name">${a.name}</div>
              <div class="azk-meta">
                <div class="azk-date">${a.heb}</div>
                <div class="azk-when">${a.days === 0 ? AZK_LABEL(0) : a.weekday + ' • ' + AZK_LABEL(a.days)}</div>
              </div>
            </div>`).join('')}
          ${far.map(a => `
            <div class="azk-row far candle-dim">
              <div class="azk-candle">${candleSvg('far')}</div>
              <div class="azk-name">${a.name}</div>
              <div class="azk-meta">
                <div class="azk-date">${a.heb}</div>
                <div class="azk-when">${a.weekday}</div>
              </div>
            </div>`).join('')}
        </div>
        <div class="azk-note">יעלו זכרותם לברכה — נר השבוע מאיר</div>
      </section>`);
  }
  if ((S.yearBlessing || {}).names || 0) {
    const names = S.yearBlessing.names.filter(Boolean);
    main.insertAdjacentHTML('beforeend', `
      <section class="panel" id="panel-blessing">
        <h2 class="panel-title">ברכת השנה</h2>
        <div class="bless-frame">
          ${wrap(ICONS.blessing).replace('<svg', '<svg style="color:var(--gold);width:clamp(44px,5vw,80px);height:clamp(44px,5vw,80px);margin-bottom:1vh;filter:drop-shadow(0 0 12px rgba(251,191,36,.6))"')}
          <div id="blessNames">${names.map(n => `<div class="bless-name">${n}</div>`).join('')}</div>
          <div class="bless-sub">המתפללים יבואו עליהם ברכת השנה</div>
        </div>
      </section>`);
  }
  const not = activeNotices(S, new Date());
  const tk = $('#tickerInner');
  if (tk) {
    const items = not.map(n => {
      const body = [n.title, n.text].filter(Boolean).join(' — ').replace(/\\n|\n/g, ' ✦ ');
      return `<span class="tk-item">${body}</span>`;
    }).join('<span class="tk-sep">✦</span>');
    // שכפול תוכן לגלילה רציפה
    tk.innerHTML = items ? items + '<span class="tk-sep">✦</span>' + items : '';
    $('#ticker').style.display = items ? 'flex' : 'none';
  }
  if (S.services && S.services.length) {
    main.insertAdjacentHTML('beforeend', `
      <section class="panel" id="panel-services">
        <h2 class="panel-title">שירותי הקהילה</h2>
        <div class="list">
          ${S.services.map(v => `<div class="z-row"><span class="z-label" style="color:var(--text)">${v.name}</span>
            <span class="z-val" style="font-size:clamp(14px,1.4vw,26px);color:var(--teal-light)">${v.value || ''}</span></div>`).join('')}
        </div>
      </section>`);
  }
}

function renderStatic() {
  $('#shulName').textContent = S.shulName;
  const bm = document.querySelector('.ailon-mark');
  if (bm) bm.textContent = S.brand || 'AILON';
  $('#shulCity').textContent = S.city;
  if (INFO) {
    $('#hebDate').textContent = INFO.hebDate || '';
    $('#parsha').textContent = INFO.parsha || (INFO.isShabbat ? 'שבת שלום' : '');
    $('#special').textContent = INFO.holiday || '';
    $('#dafYomi').textContent = INFO.dafYomi || '';
    $('#holidayLogo').innerHTML = logoFor(INFO.holiday);
    const isGeshem = INFO.talGeshem.includes('גשם');
    $('#tgIcon').innerHTML = wrap(isGeshem ? ICONS.geshem : ICONS.tal);
    $('#talGeshem').textContent = INFO.talGeshem;
    $('#ftrTal').textContent = 'בתפילה: ' + INFO.talGeshem;
    $('#rainFx').style.display = isGeshem ? 'block' : 'none';
    if (isGeshem && !$('#rainFx').children.length)
      $('#rainFx').innerHTML = '<i style="right:8%;animation-delay:0s"></i><i style="right:24%;animation-delay:.5s"></i><i style="right:40%;animation-delay:.9s"></i><i style="right:56%;animation-delay:.3s"></i><i style="right:72%;animation-delay:1.2s"></i><i style="right:88%;animation-delay:.7s"></i>';
    const banner = $('#tgBanner');
    if (INFO.talTransition) {
      banner.style.display = 'block';
      banner.textContent = '★ החל מהיום בתפילת העמידה: ' + INFO.talGeshem + ' ★';
    } else banner.style.display = 'none';
    if (INFO.omer) {
      $('#omerBox').style.display = 'block';
      $('#omerBox').textContent = 'היום — ' + INFO.omer + ' ימים לעומר';
    } else $('#omerBox').style.display = 'none';
  } else $('#holidayLogo').innerHTML = logoFor('');
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / DAY);
  const hal = S.halacha || [];
  const picks = [];
  const hdKey = INFO ? (INFO.hd.getMonth() + '-' + INFO.hd.getDate()) : null;
  const dated = hdKey ? (S.halachot || {})[hdKey] : null;
  if (dated) picks.push(dated);
  if (hal.length) {
    const idx = (doy * 2) % hal.length;
    picks.push(hal[idx], hal[(idx + 1) % hal.length]);
  }
  const uniq = [...new Set(picks)].filter(Boolean).slice(0, 2);
  $('#halachaCards').innerHTML = uniq.map(h =>
    `<div class="halacha-card">${h}</div>`).join('') ||
    '<div class="halacha-card">הלכות יומיות — ניתן לעריכה במסך הניהול</div>';
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
  const ht = $('#hdrTime'); if (ht) ht.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  const hg = $('#hdrGreg'); if (hg) hg.textContent = now.toLocaleDateString('he-IL',
    { weekday: 'long', day: 'numeric', month: 'long' });
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
