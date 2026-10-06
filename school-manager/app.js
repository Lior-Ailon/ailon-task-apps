/* SB — מערכת לניהול מסכים בבתי ספר v1.0.0 | AILON Task */
const API = 'https://base44.app/api/apps/69f63b4536d7a2c6688403df/functions/schoolApi';
const UPLOAD = 'https://base44.app/api/apps/69f63b4536d7a2c6688403df/functions/schoolUpload';
const BOARD_URL = 'https://lior-ailon.github.io/ailon-task-apps/school-board/?school=';
let TOKEN = localStorage.getItem('sb_token') || '';
let USER = null;
let SCHOOLS = [];
let CUR = null;          // בית ספר נוכחי (רשומה מלאה)
let notices = [], events = [], media = [], birthdays = [], users = [];
const $ = s => document.querySelector(s);

const PAGE_LABELS = { home:'מסך בית', notices:'הודעות', events:'אירועים', media:'סרטונים ותמונות', schedule:'מערכת שעות', birthdays:'ימי הולדת' };
const SCHED_DAYS = [
  { key:'sunday', label:'יום א׳' }, { key:'weekdays', label:'ימים ב׳-ד׳' }, { key:'thursday', label:'יום ה׳' }, { key:'friday', label:'יום ו׳' }
];

function toast(msg){ const t=$('#toast'); t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',2600); }
const esc = s => (s||'').toString().replace(/"/g,'&quot;');

async function api(action, data={}) {
  const r = await fetch(API, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action, session_token: TOKEN, ...data })
  });
  const j = await r.json().catch(()=>({success:false,message:'שגיאת רשת'}));
  if (!j.success && j.message === 'Invalid session') { doLogout(true); }
  return j;
}

/* ---------- התחברות ---------- */
async function doLogin() {
  const username = $('#l_user').value.trim(), password = $('#l_pass').value;
  if (!username || !password) return toast('נא למלא שם משתמש וסיסמה');
  const r = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action:'login', username, password }) }).then(r=>r.json());
  if (!r.success) return toast(r.message || 'שגיאת התחברות');
  TOKEN = r.token; USER = r.user;
  localStorage.setItem('sb_token', TOKEN);
  enterPortal();
}
function doLogout(silent) {
  if (!silent) api('logout');
  TOKEN=''; USER=null; localStorage.removeItem('sb_token');
  $('#portal').classList.add('hidden'); $('#login').style.display='block';
}
function openPwModal(){ $('#pwModal').style.display='flex'; }
function closePwModal(){ $('#pwModal').style.display='none'; }
async function doChangePw() {
  const r = await api('change_password', { old_password: $('#p_old').value, new_password: $('#p_new').value });
  if (!r.success) return toast(r.message);
  closePwModal(); toast('הסיסמה עודכנה');
}

/* ---------- פורטל ---------- */
async function enterPortal() {
  const v = await api('verify');
  if (!v.success) return;
  USER = v.user;
  $('#login').style.display='none';
  $('#portal').classList.remove('hidden');
  $('#hello').textContent = 'שלום ' + (USER.display_name || USER.username);
  const r = await api('list_schools');
  SCHOOLS = r.data || [];
  if (USER.role === 'admin' && SCHOOLS.length) { renderList(); }
  else if (SCHOOLS.length) { openEditor(SCHOOLS[0].id); }
  else { renderList(); }
}
function renderList() {
  $('#editor').classList.add('hidden');
  $('#schoolListWrap').classList.remove('hidden');
  $('#schoolList').innerHTML = SCHOOLS.map(s => `
    <div class="card">
      <div><div class="c-name">${esc(s.name)}</div>
        <div class="c-sub">${esc(s.city||'')} · קוד: ${esc(s.code)}</div></div>
      <div class="c-actions">
        <span class="badge ${s.status}">${{trial:'ניסיון',active:'פעיל',paused:'מושהה'}[s.status]||s.status}</span>
        <button class="btn-sec" onclick="openEditor('${s.id}')">ניהול</button>
        ${USER.role==='admin'?`<button class="btn-danger" onclick="delSchool('${s.id}','${esc(s.name)}')">מחיקה</button>`:''}
      </div>
    </div>`).join('') || '<p class="hint">עדיין אין בתי ספר.</p>';
}
async function delSchool(id, name) {
  if (!confirm('למחוק את "' + name + '" לגמרי? כל ההודעות, האירועים והמדיה שלו יימחקו.')) return;
  const r = await api('delete_school', { school_id: id });
  if (!r.success) return toast(r.message);
  toast('נמחק'); enterPortal();
}

/* ---------- בית ספר חדש ---------- */
function openNewSchool() {
  const name = prompt('שם בית הספר:');
  if (!name) return;
  const code = prompt('קוד קצר באנגלית (למשל: neot-ashkelon):', '').trim();
  if (!code) return;
  const city = prompt('עיר (אופציונלי):', '') || '';
  createSchoolNow(name, code, city);
}
async function createSchoolNow(name, code, city) {
  const r = await api('create_school', { name, code, city, status:'trial', settings: defaultSettings() });
  if (!r.success) return toast(r.message);
  toast('בית הספר נוצר');
  await enterPortal();
  openEditor(r.data.id);
}
function defaultSettings() {
  return {
    motto: '', principal: '',
    board: { panel_seconds: 10, pages: ['home','notices','events','media','schedule','birthdays'] },
    schedule: {
      sunday: [{time:'08:00',label:'תחילת יום לימודים'},{time:'09:30',label:'הפסקה ראשונה'},{time:'10:45',label:'הפסקה שנייה'},{time:'12:15',label:'הפסקת צהריים'},{time:'13:30',label:'סיום יום לימודים'}],
      sunday_label: "יום א'",
      weekdays: [{time:'08:00',label:'תחילת יום לימודים'},{time:'09:30',label:'הפסקה ראשונה'},{time:'10:45',label:'הפסקה שנייה'},{time:'12:15',label:'הפסקת צהריים'},{time:'13:45',label:'סיום יום לימודים'}],
      weekdays_label: "ימים ב'-ד'",
      thursday: [{time:'08:00',label:'תחילת יום לימודים'},{time:'09:30',label:'הפסקה ראשונה'},{time:'10:45',label:'הפסקה שנייה'},{time:'12:45',label:'סיום יום לימודים'}],
      thursday_label: "יום ה'",
      friday: [{time:'08:00',label:'תחילת יום לימודים'},{time:'11:45',label:'סיום יום לימודים'}],
      friday_label: "יום ו'"
    }
  };
}

/* ---------- עורך ---------- */
async function openEditor(id) {
  const r = await api('get_school', { school_id: id });
  if (!r.success) return toast(r.message);
  CUR = r.data;
  CUR.settings = CUR.settings || defaultSettings();
  $('#schoolListWrap').classList.add('hidden');
  $('#editor').classList.remove('hidden');
  $('#edName').textContent = CUR.name;
  $('#edUrl').innerHTML = 'מסך התצוגה לטלוויזיה: <b>' + BOARD_URL + CUR.code + '</b> — פתח את הקישור בדפדפן של המסך והשאר פתוח';
  // פרטים
  $('#i_name').value = CUR.name||''; $('#i_city').value = CUR.city||'';
  $('#i_status').value = CUR.status||'trial'; $('#i_contact').value = CUR.contact_person||'';
  $('#i_phone').value = CUR.phone||''; $('#i_sub').value = CUR.subscription_type||'';
  $('#i_notes').value = CUR.notes||'';
  // הגדרות לוח
  const st = CUR.settings;
  $('#b_motto').value = st.motto||'';
  renderSched();
  // טעינת תוכן
  const cn = await api('list_content', { school_id: id }); const allC = cn.data || [];
  notices = allC.filter(c=>c.type==='notice');
  birthdays = allC.filter(c=>c.type==='birthday');
  media = allC.filter(c=>c.type==='media');
  const ev = await api('list_events', { school_id: id }); events = ev.data || [];
  renderNotices(); renderEvents(); renderMedia(); renderBirthdays();
  if (USER.role==='admin') { const u = await api('list_users', { school_id: id }); users = u.data || []; renderUsers(); }
  else { $('#tab-users').style.display='none'; document.querySelector('#tabs button[data-tab=users]').style.display='none'; }
  showTab('info');
}
function backToList(){ renderList(); }

function showTab(name) {
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on', b.dataset.tab===name));
  ['info','board','notices','events','media','birthdays','users'].forEach(t=>
    $('#tab-'+t).classList.toggle('hidden', t!==name));
}

/* פרטים */
async function saveInfo() {
  const r = await api('update_school', { school_id: CUR.id,
    name: $('#i_name').value, city: $('#i_city').value, status: $('#i_status').value,
    contact_person: $('#i_contact').value, phone: $('#i_phone').value,
    subscription_type: $('#i_sub').value, notes: $('#i_notes').value });
  if (!r.success) return toast(r.message);
  toast('הפרטים נשמרו');
}

/* לוח */
function renderSched() {
  const sc = CUR.settings.schedule = CUR.settings.schedule || {};
  $('#b_sched').innerHTML = SCHED_DAYS.map(d => {
    const items = sc[d.key] || [];
    const rows = items.map((it,i)=>`
      <div class="mrow" style="grid-template-columns:110px 1fr auto auto">
        <input type="time" value="${it.time||''}" data-sd="${d.key}" data-i="${i}" class="sd-time">
        <input value="${esc(it.label)}" data-sd="${d.key}" data-i="${i}" class="sd-label" placeholder="תיאור">
        <span></span>
        <button class="btn-danger" onclick="delSched('${d.key}',${i})">✕</button>
      </div>`).join('');
    return `<h2 style="font-size:16px">${d.label}</h2>${rows}
      <button class="btn-sec" onclick="addSched('${d.key}')">+ שורה</button>`;
  }).join('');
}
function addSched(key){ (CUR.settings.schedule[key]=CUR.settings.schedule[key]||[]).push({time:'',label:''}); renderSched(); }
function delSched(key,i){ CUR.settings.schedule[key].splice(i,1); renderSched(); }

async function saveBoard() {
  document.querySelectorAll('#b_sched .sd-time').forEach(el=>{
    CUR.settings.schedule[el.dataset.sd][+el.dataset.i].time = el.value; });
  document.querySelectorAll('#b_sched .sd-label').forEach(el=>{
    CUR.settings.schedule[el.dataset.sd][+el.dataset.i].label = el.value; });
  const settings = { ...CUR.settings,
    motto: $('#b_motto').value,
    board: { panel_seconds: 10, pages: Object.keys(PAGE_LABELS) } };
  const r = await api('save_settings', { school_id: CUR.id, settings });
  if (!r.success) return toast(r.message);
  CUR.settings = settings; toast('הגדרות הלוח נשמרו');
}

/* הודעות */
function renderNotices() {
  $('#noticeRows').innerHTML = notices.map((n,i)=>`
    <div style="background:var(--navy2);border-radius:12px;padding:12px;margin-bottom:10px" data-n="${i}">
      <div class="mrow" style="grid-template-columns:1.4fr 1fr 1fr auto">
        <input class="n-title" value="${esc(n.title)}" placeholder="כותרת">
        <input class="n-from" type="date" value="${n.show_from||''}" title="מתאריך">
        <input class="n-until" type="date" value="${n.show_until||''}" title="עד תאריך">
        <button class="btn-danger" onclick="notices.splice(${i},1);renderNotices()">✕</button>
      </div>
      <textarea class="n-text" style="width:100%;min-height:56px;padding:8px 10px;border-radius:9px;border:1px solid var(--line);background:var(--navy);color:#fff;font-size:15px;font-family:inherit" placeholder="טקסט (אופציונלי)">${esc(n.text)}</textarea>
    </div>`).join('') || '<p class="hint">אין הודעות.</p>';
}
function addNotice(){ notices.push({title:'',text:'',show_from:'',show_until:''}); renderNotices(); }
async function saveNotices() {
  document.querySelectorAll('#noticeRows [data-n]').forEach(el=>{
    const n = notices[+el.dataset.n];
    n.title = el.querySelector('.n-title').value; n.text = el.querySelector('.n-text').value;
    n.show_from = el.querySelector('.n-from').value; n.show_until = el.querySelector('.n-until').value;
  });
  const existing = await api('list_content', { school_id: CUR.id, type:'notice' });
  const keepIds = new Set(notices.map(n=>n.id).filter(Boolean));
  for (const old of (existing.data||[])) if (!keepIds.has(old.id)) await api('delete_content', { id: old.id });
  for (const n of notices) {
    const r = await api('save_content', { id: n.id, school_id: CUR.id, type:'notice',
      title:n.title, text:n.text, show_from:n.show_from, show_until:n.show_until, status:'active', sort_order: 0 });
    if (!n.id && r.success) n.id = r.id;
  }
  toast('ההודעות נשמרו');
}

/* אירועים */
function renderEvents() {
  $('#eventRows').innerHTML = events.map((e,i)=>`
    <div class="mrow" style="grid-template-columns:1.4fr 1fr 1fr 1fr auto" data-e="${i}">
      <input class="e-title" value="${esc(e.title)}" placeholder="שם האירוע">
      <input class="e-date" type="date" value="${e.event_date||''}">
      <input class="e-time" type="time" value="${e.event_time||''}" title="שעה">
      <input class="e-loc" value="${esc(e.location)}" placeholder="מקום">
      <button class="btn-danger" onclick="events.splice(${i},1);renderEvents()">✕</button>
    </div>
    <textarea class="e-desc" data-e="${i}" style="width:100%;min-height:44px;margin-bottom:10px;padding:8px 10px;border-radius:9px;border:1px solid var(--line);background:var(--navy);color:#fff;font-size:14px;font-family:inherit" placeholder="תיאור (אופציונלי)">${esc(e.description)}</textarea>`).join('') || '<p class="hint">אין אירועים.</p>';
}
function addEvent(){ events.push({title:'',event_date:'',event_time:'',location:'',description:''}); renderEvents(); }
async function saveEvents() {
  events.forEach((e,i)=>{
    const row = document.querySelector(`#eventRows .mrow[data-e="${i}"]`);
    if (row) { e.title=row.querySelector('.e-title').value; e.event_date=row.querySelector('.e-date').value;
      e.event_time=row.querySelector('.e-time').value; e.location=row.querySelector('.e-loc').value; }
    const ta = document.querySelector(`#eventRows .e-desc[data-e="${i}"]`);
    if (ta) e.description = ta.value;
  });
  const existing = await api('list_events', { school_id: CUR.id });
  const keepIds = new Set(events.map(e=>e.id).filter(Boolean));
  for (const old of (existing.data||[])) if (!keepIds.has(old.id)) await api('delete_event', { id: old.id });
  for (const e of events) {
    const r = await api('save_event', { id: e.id, school_id: CUR.id, title:e.title, description:e.description,
      event_date:e.event_date, event_time:e.event_time, location:e.location, status:'active' });
    if (!e.id && r.success) e.id = r.id;
  }
  toast('האירועים נשמרו');
}

/* מדיה */
function renderMedia() {
  $('#mediaRows').innerHTML = media.map((m,i)=>{
    const isImg = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(m.media_url||'');
    const prev = m.media_url ? (isImg?`<img src="${esc(m.media_url)}">`:`<video src="${esc(m.media_url)}" muted></video>`) : '<div style="width:110px;height:64px;border-radius:8px;background:var(--navy3);display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:12px">ללא</div>';
    return `
    <div class="media-item" data-m="${i}">
      ${prev}
      <div>
        <input class="m-title" value="${esc(m.title)}" placeholder="כותרת (אופציונלי)" style="width:100%;padding:9px 10px;border-radius:9px;border:1px solid var(--line);background:var(--navy2);color:#fff;font-size:15px;margin-bottom:8px">
        <input class="m-url" value="${esc(m.media_url)}" placeholder="קישור לסרטון/תמונה" style="width:100%;padding:9px 10px;border-radius:9px;border:1px solid var(--line);background:var(--navy2);color:#fff;font-size:13px;direction:ltr">
        <div class="m-status hint" style="margin:6px 0 0"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <label class="btn-sec" style="text-align:center">העלאה<input type="file" class="m-file" accept="video/*,image/*" style="display:none" onchange="uploadMedia(${i},this)"></label>
        <button class="btn-danger" onclick="media.splice(${i},1);renderMedia()">✕</button>
      </div>
    </div>`;}).join('') || '<p class="hint">אין מדיה.</p>';
}
function addMedia(){ media.push({title:'',media_url:''}); renderMedia(); }
async function uploadMedia(i, input) {
  const file = input.files[0]; if (!file) return;
  const item = document.querySelector(`#mediaRows [data-m="${i}"]`);
  const st = item.querySelector('.m-status');
  if (file.size > 10*1024*1024) { st.textContent='הקובץ גדול מ-10MB'; return; }
  st.textContent='מעלה...';
  const fd = new FormData(); fd.append('file', file);
  try {
    const r = await fetch(UPLOAD, { method:'POST', body: fd }).then(r=>r.json());
    if (!r.success) { st.textContent = r.error || 'שגיאת העלאה'; return; }
    media[i].media_url = r.file_url;
    st.textContent='הועלה — לא לשכוח לשמור';
    item.querySelector('.m-url').value = r.file_url;
  } catch(e) { st.textContent = 'שגיאת רשת'; }
}
async function saveMedia() {
  document.querySelectorAll('#mediaRows [data-m]').forEach(el=>{
    const m = media[+el.dataset.m];
    m.title = el.querySelector('.m-title').value; m.media_url = el.querySelector('.m-url').value.trim();
  });
  const existing = await api('list_content', { school_id: CUR.id, type:'media' });
  const keepIds = new Set(media.map(m=>m.id).filter(Boolean));
  for (const old of (existing.data||[])) if (!keepIds.has(old.id)) await api('delete_content', { id: old.id });
  let n = 0;
  for (const m of media) {
    if (!m.media_url) continue;
    const r = await api('save_content', { id: m.id, school_id: CUR.id, type:'media',
      title:m.title, media_url:m.media_url, status:'active', sort_order: n++ });
    if (!m.id && r.success) m.id = r.id;
  }
  toast('המדיה נשמרה');
}

/* ימי הולדת */
function renderBirthdays() {
  $('#birthdayRows').innerHTML = birthdays.map((b,i)=>`
    <div class="mrow" style="grid-template-columns:1.6fr 1fr auto auto">
      <input class="b-name" data-b="${i}" value="${esc(b.title)}" placeholder="שם התלמיד/ה">
      <input class="b-date" type="date" data-b="${i}" value="${b.event_date||''}" title="תאריך יום ההולדת">
      <span></span>
      <button class="btn-danger" onclick="birthdays.splice(${i},1);renderBirthdays()">✕</button>
    </div>`).join('') || '<p class="hint">אין ימי הולדת.</p>';
}
function addBirthday(){ birthdays.push({title:'',event_date:''}); renderBirthdays(); }
async function saveBirthdays() {
  document.querySelectorAll('#birthdayRows .b-name').forEach(el=> birthdays[+el.dataset.b].title = el.value);
  document.querySelectorAll('#birthdayRows .b-date').forEach(el=> birthdays[+el.dataset.b].event_date = el.value);
  const existing = await api('list_content', { school_id: CUR.id, type:'birthday' });
  const keepIds = new Set(birthdays.map(b=>b.id).filter(Boolean));
  for (const old of (existing.data||[])) if (!keepIds.has(old.id)) await api('delete_content', { id: old.id });
  for (const b of birthdays) {
    if (!b.title || !b.event_date) continue;
    const r = await api('save_content', { id: b.id, school_id: CUR.id, type:'birthday',
      title:b.title, event_date:b.event_date, status:'active', sort_order: 0 });
    if (!b.id && r.success) b.id = r.id;
  }
  toast('ימי ההולדת נשמרו');
}

/* משתמשים */
function renderUsers() {
  $('#userRows').innerHTML = users.map(u=>`
    <div class="card" style="margin-bottom:10px">
      <div><div class="c-name" style="font-size:16px">${esc(u.display_name||u.username)}</div>
        <div class="c-sub">${esc(u.username)} · ${{admin:'מנהל מערכת',manager:'ניהולי'}[u.role]||u.role}</div></div>
      ${u.id!==USER.id?`<button class="btn-danger" onclick="delUser('${u.id}')">מחיקה</button>`:'<span class="hint">אתה</span>'}
    </div>`).join('') + `
    <div id="newUser" class="hidden" style="margin-top:14px">
      <div class="row3">
        <div class="fld"><label>שם משתמש</label><input id="u_name" style="direction:ltr"></div>
        <div class="fld"><label>סיסמה (4+ תווים)</label><input id="u_pass" type="password" style="direction:ltr"></div>
        <div class="fld"><label>שם לתצוגה</label><input id="u_disp"></div>
      </div>
      <button class="btn-main" onclick="createUserNow()">צור משתמש</button>
    </div>`;
}
function addUserRow(){ $('#newUser').classList.toggle('hidden'); }
async function createUserNow() {
  const r = await api('create_user', { school_id: CUR.id, username: $('#u_name').value,
    password: $('#u_pass').value, display_name: $('#u_disp').value || $('#u_name').value, role:'manager' });
  if (!r.success) return toast(r.message);
  toast('המשתמש נוצר');
  const u = await api('list_users', { school_id: CUR.id }); users = u.data || []; renderUsers();
}
async function delUser(id) {
  if (!confirm('למחוק משתמש זה?')) return;
  const r = await api('delete_user', { id });
  if (!r.success) return toast(r.message);
  const u = await api('list_users', { school_id: CUR.id }); users = u.data || []; renderUsers();
}

/* ---------- אתחול ---------- */
(async function init(){
  if (TOKEN) { const v = await api('verify'); if (v.success) { USER=v.user; enterPortal(); return; } }
  localStorage.removeItem('sb_token'); TOKEN='';
})();
