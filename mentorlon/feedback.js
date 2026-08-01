// Mentor-IT Feedback Widget
// Shows a small feedback popup after tool usage (3 questions, 1-5 rating)

function initFeedback() {
  const toolKey = window.location.pathname.split('/').pop().replace('.html', '');
  if (!toolKey || toolKey === 'index' || toolKey === 'dashboard') return;
  
  // Show feedback after 2 minutes of usage
  setTimeout(() => {
    if (localStorage.getItem('feedback_' + toolKey)) return;
    if (document.hidden) return;
    showFeedback(toolKey);
  }, 120000);
}

function showFeedback(toolKey) {
  const overlay = document.createElement('div');
  overlay.id = 'feedback-overlay';
  overlay.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9998;background:#fff;border-radius:16px;padding:18px;box-shadow:0 8px 30px rgba(0,0,0,0.15);max-width:320px;border:1px solid #ccfbf1;';
  
  overlay.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <span style="font-size:14px;font-weight:700;color:#0d9488;">💬 משוב מהיר</span>
      <span onclick="document.getElementById('feedback-overlay').remove()" style="cursor:pointer;color:#94a3b8;font-size:18px;">×</span>
    </div>
    <div style="margin-bottom:14px;">
      <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">כמה הכלי הזה מועיל?</label>
      <div id="fbRating" style="display:flex;gap:4px;">
        ${[1,2,3,4,5].map(i => `<button onclick="setFbRating(${i})" id="fbStar${i}" style="font-size:22px;background:none;border:none;cursor:pointer;color:#e2e8f0;">★</button>`).join('')}
      </div>
    </div>
    <div style="margin-bottom:14px;">
      <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">מה היה חסר?</label>
      <input type="text" id="fbMissing" placeholder="אופציונלי" style="width:100%;padding:8px 10px;border-radius:8px;border:1px solid #e2e8f0;font-size:13px;font-family:inherit;">
    </div>
    <button onclick="submitFeedback('${toolKey}')" style="width:100%;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;">שלח משוב</button>
  `;
  
  document.body.appendChild(overlay);
}

let fbRating = 0;

function setFbRating(val) {
  fbRating = val;
  for (let i = 1; i <= 5; i++) {
    const star = document.getElementById('fbStar' + i);
    if (star) star.style.color = i <= val ? '#f59e0b' : '#e2e8f0';
  }
}

function submitFeedback(toolKey) {
  const missing = document.getElementById('fbMissing')?.value || '';
  const feedback = { tool: toolKey, rating: fbRating, missing, date: new Date().toISOString() };
  
  // Save to localStorage (could sync to entity later)
  const all = JSON.parse(localStorage.getItem('ailon_feedback') || '[]');
  all.push(feedback);
  localStorage.setItem('ailon_feedback', JSON.stringify(all));
  localStorage.setItem('feedback_' + toolKey, '1');
  
  const overlay = document.getElementById('feedback-overlay');
  if (overlay) {
    overlay.innerHTML = '<div style="text-align:center;padding:14px;"><div style="font-size:32px;margin-bottom:8px;">🙏</div><p style="font-size:14px;color:#0d9488;font-weight:600;">תודה על המשוב!</p></div>';
    setTimeout(() => overlay.remove(), 2000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeedback);
} else {
  initFeedback();
}
