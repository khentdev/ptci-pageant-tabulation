**Last synced with codebase:** Aug 28, 2026
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
- [x] Edit category name (guard: reject if scores exist for this category)
- [x] List categories grouped by round
- [x] Get fields by category API — returns existing fields for a category (used to pre-fill the field editor on open)
- [X] Add scoring fields to category — batch endpoint: receives array of fields, validates total max_value === 100, inserts all in one transaction; replaces existing fields if category already has them
- [x] Delete category (guard: reject if any scores exist for this category)

### Frontend

- [x] Categories list page (grouped by round, shows field count + sum status + Edit + Fields + Delete actions per row)
- [x] Create category form — round dropdown fetches all rounds live on open
- [x] Edit category form — fetch lock state on open (`isLocked` = scores exist); name editable or read-only based on lock state
- [x] Category field editor — batch form with dynamic rows ([ + Add Row ] / [ Remove ]); live running total; Save Fields disabled until total = 100
- [x] Fields auto-sorted by max_value descending on judge scoring screen
- [x] Delete category with confirmation modal — button always visible; backend rejects with error toast if scores exist for that category
- [x] Category status indicator (✓ with field count if fields exist, "No fields" if empty)

---

## Admin — Setup: Contestants

**Wireframe:** Admin Setup Flows §4

### Backend

- [X] Add contestant (candidate number, name, gender, team name, team color)
- [x] List contestants (filter by gender)
- [x] Edit contestant (guard: reject if any scores exist for this contestant)
- [x] Delete contestant (guard: reject if any scores exist)
- [x] Candidate number unique constraint enforced

### Frontend

- [x] Contestants list page (gender filter: All · Male · Female)
- [x] Add contestant form
- [x] Edit contestant form — fetch lock state on open; fields read-only when scores exist
- [x] Delete contestant with confirmation modal — button always visible; backend rejects with error toast if scores exist

---

## Admin — Setup: Judges

**Wireframe:** Admin Setup Flows §5

### Backend

- [x] Create judge account (name, username, password — role always set to `judge`)
- [x] List judges
- [x] Edit judge name and username (always allowed — no lock condition)
- [x] Reset judge password
- [x] Delete judge (guard: reject if judge has submitted any scores)

### Frontend

- [x] Judges list page (Edit + Reset Password + Delete actions per row)
- [x] Create judge form (name, username, password)
- [x] Edit judge form (name, username — always editable)
- [x] Reset judge password modal
- [x] Delete judge confirmation modal — backend rejects with error toast if judge has scores

---

## Admin — Live Event: Round Results & Advancement

**Wireframe:** Admin Live Event Flows §6–11

### Backend

- [x] Get judge submissions API — per-judge per-category submission flags, `fullySubmittedCount`, `totalJudges`, `allJudgesSubmitted` (API contract: [[live-event/live-judge-submissions]] — `GET /live-event/round-results/:id`)
- [x] Get round results API — rankings, `allJudgesSubmitted`, `isCompleted`, `canAdvance`, `canAdvanceReason`, `nextRound`, `advancement`, `canDeclareWinners`, `winnersDeclaredAt` (API contract: [[live-event/live-round-results]] — `GET /live-event/round-results/:id/advancement`)
- [x] Tie detection on round results fetch — cutoff straddle; `overallScore` rounded to 2 dp (same endpoint)
- [x] Advancement API — no body when no tie; with tie `{ selectedContestantIds }` merged with auto-included; validates `canAdvance` (API contract: [[live-event/live-round-advance]] — POST /live-event/round-results/:id/advancement)
- [x] Declare winners API — lock final round results (irreversible); same cutoff tie rules as Advance; persists `RoundWinner` rows + `winnersDeclaredAt` (API contract: [[live-event/live-round-declare-winners]] — `POST /live-event/round-results/:id/declare-winners`)
- [x] Get declared winners API — read official podium from `RoundWinner` after declare (API contract: [[live-event/live-round-declared-winners]] — `GET /live-event/round-results/:id/declared-winners`)

### Frontend

_Build order (Wireframe §6): sidebar → Round Results page shell → judge submissions (API ready) → rankings & advancement read APIs ready; advance POST API ready — [[live-event/live-round-advance]]._

- [ ] Admin Live Event sidebar — one navigation item per round, ordered by phase order (API contract: [[live-event/live-results-sidebar]] — reuses `GET /rounds`)
- [ ] Round Results page (shared component, driven by round ID — two sections: Judge Submissions on top, Rankings below)
  - [ ] Judge submission status display (per judge per category: ✓ / ✗; Done? column; "X of Y judges fully submitted") — build first after sidebar; consumes [[live-event/live-judge-submissions]]
  - [ ] Ranking table: contestant rows × (one column per category avg + overall score column + rank) — consumes [[live-event/live-round-results]]
  - [ ] Advance button — hidden when `isCompleted` is `true`; enabled when `canAdvance` is `true`; disabled helper from `canAdvanceReason` otherwise
  - [ ] Advance button label dynamically reads next round name (`Advance to [Next Round Name]`)
- [ ] No-tie advancement flow — `canAdvance` true and no tie → one click, empty body, backend advances top N
- [ ] Tie resolution UI (below full rankings table when `advancement.hasTie`):
  - [ ] Full rankings table unchanged (all category columns, same as no-tie state)
  - [ ] Tie-resolution panel rendered under table from `advancement.included` / `advancement.tied`
  - [ ] Selection counter ("Selected: X of Y required")
  - [ ] Disable extra checkboxes once required count is reached
  - [ ] Advance button disabled until selection count matches required (non-final rounds)
  - [ ] Declare Winners button disabled until selection count matches required (final round)
  - [ ] One click on enabled Advance advances all (auto + selected tied via `selectedContestantIds`)
  - [ ] One click on enabled Declare locks winners (auto + selected tied via `selectedContestantIds` on final round)
- [ ] Final round view — "Declare Winners" button instead of Advance
  - [ ] Declare Winners confirmation modal (warn: irreversible)
  - [ ] Winners display after declaration (🥇 🥈 🥉 with names and scores) — consumes [[live-event/live-round-declared-winners]]; not `rankings[0..2]`
- [ ] Past rounds remain visible and browsable after advancement (`isCompleted` — read-only)
- [ ] Refetch on page mount and manual browser refresh only — no auto-polling

---

## Judge — Scoring Interface

**Wireframe:** Judge Flows §12–14

### Backend

- [x] Rounds + categories list API — returns all rounds with their categories (for sidebar)
- [x] Contestants by round API — returns contestants in `round_contestants` for a given round (or all contestants for phase_order = 1)
- [x] Scoring fields by category API — returns fields sorted by max_value descending
- [x] Existing scores API — returns this judge's submitted scores for a given category (to determine submitted state: any score exists for this judge + category = fully submitted)
- [x] Batch submit scores API — receives array of all contestant scores for a category; validates all fields present and within 0–max_value; rejects if already submitted for this judge + category; inserts all in a single transaction

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

- [x] JWT auth middleware — validate token on all protected routes
- [x] Role guard middleware — `adminOnly` and `judgeOnly` guards
- [x] Global error handler — consistent error response shape
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
