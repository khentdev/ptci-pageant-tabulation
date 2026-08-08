**Last synced with codebase:** Aug 8, 2026
Task checklist for build progress. Each module links to its flow in [[Wireframe & Flows]]. Product rules in [[System Documentation]].

**How to use this tracker**

- Check off tasks when **backend + frontend + manual smoke test** are done
- Sub-tasks are part of the parent — don't track endpoints here (those live in code)
- Before building a task, read the matching section in Wireframe & Flows

---

## Auth

**Wireframe:** Auth §1

### Backend

- [x] Seed admin account into database (single admin, username + hashed password — done once before event)
- [x] Login (username + password, role check, JWT set in HTTP-only cookie)
- [x] Session check on app load (`GET /session/me` — returns role + user info)
- [x] Logout (clear JWT cookie)

### Frontend

- [ ] Login page (shared for admin and judge; role-based redirect on success)
- [ ] Global session middleware (validate session on every protected route load; redirect to login if invalid/expired)
- [ ] Logout button + redirect to login

---

## Public Candidates Page

**Wireframe:** Public — Candidates Page §1

### Backend

- N/A — page is fully static, no backend involvement

### Frontend

- [ ] Candidates page — responsive grid layout, vertical scroll
- [ ] Hardcode contestant data (number, name, gender, team name, team color) directly in frontend
- [ ] Gender filter (All · Male · Female) — re-renders grid on change
- [ ] Candidate card — number, full name, team name, team color, photo
- [ ] Image loaded from `public/candidates/{candidate_number}.jpg`
- [ ] Placeholder image when photo file not found (handled client-side)

---

## Admin — Setup: Rounds

**Wireframe:** Admin Setup Flows §2

### Backend

- [ ] Create round (name, phase order, contestant limit)
- [ ] List rounds (ordered by phase order)
- [ ] Edit round name (always allowed)
- [ ] Edit contestant limit (guard: reject if round already has contestants in `round_contestants`)
- [ ] Delete round (guard: reject if round has categories or any score data)
- [ ] Phase order unique constraint enforced

### Frontend

- [ ] Rounds list page (ordered by phase order, shows name + limit)
- [ ] Create round form (name, phase order, contestant limit — blank = unlimited)
- [ ] Edit round inline or modal (name always editable; limit editable only before advancement; phase order field hidden/disabled)
- [ ] Delete round with confirmation modal (disabled if has categories or scores)

---

## Admin — Setup: Categories

**Wireframe:** Admin Setup Flows §3

### Backend

- [ ] Create category (name, round — round_id selected from dropdown)
- [ ] Edit category name (guard: reject if scores exist for this category)
- [ ] List categories grouped by round
- [ ] Add scoring field to category (field name, max_value)
- [ ] Delete scoring field (guard: reject if any scores exist for this field)
- [ ] Delete category (guard: reject if any scores exist for this category)
- [ ] Validate field max_value sum === 100 on category activate / field add

### Frontend

- [ ] Categories list page (grouped by round, shows field count + sum status)
- [ ] Create category form — round dropdown fetches all rounds live on open
- [ ] Edit category name inline or modal (disabled if scores exist)
- [ ] Category field editor — add fields (name + max score), running total shown, error if sum ≠ 100
- [ ] Fields auto-sorted by max_value descending in editor and on judge screen
- [ ] Delete field with confirmation (disabled if scores exist)
- [ ] Delete category with confirmation (disabled if scores exist)
- [ ] Category readiness indicator (✓ if sum = 100, ⚠ if not)

---

## Admin — Setup: Contestants

**Wireframe:** Admin Setup Flows §4

### Backend

- [ ] Add contestant (candidate number, name, gender, team name, team color)
- [ ] List contestants (filter by gender)
- [ ] Edit contestant (guard: reject if any scores exist for this contestant)
- [ ] Delete contestant (guard: reject if any scores exist)
- [ ] Candidate number unique constraint enforced

### Frontend

- [ ] Contestants list page (gender filter: All · Male · Female)
- [ ] Add contestant form
- [ ] Edit contestant form (disabled if scores exist)
- [ ] Delete contestant with confirmation modal (disabled if scores exist)

---

## Admin — Setup: Judges

**Wireframe:** Admin Setup Flows §5

### Backend

- [ ] Create judge account (name, username, password — role always set to `judge`)
- [ ] List judges
- [ ] Reset judge password

### Frontend

- [ ] Judges list page
- [ ] Create judge form (name, username, password)
- [ ] Reset judge password modal

---

## Admin — Live Event: Round Results & Advancement

**Wireframe:** Admin Live Event Flows §6–11

### Backend

- [ ] Round results API — compute rankings per round on the fly (avg per category per contestant across all judges + overall score)
- [ ] Judge submission status API — per round: which judges have fully submitted all contestants across all categories
- [ ] Tie detection logic — detect if advancement cutoff is straddled by tied contestants
- [ ] Advancement API — insert selected contestants into `round_contestants` for next round; validate count matches next round's `contestant_limit`
- [ ] Declare winners API — lock final round results (irreversible)

### Frontend

- [ ] Admin Live Event sidebar — one navigation item per round, ordered by phase order
- [ ] Round Results page (shared component, driven by round ID)
  - [ ] Ranking table: contestant rows × (one column per category avg + overall score column + rank)
  - [ ] Judge submission status display (per judge per category: ✓ / ✗)
  - [ ] Advance button — visible only when: round has contestants + next round has no contestants + all judges fully submitted
  - [ ] Advance button label dynamically reads next round name (`Advance to [Next Round Name]`)
- [ ] No-tie advancement flow — button enabled immediately, one click advances all top N
- [ ] Tie resolution UI (same page, replaces/extends ranking table):
  - [ ] "Included" section — auto-advanced contestants (above cutoff)
  - [ ] "Tie" section — tied contestants with checkboxes
  - [ ] Selection counter ("Selected: X of Y required")
  - [ ] Disable extra checkboxes once required count is reached
  - [ ] Advance button disabled until selection count matches required
  - [ ] One click on enabled button advances all (auto + selected tied)
- [ ] Final round view — "Declare Winners" button instead of Advance
  - [ ] Declare Winners confirmation modal (warn: irreversible)
  - [ ] Winners display after declaration (🥇 🥈 🥉 with names and scores)
- [ ] Past rounds remain visible and browsable after advancement (read-only)
- [ ] Polling every 10–30s to refresh judge submission status

---

## Judge — Scoring Interface

**Wireframe:** Judge Flows §12–14

### Backend

- [ ] Rounds + categories list API — returns all rounds with their categories (for sidebar)
- [ ] Contestants by round API — returns contestants in `round_contestants` for a given round (or all contestants for phase_order = 1)
- [ ] Scoring fields by category API — returns fields sorted by max_value descending
- [ ] Existing scores API — returns this judge's submitted scores for a given category (to determine submitted state per contestant)
- [ ] Submit score API — per contestant per category; validate all fields present, values within 0–max_value; reject if score already exists for this judge + contestant + category

### Frontend

- [ ] Judge shell layout — sidebar + content area
- [ ] Sidebar rounds list — all rounds, expandable, fetches categories on expand
- [ ] Rounds without contestants show "No contestants yet" when expanded
- [ ] Category scoring grid — contestants as rows, fields as columns with max label
- [ ] Per-contestant Submit button (enabled when all fields filled)
- [ ] Submitted state — inputs become read-only with submitted values retained; button shows "Submitted ✓"
- [ ] Inline field validation — value cannot exceed max_value; all fields required
- [ ] Sidebar polling every 10s — detect newly advanced rounds and update sidebar

---

## Global / Infrastructure

### Backend

- [ ] JWT auth middleware — validate token on all protected routes
- [ ] Role guard middleware — `adminOnly` and `judgeOnly` guards
- [ ] Global error handler — consistent error response shape
- [ ] Input validation — field-level validation on all mutation endpoints

### Frontend

- [ ] Admin route protection — redirect to login if not admin
- [ ] Judge route protection — redirect to login if not judge
- [ ] Public route — candidates page accessible without auth
- [ ] Toast notifications — success and error feedback
- [ ] Loading states on all data-fetching pages
- [ ] Error states with retry on all data-fetching pages
- [ ] Empty states on all list pages

---

## Known Issues / Polish

*(Add issues here as they are discovered during testing)*

- [ ] Full smoke test: admin setup → judges score → advance → declare winners

---

**Doc map:** [[System Documentation]] (what & why) · [[Wireframe & Flows]] (user journeys) · **This page** (what's left to build)
