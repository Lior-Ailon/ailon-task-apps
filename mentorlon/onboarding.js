// Mentor-IT Onboarding System
// Shows a 3-step intro overlay on first visit to any tool

const ONBOARDING_STEPS = {
  'positive-thinking': [
    { icon: '💭', title: 'חשיבה חיובית', text: 'כלי להתמרת מחשבות שליליות. כתוב מחשבה, קבל הפנמה חלופית.' },
    { icon: '📊', title: 'מד יומי', text: 'דרג את רמת החשיבה החיובית שלך כל יום ועקוב אחרי מגמה.' },
    { icon: '💡', title: '7 עקרונות', text: 'כללים מבוססי מדע לשינוי דפוסי חשיבה. E+R=O בלב.' },
  ],
  'emotions': [
    { icon: '😊', title: 'ניהול רגשות', text: 'בחר רגש, דרג עוצמה, קבל הכוונה מעשית מבוססת CBT.' },
    { icon: '🧘', title: '5 שלבים', text: 'עצור ונשום → זהה → בדוק מחשבה → בחר תגובה → פעל או הנח.' },
    { icon: '📖', title: 'חוכמת חיים', text: 'רגש הוא איתות לא עובדה. 90 שניות — והגל חולף.' },
  ],
  'relationships': [
    { icon: '❤️', title: 'ניהול זוגיות', text: '4 עמודי תווך: ברית, תקשורת, מטרה משותפת, זמן איכות.' },
    { icon: '📊', title: 'מד הזוגיות', text: '4 שאלות מהירות — קבל תמונת מצב והמלצה מיידית.' },
    { icon: '💡', title: 'כללי זהב', text: 'אהבה → אמון → כבוד. הסדר חשוב. E+R=O גם בזוגיות.' },
  ],
  'parenting': [
    { icon: '👨‍👧', title: 'חינוך ילדים', text: '6 עקרונות יסוד: חיבור לפני תיקון, דוגמה אישית, גבולות בחום.' },
    { icon: '🎮', title: 'תרחישים', text: 'מצבים אמיתיים מהשטח עם המלצות מעשיות — לחץ וקבל כיוון.' },
    { icon: '📐', title: 'E+R=O', text: 'התגובה שלך לילד היא השיעור החשוב ביותר שהוא לומד.' },
  ],
};

function getToolKey() {
  const path = window.location.pathname.split('/').pop().replace('.html', '');
  return path;
}

function showOnboarding() {
  const toolKey = getToolKey();
  const steps = ONBOARDING_STEPS[toolKey];
  if (!steps) return;
  if (localStorage.getItem('onboarded_' + toolKey)) return;
  
  let currentStep = 0;
  
  const overlay = document.createElement('div');
  overlay.id = 'onboarding-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
  
  const card = document.createElement('div');
  card.style.cssText = 'background:#fff;border-radius:20px;max-width:380px;width:100%;padding:30px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);';
  overlay.appendChild(card);
  
  function renderStep() {
    const step = steps[currentStep];
    card.innerHTML = `
      <div style="font-size:48px;margin-bottom:16px;">${step.icon}</div>
      <h2 style="font-size:22px;font-weight:800;color:#0d9488;margin-bottom:10px;">${step.title}</h2>
      <p style="font-size:15px;line-height:1.7;color:#475569;margin-bottom:24px;">${step.text}</p>
      <div style="display:flex;gap:6px;justify-content:center;margin-bottom:20px;">
        ${steps.map((_, i) => `<div style="width:8px;height:8px;border-radius:50%;background:${i === currentStep ? '#0d9488' : '#e2e8f0'};"></div>`).join('')}
      </div>
      <button id="onboardNext" style="width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;">
        ${currentStep < steps.length - 1 ? 'המשך →' : 'התחל! 🚀'}
      </button>
      ${currentStep < steps.length - 1 ? '<div onclick="skipOnboarding()" style="margin-top:14px;font-size:13px;color:#94a3b8;cursor:pointer;">דלג</div>' : ''}
    `;
    document.getElementById('onboardNext').onclick = () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        renderStep();
      } else {
        closeOnboarding();
      }
    };
  }
  
  function closeOnboarding() {
    localStorage.setItem('onboarded_' + toolKey, '1');
    overlay.remove();
  }
  
  window.skipOnboarding = closeOnboarding;
  
  document.body.appendChild(overlay);
  renderStep();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showOnboarding);
} else {
  showOnboarding();
}
