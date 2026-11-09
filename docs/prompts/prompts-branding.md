# מיתוג AILON — הנחיות ופרומפטים לזהות מותג אחידה (AILON Branding)

קובץ זה מפרט כיצד להנחות סוכני AI להחיל את שפת המיתוג האחידה של AILON על כל אפליקציה חדשה או קיימת. המיתוג כולל את צבע הטורקיז המזוהה (`#0d9488`), אייקון מתכתי תלת-ממדי, חווית עברית תחילה (RTL First) ותמיכה מלאה ב-PWA.

---

## 📑 תוכן העניינים
1. [החלת זהות המותג של AILON (Core Brand Prompt)](#1-החלת-זהות-המותג-של-ailon-core-brand-prompt)
2. [פרומפט ליצירת אייקון מתכתי תלת-ממדי (3D Metallic Icon Prompt)](#2-פרומפט-ליצירת-אייקון-מתכתי-תלת-ממדי-3d-metallic-icon-prompt)
3. [הפיכת אפליקציה ל-PWA תקני בסגנון AILON (PWA Setup)](#3-הפיכת-אפליקציה-ל-pwa-תקני-בסגנון-ailon-pwa-setup)
4. [מיתוג ממשק עברית-תחילה (RTL-First Hebrew UI)](#4-מיתוג-ממשק-עברית-תחילה-rtl-first-hebrew-ui)
5. [תבנית Header & Footer ממותגים בלוגו AILON](#5-תבנית-header--footer-ממותגים-בלוגו-ailon)

---

### 1. החלת זהות המותג של AILON (Core Brand Prompt)

**מתי להשתמש?** בכל פנייה לסוכן AI המבקשת לעצב או לבנות אפליקציה חדשה של AILON.

```markdown
אתה מעצב ומפתח פרונטאנד הבית של מותג AILON.
עליך לעצב את [שם האפליקציה] תוך שמירה קפדנית על זהות המותג של AILON לפי ההנחיות הבאות:

---
### 🎨 1. צבעי המותג (Brand Palette)
- **Primary Teal (טורקיז מוביל):** `#0d9488` (Tailwind `teal-600` או `teal-500` לפוקוס).
- **Primary Dark (טורקיז כהה לרקעים וטקסטים):** `#0f766e` / `#115e59`.
- **Primary Light (טורקיז בהיר למשטחים/Hover):** `#ccfbf1` / `#f0fdfa`.
- **Neutral Dark (טקסטים ורקע כהה):** `#0f172a` (Slate 900).
- **Neutral Light (רקע אפליקציה):** `#f8fafc` (Slate 50).
- **Accent Metallic:** אפקטים מתכתיים (Silver/Chrome Gradients) לרקעי אייקונים ולוגו.

### 🔤 2. טיפוגרפיה ועברית (Hebrew RTL First)
- גופן ראשי: 'Rubik' או 'Heebo' מבית Google Fonts.
- כיווניות: `dir="rtl"` בכל המערכת.
- כל הרכיבים (כפתורים, טפסים, תפריטים) מותאמים לקריאה מימין לשמאל.

### 📱 3. דרישות PWA ומובייל
- מראה מותאם כ-App עצמאי (Standalone Web App).
- אייקון מותג מתכתי בולט.
- סרגל כלים עליון שקוף/ממותג.

עצב את [שם האפליקציה] בהתאם לערכי המותג הללו.
```

---

### 2. פרומפט ליצירת אייקון מתכתי תלת-ממדי (3D Metallic Icon Prompt)

**מתי להשתמש?** ליצירת אייקון AILON מרהיב במחוללי תמונות (Midjourney / DALL-E / Flux) או עבור CSS Metallic Badges.

```markdown
A premium 3D metallic icon for AILON brand, featuring a sleek stylized 'A' logo or symbol, crafted from polished brushed teal metal (#0d9488) and chrome silver edges. Modern glassmorphism background with soft ambient teal glow, studio lighting, smooth gradients, dark slate environment, high resolution, minimalist, ultra-detailed 8k render, web app icon style, square with rounded corners.
```

*(פרומפט מקביל לייצוא רכיב CSS מתכתי)*:

```markdown
צור עבור [שם האפליקציה] רכיב אייקון AILON ב-CSS בלבד:
- צורה: ריבוע עם פינות עגולות (`rounded-2xl`).
- רקע: מעבר צבעים מתכתי (Gradient): `bg-gradient-to-br from-teal-500 via-teal-600 to-slate-800`.
- מסגרת: גבול מתכתי מבריק `border border-teal-300/40`.
- צל מונפש (Glow): `shadow-lg shadow-teal-500/30`.
- אייקון פנימי תלת-ממדי בגוון כסף/לבן.
```

---

### 3. הפיכת אפליקציה ל-PWA תקני בסגנון AILON (PWA Setup)

**מתי להשתמש?** כשהאפליקציה מוכנה ורוצים לאפשר התקנה בנייד (PWA) עם מסך פתיחה ומניפסט AILON.

```markdown
אתה מומחה PWA (Progressive Web Apps). התקן תמיכת PWA מלאה עבור [שם האפליקציה] לפי תקן AILON:

1. **קובץ `manifest.json` ממותג:**
   - `name`: "[שם האפליקציה] - AILON"
   - `short_name`: "[שם האפליקציה]"
   - `start_url`: "/"
   - `display`: "standalone"
   - `background_color`: "#f8fafc"
   - `theme_color`: "#0d9488"
   - `dir`: "rtl"
   - `lang`: "he"
   - הגדרת סמלים (192x192, 512x512) המפנים לאייקון המותג המתכתי.

2. **קובץ `service-worker.js` בסיסי:**
   - Caching עבור קבצים סטטיים (Offline Capability).
   - עדכון אוטומטי בברקע.

3. **רכיב "התקן אפליקציה" (Install Prompt Banner):**
   - כפתור צף בתחתית המסך בעברית: "הוסף את [שם האפליקציה] למסך הבית".
   - כפתור בגוון טורקיז AILON (`#0d9488`).

ספק את הקוד המלא עבור המניפסט, ה-Service Worker וסคריפט הרישום.
```

---

### 4. מיתוג ממשק עברית-תחילה (RTL-First Hebrew UI)

**מתי להשתמש?** להבטחת תאימות מלאה ושפת דיבור טבעית ומכבדת בממשק העברי של AILON.

```markdown
אתה מעצב חווית משתמש וקופירייטר בעברית. התאם את כל הטקסטים והממשק של [שם האפליקציה] לסטנדרט הדיבור של AILON:

---
### כללי הניסוח וה-RTL של AILON:
1. **שפה ישירה, קצרה ומניעה לפעולה:**
   - במקום "בוצע בהצלחה" -> "נשמר בהצלחה!"
   - במקום "האם אתה בטוח שברצונך למחוק?" -> "למחוק את [שם הפריט]?"
   - כפתורים בפעלים פעילים: "צור תור", "שמור שינויים", "שלח דוח".
2. **התאמה מגדרית ניטרלית / בגובה העיניים:**
   - שימוש בלשון פנייה נקייה ומזמינה.
3. **מיקום אלמנטים ב-RTL:**
   - לוגו AILON בצד ימין עליון.
   - כפתור סגירה/חזרה בצד שמאל.
   - כפתורי אישור (Primary CTA) בצד ימין של קבוצת כפתורים.

החלף את הניסוחים והיישורים בקוד הבא בהתאם להנחיות AILON.
```

---

### 5. תבנית Header & Footer ממותגים בלוגו AILON

**מתי להשתמש?** ליצירת סרגל ניווט עליון ותחתון אחיד וממותג לכל האפליקציות של AILON.

```markdown
אתה מפתח פרונטאנד. צור קומפוננטת Header ו-Footer ממותגת ב-Tailwind CSS עבור [שם האפליקציה]:

---
### 1. סרגל עליון (AILON Header):
- **ימין:** אייקון AILON מתכתי (טורקיז `#0d9488`) + שם האפליקציה [שם האפליקציה].
- **מרכז:** תפריט ניווט מהיר (אם רלוונטי) או סרגל חיפוש.
- **שמאל:** אינדיקטור סטטוס חיבור (נקודה ירוקה "מחובר"), כפתור מחליף מצב כהה/בהיר (Dark Mode Toggle) ואייקון פרופיל משתמש.

### 2. סרגל תחתון (AILON Footer):
- טקסט זכויות יוצרים: "מופעל על ידי AILON © [שנה]".
- קישורים מהירים: "תמיכה", "תנאי שימוש", "PWA Status".
- שולב בטקסט בגוון Slate עדין עם קו הפרדה עליון דק.

ספק את קוד ה-React / HTML המלא לרכיבים אלו.
```
