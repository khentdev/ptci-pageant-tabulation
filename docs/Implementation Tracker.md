**Last synced with codebase:** Aug 17, 2026
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

- [x] Login page (shared for admin and judge; role-based redirect on success — admin → Preliminary round results `/admin/live/results/:roundId`)
- [x] Global session middleware (validate session on every protected route load; redirect to login if invalid/expired)
- [x] Logout button + redirect to login

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

- [x] Create round (name, phase order, contestant limit)
- [x] List rounds (ordered by phase order)
- [x] Edit round name (always allowed)
- [x] Edit contestant limit (guard: reject if round already has contestants in `round_contestants`)
- [x] Delete round (guard: reject if round has categories or any score data; allowed if round is empty)
- [x] Phase order unique constraint enforced

### Frontend

- [x] Rounds list page (ordered by phase order, shows name + limit + Edit + Delete actions per row)
- [x] Create round form (name, phase order, contestant limit — blank = unlimited)
- [x] Edit round form — fetch lock state on open; name always editable; phase order read-only; limit editable or read-only based on `isLimitLocked`
- [x] Delete round with confirmation modal — button always visible; backend rejects with error toast if round has categories or scores

---

## Admin — Setup: Categories

**Wireframe:** Admin Setup Flows §3

### Backend

- [x] Create category (name, round — round_id selected from dropdown)
- [ ] Edit category name (guard: reject if scores exist for this category)
- [ ] List categories grouped by round
- [ ] Add scoring field to category (field name, max_value)
- [ ] Delete scoring field (guard: reject if any scores exist for this field)
- [ ] Delete category (guard: reject if any scores exist for this category)
- [ ] Validate field max_value sum === 100 on category activate / field add

### Frontend

- [ ] Categories list page (grouped by round, shows field count + sum status + Edit + Fields + Delete actions per row)
- [ ] Create category form — round dropdown fetches all rounds live on open
- [ ] Edit category form — fetch lock state on open (`isLocked` = scores exist); name editable or read-only based on lock state
- [ ] Category field editor — add fields (name + max score), running total shown, error if sum ≠ 100
- [ ] Fields auto-sorted by max_value descending in editor and on judge screen
- [ ] Delete field with confirmation — disabled if scores exist for that field
- [ ] Delete category with confirmation modal — button always visible; backend rejects with error toast if scores exist for that category
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
- [ ] Edit contestant form — fetch lock state on open; fields read-only when scores exist
- [ ] Delete contestant with confirmation modal — button always visible; backend rejects with error toast if scores exist

---

## Admin — Setup: Judges

**Wireframe:** Admin Setup Flows §5

### Backend

- [x] Create judge account (name, username, password — role always set to `judge`)
- [x] List judges
- [ ] Edit judge name and username (always allowed — no lock condition)
- [ ] Reset judge password
- [ ] Delete judge (guard: reject if judge has submitted any scores)

### Frontend

- [ ] Judges list page (Edit + Reset Password + Delete actions per row)
- [ ] Create judge form (name, username, password)
- [ ] Edit judge form (name, username — always editable)
- [ ] Reset judge password modal
- [ ] Delete judge confirmation modal — backend rejects with error toast if judge has scores

---

## Admin — Live Event: Round Results & Advancement

**Wireframe:** Admin Live Event Flows §6–11

### Backend

- [ ] Round results API — one fetch per round page (mount / manual refresh): rankings, `allJudgesSubmitted`, `isCompleted`, `canAdvance`, `canAdvanceReason`, per-judge per-category submission flags, `nextRound` (with `categoryCount`), and advancement payload (`hasTie`, `requiredSelections`, `included[]`, `tied[]` with contestant id + name + overall score)
- [ ] Tie detection on that same results fetch — not on Advance click; detect only if cutoff is straddled by tied contestants; compare `overallScore` rounded to 2 decimal places
- [ ] Advancement API — no body when no tie (backend picks top N); with tie, `{ selectedContestantIds }` merged with auto-included; validate `canAdvance` and count matches next round's `contestant_limit`
- [ ] Declare winners API — lock final round results (irreversible); same cutoff tie rules as Advance for final ranking; results fetch returns `canDeclareWinners` and `winnersDeclaredAt`

### Frontend

- [ ] Admin Live Event sidebar — one navigation item per round, ordered by phase order
- [ ] Round Results page (shared component, driven by round ID)
  - [ ] Ranking table: contestant rows × (one column per category avg + overall score column + rank)
  - [ ] Judge submission status display (per judge per category: ✓ / ✗)
  - [ ] Advance button — hidden when `isCompleted` is `true`; enabled when `canAdvance` is `true`; disabled helper from `canAdvanceReason` otherwise
  - [ ] Advance button label dynamically reads next round name (`Advance to [Next Round Name]`)
- [ ] No-tie advancement flow — `canAdvance` true and no tie → one click, empty body, backend advances top N
- [ ] Tie resolution UI (below full rankings table when `advancement.hasTie`):
  - [ ] Full rankings table unchanged (all category columns, same as no-tie state)
  - [ ] Tie-resolution panel rendered under table from `advancement.included` / `advancement.tied`
  - [ ] Selection counter ("Selected: X of Y required")
  - [ ] Disable extra checkboxes once required count is reached
  - [ ] Advance button disabled until selection count matches required
  - [ ] One click on enabled button advances all (auto + selected tied via `selectedContestantIds`)
- [ ] Final round view — "Declare Winners" button instead of Advance
  - [ ] Declare Winners confirmation modal (warn: irreversible)
  - [ ] Winners display after declaration (🥇 🥈 🥉 with names and scores)
- [ ] Past rounds remain visible and browsable after advancement (`isCompleted` — read-only)
- [ ] Refetch on page mount and manual browser refresh only — no auto-polling

---

## Judge — Scoring Interface

**Wireframe:** Judge Flows §12–14

### Backend

- [ ] Rounds + categories list API — returns all rounds with their categories (for sidebar)
- [ ] Contestants by round API — returns contestants in `round_contestants` for a given round (or all contestants for phase_order = 1)
- [ ] Scoring fields by category API — returns fields sorted by max_value descending
- [ ] Existing scores API — returns this judge's submitted scores for a given category (to determine submitted state: any score exists for this judge + category = fully submitted)
- [ ] Batch submit scores API — receives array of all contestant scores for a category; validates all fields present and within 0–max_value; rejects if already submitted for this judge + category; inserts all in a single transaction

### Frontend

- [ ] Judge shell layout — sidebar + content area
- [ ] Route: `/judge/scoring/:categoryId?` — categoryId optional; no categoryId redirects to first available category
- [ ] On page load: read categoryId from URL → fetch and display that category automatically (survives refresh)
- [ ] Sidebar rounds list — all rounds, expandable, fetches categories on expand; refetch on page refresh only (no polling)
- [ ] Active category highlighted in sidebar based on current URL categoryId
- [ ] Rounds without contestants show "No contestants yet" when expanded
- [ ] Category scoring grid — contestants as rows, fields as columns with max label
- [ ] All inputs freely editable before Submit All — no per-contestant locking
- [ ] Submit All button (enabled only when all fields for all contestants are filled)
- [ ] Submitted state per category — if scores exist for this judge + category → all inputs read-only, submitted values retained, Submit All hidden, ✓ Submitted shown in header
- [ ] Inline field validation — value cannot exceed max_value; all fields required before Submit All

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

_(Add issues here as they are discovered during testing)_

- [ ] Full smoke test: admin setup → judges score → advance → declare winners

---

**Doc map:** [[System Documentation]] (what & why) · [[Wireframe & Flows]] (user journeys) · **This page** (what's left to build)
