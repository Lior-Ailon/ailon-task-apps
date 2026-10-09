# MentorLON / Mentor-IT — API Extensions Specification

## Overview
This document specifies the backend API extensions added to `mentorlonApi.ts` to support **Trainee Activity Tracking** and **Mentor Dashboard Monitoring** in MentorLON (מנטורית).

---

## 1. Trainee Activity Logging (`logUsage` / `log_usage`)

### Description
Logs a "tool opened / used" event for a logged-in trainee. Called automatically whenever a trainee accesses any of the 10 MentorLON tools.

### Endpoint
`POST https://base44.app/api/apps/69f63b4536d7a2c6688403df/functions/mentorlonApi`

### Request Payload
```json
{
  "action": "logUsage",
  "username": "trainee_username",
  "token": "trainee_session_token",
  "tool_key": "wheel_of_life",
  "details": "Opened tool view"
}
```
*Note: The API accepts both `"logUsage"` and `"log_usage"` as action names for backwards compatibility.*

### Response (200 OK)
```json
{
  "success": true,
  "tool_key": "wheel_of_life",
  "last_seen": "2026-09-13T17:45:00.000Z"
}
```

### Response Error (401 Unauthorized)
```json
{
  "error": "לא מחובר, יש להתחבר מחדש"
}
```

### Entity Side Effects
On `CapsuleTrainee` entity:
- `last_tool`: Updated to `tool_key` (e.g. `"wheel_of_life"`).
- `last_seen`: Updated to current ISO timestamp.
- `usage_history`: Appends object `{ tool: tool_key, timestamp: ISO_STRING, details?: string }` (capped at the last 50 entries to prevent record bloating).

---

## 2. Updated Mentor Dashboard Endpoint (`dashboard`)

### Description
Extends the existing `dashboard` action to return trainee usage metrics (`last_tool`, `last_seen`, `usage_history`) alongside assigned/shared tools.

### Request Payload
```json
{
  "action": "dashboard",
  "username": "mentor_username",
  "token": "mentor_session_token"
}
```

### Response Payload (200 OK)
```json
{
  "success": true,
  "mentor": {
    "username": "lior_sofer",
    "display_name": "ליאור סופר",
    "business_name": "AILON Coaching",
    "is_admin": false
  },
  "trainees": [
    {
      "id": "trainee_123",
      "name": "ישראל ישראלי",
      "status": "active",
      "has_login": true,
      "username": "israel_i",
      "tools_assigned": ["coaching_session", "wheel_of_life", "strengths_finder"],
      "shared_tools": ["coaching_session", "wheel_of_life"],
      "phone": "050-1234567",
      "created_date": "2026-08-01T10:00:00.000Z",
      "last_tool": "wheel_of_life",
      "last_seen": "2026-09-13T16:30:00.000Z",
      "usage_history": [
        { "tool": "wheel_of_life", "timestamp": "2026-09-13T16:30:00.000Z" },
        { "tool": "coaching_session", "timestamp": "2026-09-12T11:15:00.000Z" }
      ]
    }
  ]
}
```

---

## 3. Detailed Trainee Activity Log (`get_trainee_activity`)

### Description
Allows a mentor to fetch full activity logs for a specific trainee.

### Request Payload
```json
{
  "action": "get_trainee_activity",
  "username": "mentor_username",
  "token": "mentor_session_token",
  "trainee_username": "israel_i"
}
```

### Response Payload
```json
{
  "success": true,
  "trainee": "israel_i",
  "last_tool": "wheel_of_life",
  "last_seen": "2026-09-13T16:30:00.000Z",
  "usage_history": [
    { "tool": "wheel_of_life", "timestamp": "2026-09-13T16:30:00.000Z" }
  ]
}
```

---

## 4. Frontend Graceful Degradation Strategy

1. **Offline & Pre-Deployment Fallback**: If the backend action `logUsage` returns 400/404 (because the new endpoint code is pending deployment by the owner), the frontend JS (`tracker.js`):
   - Catches the HTTP status gracefully without raising user-facing errors.
   - Saves usage data in `localStorage` under `mentorlon_local_usage`.
   - Continues normal operation.
2. **Demo Mode**: If running in Demo Mode (`mentorlon_demo_mode = true`), activity is routed directly to `demo-data.js` and stored in `localStorage` (`mentorlon_demo_usage`).

---

## 5. Deployment Instructions for Platform Owner
1. Copy the updated code from `/app/conversations/69f63b47777455158d7f8b84/functions/mentorlonApi.ts` (or `/app/functions/mentorlonApi.ts`).
2. Deploy the backend function `mentorlonApi` in Base44 Console / Backend Functions.
3. Verify that the function endpoint handles `logUsage` and returns extended `dashboard` data.
