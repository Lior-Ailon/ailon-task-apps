# AILON App Shell — שכבת UX משותפת

כל אפליקציה בריפו מקבלת שכבת שיפור משותפת (2 קבצים, בלי תלויות):

```html
<script src="../_shared/ailon-shell.js" defer></script>
```

מה זה נותן:
- כפתור חזרה לפורטל (Alt+H)
- כפתור שיתוף (Web Share, ונפילה להעתקת קישור)
- כפתור התקנה למסך הבית (PWA) שמופיע רק כשרלוונטי
- פס התראה כשאין רשת
- יעדי לחיצה 44px, outline נגיש, כיבוד prefers-reduced-motion, הסתרה בהדפסה

כיבוי חלקי:
```html
<script>window.AILON_SHELL={home:false, share:false, install:false};</script>
<script src="../_shared/ailon-shell.js" defer></script>
```
