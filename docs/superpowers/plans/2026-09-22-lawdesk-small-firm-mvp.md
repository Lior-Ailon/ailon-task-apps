# LawDesk Small-Firm MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** להפוך את דמו LawDesk למערכת PWA מאובטחת ומקורית למשרדי עורכי דין של 1–5 משתמשים, עם Backend מרכזי, תיקי לקוח, מסמכים, משימות, זמן, תבניות וסביבת פיילוט לשקד.

**Architecture:** חזית סטטית מודולרית ב-GitHub Pages מתקשרת רק עם שתי פונקציות Base44: `lawdeskApi` לפעולות JSON ו-`lawdeskFileApi` להעלאה/הורדה. כל בקשה עסקית נדרשת ל-session token שנבדק בשרת מול `LawUser`; כל ישות משויכת ל-`firm_id`. קבצים נשמרים דרך אחסון Base44, ורשומת `LawDocument` נשמרת רק אחרי הרשאה ושיוך לתיק.

**Tech Stack:** HTML/CSS/JavaScript ES modules, PWA Manifest + Service Worker, Base44 SDK 0.8.31, Deno backend functions, Web Crypto PBKDF2-SHA256, Base44 Entities, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-22-lawdesk-small-firm-mvp-design.md`

## Global Constraints

- מוצר מקורי, לא העתק אחד-לאחד של עודכנית.
- קהל יעד: 1–5 משתמשים.
- AILON Navy `#1e3a5f`, Teal `#0d9488`, Green `#14b8a6`, לוגו רשמי ופטיש שופט SVG.
- עברית RTL וחוק היק: פעולה ראשית אחת בכל מסך.
- GitHub Pages הוא מארח החזית הראשי.
- Base44 הוא מקור האמת; `localStorage` רשאי לשמור session token בלבד, לא נתונים עסקיים.
- כל הרשומות כוללות `firm_id`; כל שאילתה מסוננת בשרת לפי משרד.
- סיסמאות נשמרות רק כ-PBKDF2-SHA256 עם salt ו-100,000 איטרציות.
- הקבצים אינם נכללים ב-Service Worker cache.
- Cache busting באמצעות גרסת build בכל HTML, manifest ו-Service Worker.
- אין נתוני לקוחות אמיתיים בפיילוט; כל התיקים מסומנים כדמו.
- אין התחברות אוטומטית לנט המשפט, הנהלת חשבונות מלאה או ייעוץ משפטי אוטומטי ב-MVP.

---

### Task 1: Schema contract and pure validation tests

**Files:**
- Create: `law-office/js/core.js`
- Create: `law-office/tests/core.test.mjs`
- Create: `law-office/schema-contract.json`
- Modify: `law-office/package.json`

**Interfaces:**
- Produces `normalizeCase(record)`, `validateLogin(username,password)`, `validateCaseInput(data)`, `groupDocumentsBySource(docs)`, `computeDashboard(cases,tasks)`, `formatMinutes(minutes)`.
- `schema-contract.json` defines exact frontend/entity field names for `LawFirm`, `LawUser`, `LawClient`, `LawCase`, `LawTask`, `LawDocument`, `LawTemplate`, `LawTimeEntry`, `LawActivityLog`.

- [ ] Write tests that assert username/password required, case title/client required, document groups are `net_hamishpat`, `investigation`, `office_client`, overdue task counts exclude completed tasks, and 90 minutes formats as `1:30`.
- [ ] Run `node --test law-office/tests/core.test.mjs` and verify failure because `core.js` is absent.
- [ ] Implement the six exported functions without DOM access.
- [ ] Run the test and verify all assertions pass.
- [ ] Commit only the four task files with message `test: define LawDesk domain contract`.

### Task 2: Base44 entity schemas

**Files:**
- Create: `law-office/entities/LawFirm.json`
- Create: `law-office/entities/LawUser.json`
- Create: `law-office/entities/LawClient.json`
- Create: `law-office/entities/LawCase.json`
- Create: `law-office/entities/LawTask.json`
- Create: `law-office/entities/LawDocument.json`
- Create: `law-office/entities/LawTemplate.json`
- Create: `law-office/entities/LawTimeEntry.json`
- Create: `law-office/entities/LawActivityLog.json`

**Interfaces:**
- All business records consume `firm_id:string` and expose `id`, `created_date`, `updated_date` from Base44.
- `LawUser.role` enum: `admin`, `lawyer`, `secretary`; `must_change_password:boolean`.
- `LawDocument.source_type` enum: `net_hamishpat`, `investigation`, `office_client`.

- [ ] Create JSON schemas matching `schema-contract.json`, with enums and required fields for tenant isolation.
- [ ] Validate every file using `python3 -m json.tool`.
- [ ] Create each schema with `manage_entity_schemas`; if a schema exists, update it without deleting records.
- [ ] List schemas and verify all nine names and fields.
- [ ] Commit with message `feat: add LawDesk entity schemas`.

### Task 3: Authenticated LawDesk API

**Files:**
- Create: `../functions/lawdeskApi.ts`
- Create: `law-office/tests/api-contract.test.mjs`

**Interfaces:**
- Request body: `{action:string, session_token?:string, data?:object, id?:string, filters?:object}`.
- Public actions: `login`, `bootstrapPilot` (guarded by one-time `setup_key` only during deployment test).
- Authenticated actions: `me`, `dashboard`, `listCases`, `createCase`, `updateCase`, `listClients`, `createClient`, `listTasks`, `createTask`, `completeTask`, `listDocuments`, `createDocument`, `listTemplates`, `createFromTemplate`, `listTimeEntries`, `createTimeEntry`, `reports`, `changePassword`, `logout`.
- Success: `{success:true,...}`. Failure: `{success:false,error:string}` with 4xx/5xx status.

- [ ] Write source-contract tests that read `lawdeskApi.ts` and assert PBKDF2/100000, action allowlist, `firm_id` filtering, session checks, and no plaintext password writes.
- [ ] Run tests and verify failure before the function exists.
- [ ] Implement helpers `json`, `randomHex`, `hashPassword`, `clean`, `requireUser`, `audit`, `filterByFirm`, and the listed actions.
- [ ] For every create/update, derive `firm_id` and actor identity from the authenticated user; ignore client-supplied tenant/user ownership.
- [ ] For login, normalize username to lowercase, compare PBKDF2 hash, rotate `session_token`, return safe user fields and `must_change_password`.
- [ ] Run source-contract tests.
- [ ] Deploy with `deploy_backend_function`, then test invalid login and unauthorized `listCases` return 401 without leaking records.
- [ ] Commit with message `feat: add tenant-safe LawDesk API`.

### Task 4: Pilot seed for Shaked

**Files:**
- Create: `law-office/pilot/shaked-fixtures.json`
- Modify: `../functions/lawdeskApi.ts`
- Modify: `law-office/tests/api-contract.test.mjs`

**Interfaces:**
- Internal setup payload creates one firm, username `shaked`, display name `שקד`, role `lawyer`, temporary password `123456`, `must_change_password:true`.
- Fixtures contain 4 fictional cases, at least 4 clients, 7 tasks, 9 document metadata rows, 5 templates and 6 time entries.

- [ ] Write fixture validation tests asserting no real names from the workspace, every title contains `דמו`, and every referenced case/client key resolves.
- [ ] Run tests and verify failure before fixtures exist.
- [ ] Create fictional fixtures for civil, family, labor and real-estate matters.
- [ ] Add an idempotent setup action that looks up username/firm before creating and never duplicates fixtures.
- [ ] Deploy updated function and run setup once.
- [ ] Test login as `shaked` / `123456`, verify `must_change_password:true`, then verify dashboard contains four demo cases.
- [ ] Do not paste or persist the returned session token in files or chat.
- [ ] Commit with message `feat: seed Shaked LawDesk pilot`.

### Task 5: Frontend application shell and authentication

**Files:**
- Replace: `law-office/index.html`
- Create: `law-office/css/app.css`
- Create: `law-office/js/api.js`
- Create: `law-office/js/app.js`
- Create: `law-office/js/views.js`
- Create: `law-office/assets/gavel.svg`
- Create: `law-office/tests/static.test.mjs`

**Interfaces:**
- `api.js`: `login`, `logout`, `me`, `call(action,payload)`, `getSession`, `setSession`, `clearSession`.
- `views.js`: pure HTML renderers receiving escaped view models.
- `app.js`: state/router/event bindings only; no hard-coded business data.

- [ ] Write static tests for RTL/lang, manifest, no embedded demo DB, no business data writes to localStorage, login form, five nav areas, AILON colors and escaped render functions.
- [ ] Run tests against current app and verify expected failures.
- [ ] Build login screen, forced-password-change banner, responsive header, five-area bottom/desktop navigation and loading/error states.
- [ ] Use `sessionStorage` for token by default, with an explicit “זכור אותי במכשיר פרטי” option for localStorage token only.
- [ ] Add `aria` labels, visible focus states and minimum 44px action targets.
- [ ] Run static and core tests.
- [ ] Commit with message `feat: build LawDesk authenticated shell`.

### Task 6: Cases, clients, tasks and agenda UI

**Files:**
- Create: `law-office/js/features/cases.js`
- Create: `law-office/js/features/tasks.js`
- Modify: `law-office/js/app.js`
- Modify: `law-office/js/views.js`
- Modify: `law-office/css/app.css`
- Modify: `law-office/tests/static.test.mjs`

**Interfaces:**
- Cases module loads/creates/updates cases and clients through `api.call`.
- Tasks module loads/creates/completes tasks and emits `lawdesk:data-changed`.
- Case detail tabs: overview, timeline, tasks, documents, time.

- [ ] Add tests asserting one primary CTA per view, case search, `next_action`, task completion, overdue state and mobile dialogs.
- [ ] Run tests and verify failures.
- [ ] Implement Today dashboard, case list/search, create case/client flow, case detail, status/next action editing, task/meeting/deadline creation and agenda list.
- [ ] Escape every user-supplied string before insertion.
- [ ] Run all frontend tests and manual keyboard navigation smoke test.
- [ ] Commit with message `feat: add LawDesk cases and agenda`.

### Task 7: Documents, templates and centralized viewer

**Files:**
- Create: `../functions/lawdeskFileApi.ts`
- Create: `law-office/js/features/documents.js`
- Create: `law-office/js/features/templates.js`
- Modify: `law-office/js/app.js`
- Modify: `law-office/js/views.js`
- Modify: `law-office/css/app.css`
- Modify: `law-office/tests/static.test.mjs`

**Interfaces:**
- File API accepts multipart `file`, `session_token`, `case_id`, `source_type`, `title` with 10MB maximum and MIME allowlist PDF/image/DOCX.
- Upload returns `{success:true,document}` only after authorization and entity creation.
- Viewer lists documents by explicit source group and opens only the selected signed/authorized URL.

- [ ] Write source tests for size limit, MIME allowlist, session/firm/case authorization and absence from Service Worker cache.
- [ ] Implement and deploy `lawdeskFileApi` using Base44 storage support available in the SDK; if private signed storage is unavailable, block real uploads and expose metadata-only demo mode rather than falling back to public URLs.
- [ ] Implement three document groups, upload progress, centralized preview/download, version metadata and template list.
- [ ] Implement “create from template” as a populated editable draft requiring explicit user confirmation; do not auto-file or send.
- [ ] Run tests and upload a harmless sample PDF in the pilot only if storage is private.
- [ ] Commit with message `feat: add LawDesk documents and templates`.

### Task 8: Time tracking and reports

**Files:**
- Create: `law-office/js/features/time.js`
- Create: `law-office/js/features/reports.js`
- Modify: `law-office/js/app.js`
- Modify: `law-office/js/views.js`
- Modify: `law-office/css/app.css`
- Modify: `law-office/tests/core.test.mjs`

**Interfaces:**
- Time module creates server-side `LawTimeEntry` records from manual form or stopped timer.
- Reports render overdue tasks, open cases and minutes by case/client/user.

- [ ] Add pure tests for timer rounding, totals and empty reports.
- [ ] Implement single active in-browser timer whose stopped value is immediately saved to server; unsaved timers are labeled as local and do not count in reports.
- [ ] Implement manual time entry and three basic reports with CSV download generated client-side from current authorized response.
- [ ] Run all tests.
- [ ] Commit with message `feat: add LawDesk time and reports`.

### Task 9: PWA, security and release verification

**Files:**
- Modify: `law-office/manifest.webmanifest`
- Modify: `law-office/sw.js`
- Modify: `law-office/index.html`
- Create: `law-office/offline.html`
- Create: `law-office/SECURITY.md`
- Create: `law-office/tests/pwa.test.mjs`

**Interfaces:**
- Manifest includes `id`, `start_url`, `scope`, standalone display, Hebrew/RTL, AILON icons and shortcuts.
- Service Worker caches only versioned static shell files and offline page; API, function endpoints and uploaded documents are network-only.

- [ ] Write PWA tests asserting manifest fields, unique cache version, no API/file caching and offline fallback.
- [ ] Implement install button with `beforeinstallprompt` and iOS Safari instructions.
- [ ] Add cache-busting build id consistently to HTML imports, manifest and SW registration.
- [ ] Document pilot security limits, temporary password rule, data deletion path and incident contact.
- [ ] Run `node --test law-office/tests/*.test.mjs`.
- [ ] Run a local HTTPS/static smoke test or browser test for login, navigation, case, task, time and installability.
- [ ] Verify no secrets/session tokens/plaintext passwords in Git diff using grep.
- [ ] Commit with message `feat: release LawDesk pilot PWA`.

### Task 10: Deploy, GitHub Pages and pilot handoff

**Files:**
- Modify: `law-office/README.md`
- Modify: `law-flyer/index.html` only if feature claims need alignment with implemented MVP.

**Interfaces:**
- Live URL remains `https://lior-ailon.github.io/ailon-task-apps/law-office/`.
- Pilot credentials are communicated to the owner only; the app itself never displays the password.

- [ ] Pull/rebase safely without overwriting unrelated dirty files; stage only LawDesk/plan/function source files.
- [ ] Push committed changes to `main`.
- [ ] Wait for GitHub Pages, then verify live cache-busted assets and manifest return 200.
- [ ] Test login, four demo cases, document grouping, task completion, time entry, reports and logout on the live site.
- [ ] Confirm the old localStorage demo dataset is absent.
- [ ] Record known limitations: no automatic Net HaMishpat, no accounting, no real client uploads until private storage verification.
- [ ] Deliver the live link, username and temporary password to Lior with the mandatory password-change warning.
