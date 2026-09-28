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
const LS_KEY = 'shulboard.settings';
let S = null, $ = s => document.querySelector(s);

const DEFAULTS = {
  version: 1,
  shulName: 'בית הכנסת שיח יוסף ע"ש הרב יוסף חדד',
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
  azkarot: [], notices: [], services: [],
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

function tryGate() {
  if ($('#pw').value === S.password) {
    $('#gate').style.display = 'none';
    $('#admin').classList.add('on');
  } else toast('סיסמה שגויה');
}

function fillForm() {
  $('#f_shulName').value = S.shulName;
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
  renderProfiles();
  renderAzkarot();
  renderNotices();
  renderServices();
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
const HEB_MONTH_NAMES = {1:'תשרי',2:'חשוון',3:'כסלו',4:'טבת',5:'שבט',6:'ניסן',7:'אייר',8:'סיון',9:'תמוז',10:'אב',11:'אלול',13:'אדר א\' ',14:'אדר ב\''};

function renderAzkarot() {
  $('#azkarotRows').innerHTML = (S.azkarot||[]).map((a,i)=>`
    <div class="mrow" data-azk="${i}">
      <input class="azk-name" value="${a.name||''}" placeholder="שם הנפטר">
      <input class="azk-day" type="number" min="1" max="30" value="${a.day||''}" placeholder="יום" style="direction:ltr">
      <select class="azk-month">${HEB_MONTH_OPTS.map(m=>`<option value="${m}" ${a.month===m?'selected':''}>${HEB_MONTH_NAMES[m]}</option>`).join('')}</select>
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

function delArr(key, i){ S[key].splice(i,1); renderAzkarot(); renderNotices(); renderServices(); }

function collectExtra() {
  S.azkarot = [...document.querySelectorAll('#azkarotRows [data-azk]')].map(r=>({
    name: r.querySelector('.azk-name').value,
    day: +r.querySelector('.azk-day').value || '',
    month: +r.querySelector('.azk-month').value
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
}

function save() {
  collectProfiles();
  collectExtra();
  S.shulName = $('#f_shulName').value;
  S.lat = parseFloat($('#f_lat').value);
  S.lng = parseFloat($('#f_lng').value);
  S.offsets = {
    tefillin: +$('#f_tefillin').value, candles: +$('#f_candles').value,
    tzeit: +$('#f_tzeit').value, rt: +$('#f_rt').value
  };
  S.halacha = $('#f_halacha').value.split('\n').map(x => x.trim()).filter(Boolean);
  S.yearBlessing = { names: $('#f_blessing').value.split('\n').map(x => x.trim()).filter(Boolean) };
  const pw = $('#f_pw').value.trim();
  if (pw) S.password = pw;
  localStorage.setItem(LS_KEY, JSON.stringify(S));
  toast('נשמר ✔ הלוח בטלוויזיה יתעדכן בתוך דקה');
}

function exportJson() {
  collectProfiles();
  collectExtra();
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'settings.json';
  a.click();
}

function importJson(ev) {
  const f = ev.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    S = deepMerge(S, JSON.parse(r.result));
    fillForm();
    localStorage.setItem(LS_KEY, JSON.stringify(S));
    toast('יובא ✔');
  };
  r.readAsText(f);
}

function resetLocal() {
  if (!confirm('לאפס את כל ההגדרות במסך זה?')) return;
  localStorage.removeItem(LS_KEY);
  location.reload();
}

$('#f_city') && 0; // placeholder
(async function main() {
  S = await loadSettings();
  fillForm();
  const cs = $('#f_city');
  cs.addEventListener('change', () => {
    const c = CITIES[cs.value];
    if (c) { $('#f_lat').value = c[0]; $('#f_lng').value = c[1]; }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && $('#admin').classList.contains('on') === false) tryGate(); });
})();
