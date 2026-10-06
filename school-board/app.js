/* לוח בית הספר — SB v2.0.0 | בסטייל ספריית רחובות | AILON Task */
const API = 'https://base44.app/api/apps/69f63b4536d7a2c6688403df/functions/schoolApi';
const $ = s => document.querySelector(s);
let CODE = new URLSearchParams(location.search).get('school') || 'neot-ashkelon';
let D = null;
const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

/* תוכן ברירת מחדל — כשאין נתונים מהשרת */
const FALLBACK = {
  name: 'בית הספר', motto: '',
  photos: [
    { title: 'ברוכים הבאים לבית הספר', image_url: 'https://media.base44.com/images/public/69f63b4536d7a2c6688403df/f623da77c_generated_image.png' },
    { title: 'שעת סיפור בכיתה', image_url: 'https://media.base44.com/images/public/69f63b4536d7a2c6688403df/91d3ccb2e_generated_image.png' },
    { title: 'סדנת יצירה', image_url: 'https://media.base44.com/images/public/69f63b4536d7a2c6688403df/511344075_generated_image.png' },
    { title: 'שיעור מדעים', image_url: 'https://media.base44.com/images/public/69f63b4536d7a2c6688403df/3760f01c1_generated_image.png' },
    { title: 'פעילות ספורט בחצר', image_url: 'https://media.base44.com/images/public/69f63b4536d7a2c6688403df/dddf75b67_generated_image.png' }
  ],
  news_cards: [
    { title: 'ברוכים הבאים לשנת הלימודים', description: 'מאחלים לכל תלמידי בית הספר שנה מוצלחת ומלאת הצלחות', badge: 'teal' },
    { title: 'יום ספורט בית ספרי', description: 'תחרויות, מסלולים ופעילויות ספורט לכל הכיתות', event_date: '11.10.2026', badge: 'orange' },
    { title: 'אסיפת הורים כיתות א׳', description: 'נושאים: הסתגלות, לוח זמנים ודגשים לשנה', event_date: '14.10.2026', badge: 'blue' },
    { title: 'ערב שירה ומוסיקה', description: 'ערב חגיגי בהשתתפות התלמידים והצוות', event_date: '29.10.2026', badge: 'purple' }
  ],
  rss: [
    { title: 'אדם יחיד לא יכול לעשות הכל, אבל כל אחד יכול לעשות משהו' },
    { title: 'כל ילד הוא עולם ומלואו' },
    { title: 'שאל טובה = למידה טובה' },
    { title: 'טעות היא הזדמנות ללמוד משהו חדש' },
    { title: 'כל הכבוד לקבוצת האקליפטוס על הזכייה בתחרות החשבון' },
    { title: 'תלמידים מצטיינים חוזרים מאליפות הארץ עם מדליות' },
    { title: 'מאות תלמידים התנדבו השבוע בקהילה' },
    { title: 'עשרות עצים חדשים נשתלו בחצר בית הספר' }
  ],
  notices: [
    { title: 'ביום ראשון יתקיים יום ספורט בית ספרי — עם בגדי ספורט ובקבוק מים' },
    { title: 'מבצע השבת ספרים לספרייה מסתיים ביום חמישי' },
    { title: 'קבוצת האקליפטוס זכתה במקום הראשון בתחרות החשבון הארצית — כל הכבוד!' }
  ]
};

const esc = s => (s||'').toString().replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function fetchBoard() {
  try {
    const r = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'get_board', code: CODE }), signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    if (!j.success) throw new Error('fail');
    D = j;
  } catch(e) {
    D = null;
  }
  renderAll();
}

/* מספר -> אותיות עבריות (כ״ה, ט״ו, ט״ז, א׳) */
function hebNum(n) {
  const ones=['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
  const tens=['','י','כ','ל','מ','נ','ס','ע','פ','צ'];
  const hund=['','ק','ר','ש','ת'];
  if(n===15) return 'ט״ו';
  if(n===16) return 'ט״ז';
  let s=(hund[Math.floor(n/100)]||''); n%=100;
  s+=(tens[Math.floor(n/10)]||''); n%=10;
  if(n) s+=ones[n];
  if(!s) return '';
  return s.length===1 ? s+'׳' : s.slice(0,-1)+'״'+s.slice(-1);
}
function hebDateStr(d) {
  try {
    const day = parseInt(new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day:'numeric' }).format(d));
    const month = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month:'long' }).format(d);
    return hebNum(day) + ' ב' + month;
  } catch(e){ return ''; }
}

/* ---------- שעון + תאריך + הפסקה הבאה ---------- */
function schedForToday() {
  const sc = ((D && D.settings) || {}).schedule || {};
  const day = new Date().getDay();
  if (day === 5) return { items: sc.friday || [] };
  if (day === 4) return { items: sc.thursday || [] };
  if (day === 0) return { items: sc.sunday || [] };
  return { items: sc.weekdays || [] };
}
function updateClock() {
  const now = new Date();
  $('#clock').textContent = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  $('#dateStr').textContent = 'יום ' + DAYS[now.getDay()] + ' ' + now.getDate() + ' ב' + MONTHS[now.getMonth()] + ' · ' + hebDateStr(now);
  // הפסקה הבאה
  const s = schedForToday();
  const mins = now.getHours()*60 + now.getMinutes();
  let nb = null;
  for (const it of s.items) {
    const [h,m] = (it.time||'').split(':').map(Number);
    if (isNaN(h)) continue;
    if (h*60+m > mins) { nb = { name: it.label, time: it.time, in: (h*60+m)-mins }; break; }
  }
  $('#nextBreak').textContent = nb
    ? (nb.in <= 1 ? nb.name + ' — עכשיו!' : nb.name + ' · ' + nb.time + ' · בעוד ' + nb.in + ' דק׳')
    : '';
  $('#nextBreak').style.display = nb ? '' : 'none';
}

/* ---------- כרטיסי חדשות: הודעות + אירועים ---------- */
function buildCards() {
  if (!D) return FALLBACK.news_cards;
  const cards = [];
  const badges = ['teal','orange','blue','purple','green','pink','gold','red'];
  (D.notices || []).forEach((n, i) => cards.push({
    title: n.title, description: n.text, badge: badges[i % badges.length], type: 'notice'
  }));
  (D.events || []).forEach((e, i) => {
    const d = new Date(e.event_date + 'T00:00:00');
    cards.push({
      title: e.title, description: e.description,
      event_date: d.getDate() + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear(),
      event_time: e.event_time || '', location: e.location || '',
      badge: badges[(i+2) % badges.length], type: 'event'
    });
  });
  return cards.length ? cards : FALLBACK.news_cards;
}
function renderNewsCards() {
  let items = buildCards();
  let filled = items.slice();
  while (filled.length < 12) filled = filled.concat(items);
  const html = filled.map(it => {
    const dateHtml = it.event_date ? '<div class="event-date">' + esc(it.event_date) + (it.event_time ? ' · ' + esc(it.event_time) : '') + '</div>' : '';
    const descHtml = it.description ? '<div class="desc">' + esc(it.description) + '</div>' : '';
    const locHtml = it.location ? '<div class="desc">' + esc(it.location) + '</div>' : '';
    return '<div class="news-card"><div class="badge b-' + it.badge + '">' + (it.type === 'event' ? '!' : '') + '</div><div><div class="txt">' + esc(it.title) + '</div>' + descHtml + locHtml + dateHtml + '</div></div>';
  }).join('');
  $('#newsScroll').innerHTML = html + html;
}

/* ---------- גלריית תמונות וסרטונים ---------- */
let _photoTimer = null, _curSlide = 0, _slides = [];
function renderPhotos() {
  const items = (D && (D.media || []).length) ? D.media : FALLBACK.photos;
  const panel = $('#photoPanel');
  const dots = $('#photoDots');
  panel.querySelectorAll('.photo-slide').forEach(s => s.remove());
  let slidesHtml = '', dotsHtml = '';
  items.forEach((m, i) => {
    const url = m.media_url || m.image_url || '';
    const isImg = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url);
    if (!url) return;
    const inner = isImg
      ? '<img src="' + esc(url) + '" alt="' + esc(m.title||'') + '">'
      : '<video src="' + esc(url) + '" autoplay muted playsinline loop></video>';
    slidesHtml += '<div class="photo-slide' + (i === 0 ? ' on' : '') + '">' + inner + '</div>';
    dotsHtml += '<div class="photo-dot' + (i === 0 ? ' active' : '') + '"></div>';
  });
  if (!slidesHtml) {
    slidesHtml = '<div class="photo-slide on"><div class="photo-ph"><div class="t">גלריית בית הספר</div></div></div>';
  }
  panel.insertAdjacentHTML('afterbegin', slidesHtml);
  dots.innerHTML = dotsHtml;
  _slides = panel.querySelectorAll('.photo-slide');
  const allDots = dots.querySelectorAll('.photo-dot');
  _curSlide = 0;
  if (_photoTimer) clearInterval(_photoTimer);
  // סרטון נשאר עד סופו — מעבר לפי סוג המדיה
  _photoTimer = setInterval(() => {
    if (_curSlide >= _slides.length) return;
    const cur = _slides[_curSlide];
    const v = cur && cur.querySelector('video');
    if (v && !v.ended && v.currentTime > 0) return; // סרטון עדיין רץ
    _curSlide = (_curSlide + 1) % _slides.length;
    _slides.forEach(s => s.classList.remove('on'));
    allDots.forEach(d => d.classList.remove('active'));
    _slides[_curSlide].classList.add('on');
    if (allDots[_curSlide]) allDots[_curSlide].classList.add('active');
  }, 7000);
}

/* ---------- טיקר RSS עליון: חדשות חיוביות + ערכים + ימי הולדת ---------- */
function renderRss() {
  let items;
  if (D) {
    items = [];
    (D.values || []).forEach(v => items.push({ title: (v.title ? v.title + ': ' : '') + (v.text || '') }));
    const now = new Date();
    (D.birthdays || []).forEach(b => {
      if (!b.event_date) return;
      const d = new Date(b.event_date + 'T00:00:00');
      if (d.getMonth() === now.getMonth() && Math.abs(d.getDate() - now.getDate()) <= 2)
        items.push({ title: 'יום הולדת שמח ל' + b.title + '!' });
    });
  } else {
    items = null;
  }
  if (!items || !items.length) items = FALLBACK.rss;
  let filled = items.slice();
  while (filled.length < 20) filled = filled.concat(items);
  const html = filled.map(it => '<div class="rss-item"><span class="dot"></span><span>' + esc(it.title) + '</span></div>').join('');
  $('#rssTrack').innerHTML = html + html;
}

/* ---------- טיקר תחתון: הודעות בית הספר ---------- */
function renderNoticesTicker() {
  let items = (D && (D.notices || []).length) ? D.notices : FALLBACK.notices;
  let filled = items.slice();
  while (filled.length < 12) filled = filled.concat(items);
  const html = filled.map(n => '<div class="news-item"><span class="dot"></span><span>' + esc(n.title) + (n.text ? ' — ' + esc(n.text) : '') + '</span></div>').join('');
  $('#newsTrack').innerHTML = html + html;
}

/* ---------- כללי ---------- */
function renderAll() {
  $('#schoolName').textContent = (D && D.name) ? D.name : FALLBACK.name;
  const motto = (D && D.settings && D.settings.motto) || FALLBACK.motto;
  $('#schoolMotto').textContent = motto;
  document.title = ((D && D.name) || FALLBACK.name) + ' — לוח בית הספר';
  renderNewsCards();
  renderPhotos();
  renderRss();
  renderNoticesTicker();
}

(async function init(){
  await fetchBoard();
  $('#loading').classList.add('hidden');
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(fetchBoard, 60000);
})();
