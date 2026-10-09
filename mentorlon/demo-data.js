/**
 * MentorLON / Mentor-IT — Demo Mode Engine & Sample Data
 * Static architecture demo provider (no backend dependency required)
 */

window.MentorlonDemo = (function() {
  const DEMO_COACH_USER = "demo";
  const DEMO_COACH_PASS = "demo1234";
  const DEMO_TRAINEE_USER = "demo_trainee";
  const DEMO_TRAINEE_PASS = "demo1234";

  // Pre-populated demo trainees data (4 Israeli Hebrew trainees)
  const initialTrainees = [
    {
      id: "demo_t1",
      name: "דנה כהן",
      username: "demo_trainee",
      status: "active", // פעיל
      has_login: true,
      phone: "050-8765432",
      progress: 85,
      insight: "💡 דנה השלימה את מפת החוזקות בהצלחה - מומלץ לתאם שיחת סיכום לקראת הגדרת היעדים.",
      tools_assigned: ["coaching_session", "wheel_of_life", "strengths_finder", "solution_engine", "emotions"],
      shared_tools: ["coaching_session", "wheel_of_life", "strengths_finder"],
      share_with_mentor: true,
      last_tool: "strengths_finder",
      last_seen: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      created_date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      usage_history: [
        { tool: "strengths_finder", timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), details: "מיפוי חוזקות ערוצי זרימה - דירוג 5 חוזקות מובילות" },
        { tool: "wheel_of_life", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), details: "עדכון ציונים במעגל החיים - שיפור בתחום הקריירה" },
        { tool: "coaching_session", timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), details: "שיחת אימון שבועית - הגדרת ברירת מחדל חדשה" }
      ]
    },
    {
      id: "demo_t2",
      name: "אביתר לוי",
      username: "eviatar_demo",
      status: "active", // פעיל
      has_login: true,
      phone: "052-3344556",
      progress: 55,
      insight: "💡 תקוע בשלב 3 במנוע הפתרונות (היפוך מחשבות) - דרוש חיזוק בנושא חשיבה חיובית.",
      tools_assigned: ["solution_engine", "equation_solver", "positive_thinking", "lecture_effortless"],
      shared_tools: ["solution_engine", "equation_solver"],
      share_with_mentor: true,
      last_tool: "solution_engine",
      last_seen: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      created_date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      usage_history: [
        { tool: "solution_engine", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), details: "הרצת מנוע הפתרונות - נעצר בשלב היפוך האמונה" },
        { tool: "equation_solver", timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(), details: "פתרון משוואת התקיעות בתקשורת זוגית" }
      ]
    },
    {
      id: "demo_t3",
      name: "שירה גולן",
      username: "shira_demo",
      status: "completed", // הושלם
      has_login: true,
      phone: "054-9988776",
      progress: 100,
      insight: "🏆 השלימה בהצטיינות את כל 6 הכלים בתוכנית! מוכנה לשלב התחזוקה העצמאית.",
      tools_assigned: ["coaching_session", "wheel_of_life", "strengths_finder", "emotions", "positive_thinking", "parenting"],
      shared_tools: ["coaching_session", "wheel_of_life", "strengths_finder", "emotions"],
      share_with_mentor: true,
      last_tool: "coaching_session",
      last_seen: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      created_date: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      usage_history: [
        { tool: "coaching_session", timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(), details: "שיחת סיכום תוכנית אימון מוצלחת" },
        { tool: "parenting", timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), details: "סיום מודל הורות מעצימה ומנהיגות משפחתית" },
        { tool: "positive_thinking", timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), details: "תרגול 5 היפוכי תודעה יומיים" }
      ]
    },
    {
      id: "demo_t4",
      name: "יוסי מזרחי",
      username: "yossi_demo",
      status: "paused", // מושהה
      has_login: true,
      phone: "053-1122334",
      progress: 30,
      insight: "⚠️ לא התחבר ב-5 הימים האחרונים - מומלץ לשלוח הודעת התעניינות ומשימה קצרה ב-WhatsApp.",
      tools_assigned: ["wheel_of_life", "strengths_finder"],
      shared_tools: ["wheel_of_life"],
      share_with_mentor: true,
      last_tool: "wheel_of_life",
      last_seen: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      created_date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
      usage_history: [
        { tool: "wheel_of_life", timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), details: "מילוי ראשוני של מעגל החיים" }
      ]
    }
  ];

  function getStoredTrainees() {
    try {
      const saved = localStorage.getItem("mentorlon_demo_trainees_list");
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return initialTrainees;
  }

  function saveStoredTrainees(list) {
    try {
      localStorage.setItem("mentorlon_demo_trainees_list", JSON.stringify(list));
    } catch(e) {}
  }

  return {
    isDemo: function() {
      return localStorage.getItem("mentorlon_demo_mode") === "true" ||
             localStorage.getItem("mentorlon_username") === DEMO_COACH_USER ||
             localStorage.getItem("mentorlon_trainee_username") === DEMO_TRAINEE_USER;
    },

    authenticateCoach: function(username, password) {
      const u = (username || "").trim().toLowerCase();
      const p = (password || "").trim();
      if (u === DEMO_COACH_USER && p === DEMO_COACH_PASS) {
        return this.loginDemoCoach();
      }
      return { success: false, error: "שם משתמש או סיסמה שגויים במצב דמו (השתמש ב-demo / demo1234)" };
    },

    loginDemoCoach: function() {
      localStorage.setItem("mentorlon_username", DEMO_COACH_USER);
      localStorage.setItem("mentorlon_token", "demo_coach_token_secret");
      localStorage.setItem("mentorlon_display_name", "ליאור סופר (דמו)");
      localStorage.setItem("mentorlon_demo_mode", "true");
      return {
        success: true,
        username: DEMO_COACH_USER,
        display_name: "ליאור סופר (דמו)",
        token: "demo_coach_token_secret",
        is_admin: false
      };
    },

    loginDemoTrainee: function() {
      localStorage.setItem("mentorlon_trainee_username", DEMO_TRAINEE_USER);
      localStorage.setItem("mentorlon_trainee_token", "demo_trainee_token_secret");
      localStorage.setItem("mentorlon_demo_mode", "true");
      return {
        success: true,
        username: DEMO_TRAINEE_USER,
        name: "דנה כהן",
        token: "demo_trainee_token_secret"
      };
    },

    getCoachDashboardData: function() {
      const trainees = getStoredTrainees();
      return {
        success: true,
        mentor: {
          username: DEMO_COACH_USER,
          display_name: "ליאור סופר (דמו)",
          business_name: "AILON Coaching (דמו)",
          is_admin: false
        },
        trainees: trainees
      };
    },

    getTraineeDashboardData: function() {
      const trainees = getStoredTrainees();
      const me = trainees.find(t => t.username === DEMO_TRAINEE_USER) || trainees[0];
      return {
        success: true,
        trainee: {
          name: me.name,
          mentor_display: "ליאור סופר (דמו)",
          tools_assigned: me.tools_assigned || [],
          shared_tools: me.shared_tools || me.tools_assigned || [],
          last_tool: me.last_tool || null,
          last_seen: me.last_seen || null
        }
      };
    },

    logUsage: function(toolKey, details) {
      const trainees = getStoredTrainees();
      const currentTraineeUser = localStorage.getItem("mentorlon_trainee_username") || DEMO_TRAINEE_USER;
      const idx = trainees.findIndex(t => t.username === currentTraineeUser);
      const nowIso = new Date().toISOString();
      const entry = { tool: toolKey, timestamp: nowIso, details: details || "נצפה במצב דמו" };

      if (idx >= 0) {
        trainees[idx].last_tool = toolKey;
        trainees[idx].last_seen = nowIso;
        if (!trainees[idx].usage_history) trainees[idx].usage_history = [];
        trainees[idx].usage_history.unshift(entry);
        trainees[idx].usage_history = trainees[idx].usage_history.slice(0, 50);
        saveStoredTrainees(trainees);
      }
      return { success: true, tool_key: toolKey, last_seen: nowIso, demo: true };
    },

    createDemoTrainee: function(name, phone, trainee_username, tools_assigned) {
      const trainees = getStoredTrainees();
      const newTrainee = {
        id: "demo_t_" + Date.now(),
        name: name,
        username: trainee_username,
        status: "active",
        has_login: true,
        phone: phone || "",
        progress: 10,
        insight: "💡 מתאמן חדש נוסף במערכת - מומלץ לתאם שיחת היכרות ראשונית",
        tools_assigned: tools_assigned || [],
        shared_tools: tools_assigned || [],
        share_with_mentor: true,
        last_tool: null,
        last_seen: null,
        created_date: new Date().toISOString(),
        usage_history: []
      };
      trainees.unshift(newTrainee);
      saveStoredTrainees(trainees);
      return { success: true, trainee: newTrainee };
    },

    updateTraineeTools: function(traineeId, newToolsList) {
      const trainees = getStoredTrainees();
      const idx = trainees.findIndex(t => t.id === traineeId);
      if (idx >= 0) {
        trainees[idx].tools_assigned = newToolsList;
        trainees[idx].shared_tools = newToolsList;
        saveStoredTrainees(trainees);
        return { success: true, trainee: trainees[idx] };
      }
      return { success: false, error: "Trainee not found" };
    },

    updateTraineeStatus: function(traineeId, newStatus) {
      const trainees = getStoredTrainees();
      const idx = trainees.findIndex(t => t.id === traineeId);
      if (idx >= 0) {
        trainees[idx].status = newStatus;
        saveStoredTrainees(trainees);
        return { success: true, trainee: trainees[idx] };
      }
      return { success: false, error: "Trainee not found" };
    },

    updateSharedTools: function(sharedTools) {
      const trainees = getStoredTrainees();
      const currentTraineeUser = localStorage.getItem("mentorlon_trainee_username") || DEMO_TRAINEE_USER;
      const idx = trainees.findIndex(t => t.username === currentTraineeUser);
      if (idx >= 0) {
        trainees[idx].shared_tools = sharedTools;
        trainees[idx].share_with_mentor = sharedTools.length > 0;
        saveStoredTrainees(trainees);
      }
      return { success: true, shared_tools: sharedTools };
    },

    renderWatermark: function() {
      if (!this.isDemo()) return;
      if (document.getElementById("mentorlonDemoWatermark")) return;

      const bar = document.createElement("div");
      bar.id = "mentorlonDemoWatermark";
      bar.setAttribute("role", "banner");
      bar.setAttribute("aria-label", "סרגל מצב דמו");
      bar.innerHTML = `
        <div class="demo-wm-content">
          <span class="demo-wm-badge">✨ מצב דמו</span>
          <span class="demo-wm-text">אתה צופה בדשבורד מאמן הדגמתי להצגה ללקוחות. הנתונים שמורים מקומית בדפדפן.</span>
          <button class="demo-wm-btn" onclick="MentorlonDemo.exitDemo()" aria-label="יציאה ממצב דמו">יציאה מדמו</button>
        </div>
      `;

      const style = document.createElement("style");
      style.textContent = `
        #mentorlonDemoWatermark {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 10000;
          background: linear-gradient(135deg, rgba(13,148,136,0.95), rgba(30,58,95,0.95));
          backdrop-filter: blur(10px);
          color: #ffffff;
          padding: 8px 16px;
          box-shadow: 0 4px 20px rgba(13,148,136,0.4);
          font-family: 'Heebo', 'Segoe UI', Arial, sans-serif;
          direction: rtl;
          font-size: 13px;
          border-bottom: 2px solid #5eead4;
        }
        .demo-wm-content {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .demo-wm-badge {
          background: #f59e0b;
          color: #0f172a;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 12px;
          letter-spacing: 0.3px;
        }
        .demo-wm-text {
          flex: 1;
          font-weight: 600;
          opacity: 0.95;
        }
        .demo-wm-btn {
          background: #ffffff;
          color: #0d9488;
          border: none;
          padding: 5px 14px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .demo-wm-btn:hover {
          transform: scale(1.04);
          background: #f0fdfa;
        }
        body {
          padding-top: 44px !important;
        }
        @media (max-width: 600px) {
          #mentorlonDemoWatermark { font-size: 11px; padding: 6px 12px; }
          .demo-wm-text { font-size: 11px; }
          body { padding-top: 52px !important; }
        }
      `;
      document.head.appendChild(style);
      document.body.prepend(bar);
    },

    exitDemo: function() {
      localStorage.removeItem("mentorlon_demo_mode");
      if (localStorage.getItem("mentorlon_username") === DEMO_COACH_USER) {
        localStorage.removeItem("mentorlon_username");
        localStorage.removeItem("mentorlon_token");
        localStorage.removeItem("mentorlon_display_name");
      }
      if (localStorage.getItem("mentorlon_trainee_username") === DEMO_TRAINEE_USER) {
        localStorage.removeItem("mentorlon_trainee_username");
        localStorage.removeItem("mentorlon_trainee_token");
      }
      window.location.reload();
    }
  };
})();

// Auto-initialize watermark if page is loaded in demo mode
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function() {
    if (window.MentorlonDemo && window.MentorlonDemo.isDemo()) {
      window.MentorlonDemo.renderWatermark();
    }
  });
} else {
  if (window.MentorlonDemo && window.MentorlonDemo.isDemo()) {
    window.MentorlonDemo.renderWatermark();
  }
}
