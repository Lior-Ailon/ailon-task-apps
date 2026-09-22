// Interpretation rules apply to the person's own ratings, not a diagnosis or comparison to others.
export function analyzeWheel(scores, domains, customDomain = '') {
  const ranked = domains.map((domain) => ({
    id: domain.id,
    label: domain.id === 'other' && customDomain.trim() ? customDomain.trim() : domain.label,
    score: Number(scores[domain.id]),
  })).sort((a, b) => a.score - b.score);
  const strengths = ranked.filter(d => d.score >= 8).sort((a,b) => b.score - a.score);
  const opportunities = ranked.filter(d => d.score <= 5);
  const stable = ranked.filter(d => d.score >= 6 && d.score <= 7);
  const average = (ranked.reduce((total, d) => total + d.score, 0) / ranked.length).toFixed(1);
  const min = ranked[0].score, max = ranked[ranked.length - 1].score;
  const names = (items) => items.map(d => `${d.label} (${d.score}/10)`).join(', ');

  const pattern = min === max
    ? `כל התחומים קיבלו ${min}/10. הדירוגים זהים, לכן אין בסיס לבחור תחום אחד כחוזקה יחסית או כחולשה יחסית.${min >= 8 ? ' רמת שביעות הרצון שסומנה גבוהה בכל התחומים.' : ''}`
    : max - min >= 4
      ? `ניכר פער של ${max - min} נקודות בין התחום הגבוה לנמוך. הפער יכול לעזור לבחור מה לשמר והיכן להשקיע תשומת לב, בלי להסיק שהתחום הנמוך מגדיר אותך.`
      : `הציונים קרובים זה לזה (פער של ${max - min} נקודות). התמונה מאוזנת יחסית, ולכן עדיף לבחור כיוון לפי מה שחשוב לך כעת ולא רק לפי המספר הנמוך ביותר.`;
  const strengthText = strengths.length
    ? `תחומים שדורגו גבוה (8–10): ${names(strengths)}. אלה משאבים שאפשר להישען עליהם, אך כדאי לשאול מה כבר עובד שם ומה תרצה לשמר.`
    : 'לא סומנו כרגע תחומים בדירוג 8–10. זה לא אומר שאין לך חוזקות: השאלון מודד את שביעות הרצון הנוכחית, לא יכולות או ערך אישי.';
  const growthText = opportunities.length
    ? `תחומים שכדאי לבחון (1–5): ${names(opportunities)}. אלה נקודות לשיחה ולבחירה, לא אבחנה ולא רשימת כישלונות.`
    : 'לא נמצאו תחומים בדירוג 1–5. אין סיבה להכריז על תחום כלשהו כבעיה; אפשר לחשוב דווקא מה חשוב לשמר ומה היית רוצה להעמיק.';
  const nextStep = opportunities.length
    ? `בחר/י תחום אחד מתוך ${opportunities.length} התחומים שדורגו 1–5, ושאל/י: מה חסר בו כיום, מה כבר כן עובד, ומה פעולה קטנה אחת שאפשר לנסות בשבוע הקרוב?`
    : 'בחר/י תחום אחד שחשוב לך לשמר או לקדם, והגדר/י פעולה קטנה לשבוע הקרוב.';
  const meaning = 'המעגל משקף את תחושת שביעות הרצון שלך כרגע בעשרה תחומי חיים. זהו צילום מצב אישי, לא מבחן, אבחון או דירוג של מי שאתה. המספרים עוזרים לפתוח שיחה על מה עובד ומה היית רוצה לשנות.';
  const interpretation = `${meaning} ${pattern}`;
  const summaryText = [
    `ממוצע: ${average}/10. ${pattern}`,
    strengthText, growthText,
    stable.length ? `תחומים באמצע (6–7): ${names(stable)}. אפשר להמשיך לטפח אותם בלי להגדירם כחוזקה או כבעיה.` : '',
    `צעד הבא: ${nextStep}`,
  ].filter(Boolean).join('\n\n');
  return { average, strengths, opportunities, stable, interpretation, strengthText, growthText, nextStep, summaryText };
}
