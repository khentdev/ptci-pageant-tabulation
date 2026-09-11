**Last synced with codebase:** Sept 05, 2026
Product-level documentation only. API contracts, request/response shapes, and implementation details live in the repo.

---

### Overview

| Field            | Details                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| **Project Name** | PTCI Pageant Tabulation System                                                                   |
| **Type**         | Internal Web Application (Single Event)                                                          |
| **Purpose**      | Digital scoring and tabulation for PTCI school intramurals pageant — replaces the old PHP system |
| **Target Users** | Admin (event organizer), Judges, and Chairman (head judge — resolves ties only)                  |
| **Tech Stack**   | Vue.js (TypeScript) + Tailwind CSS (frontend) · Hono + Prisma + PostgreSQL (backend)             |
|                  |                                                                                                  |

---

### Module Index

| Module                    | Description                                                                 |
| ------------------------- | --------------------------------------------------------------------------- |
| Auth                      | Username + password login for Admin, Judge, and Chairman roles; role-based routing |
| Public Candidates Page    | Public-facing grid of candidate photos filterable by gender                 |
| Admin — Setup             | Create rounds, categories, scoring fields, contestants, and judge/chairman accounts |
| Admin — Live Event        | Monitor judge submissions, view results, advance contestants, declare winners (Admin: tie-free only) |
| Chairman — Live Event     | Same results view as Admin (no Setup access); resolves cutoff and placement ties only |
| Judge — Scoring Interface | View active categories, fill in scores per contestant, submit              |

---

### Core Features

---

## 0. Auth

**Features**

- Login with username + password
- Role-based redirect after login: Admin or Chairman → `/admin/live/results/:roundId` (Preliminary, `phase_order = 1`) · Judge → Scoring panel
- Session management via JWT stored in HTTP-only cookie
- Logout clears session and redirects to login

**Business Rules**

- Three roles: `ADMIN`, `JUDGE`, `CHAIRMAN`
- No self-registration; all accounts are created by Admin
- Admin creates Judge and Chairman accounts through the same Setup → Judges & Chairman panel (a role picker at creation decides which; role is not editable afterward)
- Invalid credentials → generic "Invalid username or password" — never reveal which field is wrong
- Judges cannot access the Admin/Chairman panel or vice versa. Admin and Chairman share the same Live Event page/URLs, but Chairman has no access to Setup (Rounds/Categories/Contestants/Judges) and can only Advance/Declare when a tie exists — see §3.2/§3.3
- Session is validated on every app load; expired or invalid session redirects to login

---

## 1. Public Candidates Page (Last na 'to: Wala pang contestants)

**Features**

- Public-facing page — no login required
- Displays all registered candidates in a vertical-scrollable grid
- Each card shows: candidate number, full name, team name, team color, photo
- Filter by gender: All · Male · Female
- No CRUD UI; candidate images are placed manually into a designated static folder

**Business Rules**

- No authentication required to view this page
- Contestant data (number, name, gender, team name, team color) is hardcoded directly in the frontend — no backend API call
- Candidate photos are placed manually in the frontend's `public/candidates/` folder, named by candidate number (e.g., `1.jpg`, `2.jpg`)
- The frontend maps each hardcoded contestant's number to its image path (`/candidates/{candidate_number}.jpg`) entirely client-side
- If a candidate has no image file, a placeholder is shown
- This page is fully static — no backend involvement at all
- This page is read-only — no add, edit, or delete actions available here

---

## 2. Admin — Setup

Setup is completed **before** the pageant starts. Admin configures rounds, categories, scoring fields, contestants, and judges.

---

### 2.1 Rounds Management

**Features**

- Create a round: name, phase order, contestant limit
- View list of all rounds ordered by phase order
- Edit round name (always allowed — cosmetic only)
- Edit contestant limit (only allowed if no contestants have been advanced into this round yet)
- Phase order is not editable after creation; delete and recreate if incorrect (only if no categories or scores exist)

**Business Rules**

- A round must have a unique `phase_order` (1, 2, 3, etc.)
- `phase_order` determines the sequence of competition
- **Exactly one round must have `phase_order = 1`** — this is the Preliminary round; creating a second round with phase_order = 1 is rejected
- Creating a round with `phase_order > 1` is rejected if no round with `phase_order = 1` exists yet — admin must create the Preliminary round first
- The first round (phase_order = 1) always shows all contestants — no `RoundContestant` rows needed
- First round (phase_order = 1) has contestant limit = `null` (unlimited — all contestants participate)
- Subsequent rounds (Top 10, Top 5, Top 3, etc.) have a defined `contestant_limit`
- The `contestant_limit` of a round determines how many contestants of **each gender** are advanced into it from the previous round (e.g. `5` advances up to 5 females and up to 5 males — see §3.2)
- **Next round** = the round with the lowest `phase_order` that is greater than the current round's `phase_order` (gaps in phase_order are allowed — e.g. 1, 5, 10 works the same as 1, 2, 3)
- **Final round** = the round with the highest `phase_order` — shows "Declare Winners" instead of "Advance"
- Can delete a round only if it has no categories and no scores — useful for fixing setup mistakes
- Cannot delete a round that already has categories or any scoring data; backend rejects with an error message shown to admin
- Phase order must be unique across all rounds
- Phase order is immutable after creation — changing it would break round sequencing, current round derivation, and advancement logic
- Contestant limit is locked once the round has contestants in `round_contestants` (advancement has occurred)
- Contestant limit changes before advancement have no side effects
- Rounds are created before categories; a round without categories means judges have no scoring to do for that round

---

### 2.2 Category Management

**Features**

- Create a category: select round (dropdown), name
- Edit category name (only if no scores exist for that category)
- Add scoring fields (criteria) to a category via a batch form: all fields submitted at once with total validated at 100
- Delete scoring field (only if no scores exist for that field)
- Delete category (only if no scores exist for that category)
- View list of all categories grouped by round
- A category is either **complete** (has fields, total = 100) or **empty** (no fields yet) — no partial field states exist in the DB

**Business Rules**

- A category must belong to exactly one round (selected from round dropdown)
- Round dropdown always fetches live data so admin can attach a forgotten category to an existing round at any time
- A category must have at least one scoring field
- Scoring fields are submitted as a **batch** — all fields in one request; no partial field sets allowed in the DB
- Each scoring field has a `name` and a `max_value` (integer or decimal, min 1)
- The sum of all `max_value`s in the batch must equal exactly **100** — validated server-side; rejected if not
- Frontend shows a live running total and disables Save until total = 100
- A judge scores each field from **1 up to its `max_value`**
- Category score per judge = `Σ field_values` (plain sum — no separate weighting needed; max values are the weights)
- Can delete a category only if no scores exist for it — useful for fixing setup mistakes
- Cannot delete a category with existing judge scores; backend rejects with an error message shown to admin
- Category name is editable only if no scores exist for it (scores exist = locked, no scores = editable)

**Scoring Fields (Criteria) Rules**

- Field names are free text (e.g., "Stage Presence", "Mastery")
- Max score per field is the effective weight (e.g., max 40 means this field contributes up to 40 points of the 100)
- Fields are displayed on the judge's scoring screen sorted by `max_value` descending (highest max first) — no manual reorder needed
- Cannot delete a field if scores have been submitted against it

---

### 2.3 Contestant Management

**Features**

- Add contestant: candidate number, name, gender (Male / Female), team color, team name
- View list of all contestants with filter by gender
- Edit contestant details (only if no scores exist)
- Delete contestant (only if no scores exist)

**Business Rules**

- Candidate number must be unique
- Gender is either `male` or `female`
- Team label is team's name
- All contestants automatically participate in the first round (phase_order = 1) — no enrollment trigger or manual start needed; the system always queries all contestants for the first round
- Cannot delete a contestant with existing scores

---

### 2.4 Judge Management

**Features**

- Create judge account: name, username, password
- View list of all judges
- Edit judge name and username
- Reset judge password
- Delete judge account (only if no scores submitted)

**Business Rules**

- Judge username must be unique system-wide
- Admin creates and manages all judge accounts — no self-registration
- A judge account belongs to role `judge` and can only access the scoring panel
- Name and username are always editable — no lock condition (cosmetic fields, useful for fixing typos)
- If username is changed while a judge is logged in, their existing session remains valid (JWT stores user ID not username); judge uses the new username on next login
- Cannot delete a judge account with existing submitted scores
- Number of judges is not fixed; any number of judges can be created

---

## 3. Admin — Live Event

Used **during** the actual pageant event. Separate view from Setup.

---

### 3.1 Round State (No Manual Start Needed)

**Business Rules**

- No status column, no `started_at`, no "Start Round" button — round state is fully derived from data
- **Preliminary (phase_order = 1):** always shows all contestants automatically — no trigger required; judges can score as soon as setup is done and they log in
- **Top N rounds:** contestants only appear after admin advances them; `round_contestants` rows are the gate
- **Current round** = the latest round by `phase_order` that has contestants available to score
- **Completed/past** = a round whose next round already has rows in `round_contestants`
- Judges see all rounds in the sidebar; Top N rounds without contestants yet show "No contestants yet"
- All rounds remain permanently visible in Round Results for history and verification — nothing is hidden after advancement

---

### 3.2 Round Results & Advancement

**Features**

- Separate results view per round (Preliminary, Top 10, Top 5, Top 3, etc.)
- System auto-computes rankings after all judges submit
- One action per round: **Advance to [Next Round Name]** (or **Declare Winners** on the final round)
- Tie detection at the advancement cutoff
- Manual tie resolution UI on the same page

**Advancement is gender-based, not overall.** Ranking, rank numbering, the cutoff, and tie detection are all computed **independently for males and females** against the same round `contestant_limit` — a limit of 5 advances the top 5 females and the top 5 males (up to 10 total), not the 5 highest scores regardless of gender. This prevents one gender's stronger scores from crowding the other out of the round entirely. A tie can surface in one gender only, both at once, or neither.

**Advance is role-conditional on whether a tie exists.** Resolving a tie is a judging decision, not an operational one:
- **No tie:** only **Admin** can advance. The Advance button is hidden for Chairman.
- **Tie exists (`advancement.hasTie`):** only **Chairman** can advance. Admin's Advance button is hidden and replaced with a message that the tie must be resolved by the Chairman first.
- The tie-resolution checkboxes are visible to both roles (so Admin can see what's blocking progress) but only interactive for Chairman.
- The backend enforces this independent of the UI — an Admin POST while a tie exists returns `409 ADVANCE_REQUIRES_CHAIRMAN`; a Chairman POST with no tie returns `409 CHAIRMAN_ACTION_REQUIRES_TIE`.

**Score Calculation**

```
1. Judge's category score per contestant (computed server-side on submission, not shown to judge):
     category_score = Σ all field values entered by this judge for this contestant
     (field max values sum to 100, so category_score is out of 100)

2. Average category score per contestant across all judges (shown in admin Round Results per category column):
     avg_category_score = Σ all judges' category_scores / number of judges

3. Overall round score per contestant (shown in admin Round Results as the ranking column):
     overall_score = Σ avg_category_scores (for categories with a value) / count of those categories
```

**Partial rankings (while judges are still scoring)**

- Per category column: average across judges who have submitted that category; `—` if no judge has submitted that category yet for this round's contestants
- Overall column: average of category columns that are not `—`; show `—` if no category has a value yet
- Tie detection and advancement use rankings only when `allJudgesSubmitted` is `true` (full averages across all judges for every category in the round)
- Rank numbering (the ranking column) restarts at 1 for each gender — it is not a single 1..N sequence across the whole round

**Rankings contestant pool**

- `phase_order = 1` (Preliminary): all contestants
- `phase_order > 1`: only contestants in `round_contestants` for that round

**Where Each Score Appears**

| Score | Visible To | Where |
| --- | --- | --- |
| `category_score` | Nobody | Computed internally; used to derive averages |
| `avg_category_score` | Admin only | Round Results — one column per category |
| `overall_score` | Admin only | Round Results — Overall column; used for ranking and advancement |

Judges only see the fields they fill in. No totals, no running math, no score feedback shown on the judge's screen.

**Results Fetch Payload (page mount and manual refresh only — no auto-polling)**

Frontend does not compute submission state, ties, or whether Advance is allowed. Backend sends flags on every round-results fetch. The Round Results page uses **two GETs always** on mount / manual refresh / round change: [[live-event/live-judge-submissions]] for the judge matrix and [[live-event/live-round-results]] for rankings and advancement flags. When `winnersDeclaredAt` is set (final round after declare), also fetch [[live-event/live-round-declared-winners]] for the official podium. Admin refreshes the page (or navigates back to the round) to see updated scores.

| Field                            | Purpose                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allJudgesSubmitted`             | `true` only when every judge has submitted every contestant in every category of this round. `false` if there are zero judges                                                                                     |
| `judgeSubmissions`               | Per judge, per category submitted flags. Frontend only renders ✓ / ✗ from this                                                                                                                                    |
| `rankings`                       | Contestant rows with category averages + overall score (see partial rules above)                                                                                                                                  |
| `isCompleted`                    | `true` when the next round already has contestants in `round_contestants` (i.e. this round was already advanced). Page is read-only history (State 3). Frontend **hides** Advance button and tie-resolution panel |
| `canAdvance`                     | `true` only when Advance is allowed (all conditions below met). When `false`, Advance stays hidden if `isCompleted` is `true`; otherwise disabled with helper from `canAdvanceReason`                             |
| `canAdvanceReason`               | When `canAdvance` is `false`, optional code for disabled button helper text (e.g. `JUDGES_NOT_COMPLETE`, `CURRENT_ROUND_NO_CATEGORIES`, `NEXT_ROUND_ALREADY_FILLED`, `NEXT_ROUND_NO_CATEGORIES`, `ROUND_COMPLETED`)                              |
| `advancement.hasTie`             | `true` only if a tie straddles the cutoff **in either gender** — frontend shows tie-resolution panel(s) below the full rankings table                                                                            |
| `advancement.requiredSelections` | Total tied contestants admin must pick across both genders (`N - A` per gender, summed). `0` if neither gender has a tie                                                                                          |
| `advancement.included`           | Auto-included contestants, both genders combined: `id`, `name`, `gender`, `overallScore`                                                                                                                          |
| `advancement.tied`               | Tied contestants admin may pick, both genders combined: `id`, `name`, `gender`, `overallScore` — filter by `gender` to separate the two tie groups                                                               |
| `nextRound`                      | `{ id, name, contestantLimit, categoryCount }`. `null` on the final round. `contestantLimit` is applied **per gender**                                                                                            |

`canAdvance` is `true` only when all of the following hold:

1. This round is not completed (`isCompleted` is `false`)
2. Not the final round (`nextRound` is not `null` for Advance; final round uses Declare Winners)
3. Current round has at least one category
4. `allJudgesSubmitted` is `true`
5. Next round has no contestants in `round_contestants` yet
6. Next round has at least one category (`nextRound.categoryCount > 0`) and a positive `contestantLimit`

Tie / included lists are only sent when `allJudgesSubmitted` is `true` and `isCompleted` is `false`. While judges are still scoring, send empty `included` / `tied` arrays and `hasTie: false`.

**Tie comparison**

- Two contestants of the **same gender** are tied when their `overallScore` matches after rounding to **2 decimal places** — ties are never compared across genders
- Only a tie that **straddles the cutoff** (not enough spots for all tied contestants of that gender) triggers the tie UI
- Ties entirely above or below the cutoff do not require admin action
- A tie in one gender does not block or delay the other gender's clean advancement

**Advance API**

`POST /live-event/round-results/:id/advancement` — API contract: [[live-event/live-round-advance]]

| Case | Request body | Backend behavior |
| --- | --- | --- |
| No tie | No body (or empty) | Backend takes contestants from `advancement.included` (top N by ranking per gender, or all eligible when fewer than N of that gender have scores) |
| Tie at cutoff (one or both genders) | `{ selectedContestantIds: number[] }` — IDs from `advancement.tied` only, combined across whichever gender(s) have a tie | Backend merges `advancement.included` + `selectedContestantIds` **per gender**; validates each gender's count === `nextRound.contestantLimit` for that gender |

Backend re-validates tie rules and `canAdvance` conditions on submit, checking each gender's pick count independently — an admin cannot satisfy the total required-selections count by taking every extra pick from one gender's tie while leaving the other gender's tie unresolved. Frontend keeps tie checkbox selection in local state (one array covering both gender panels) until Advance succeeds (no auto-polling to reset it).

**Business Rules**

- Rankings are computed on the fly from the `scores` table — not stored separately
- Tie detection runs on every results fetch — not after clicking Advance. Advance is only the confirm action
- Advance button shown and enabled only when `canAdvance` is `true`
- When `isCompleted` is `true`, hide Advance button and tie-resolution panel entirely (State 3)
- If `allJudgesSubmitted` is `false`, Advance stays disabled (or hidden until all judges submit — same as State 1)
- Advance is rejected if the next round has no categories — admin must add categories in Setup first
- System determines how many of each gender to advance by reading the **next round's `contestant_limit`**, applied once per gender
- When fewer contestants of a gender have scores than the limit, that gender's advancement may include fewer than N — all its eligible scored contestants advance (this is independent of the other gender)
- Contestants ranked above the cutoff **within their own gender** are auto-advanced; no admin selection needed
- A tie only requires admin resolution when it **straddles the cutoff line within a gender** — meaning some tied contestants of that gender fall above the cutoff and some below (not enough spots for all tied contestants of that gender)
- A tie where all tied contestants are above the cutoff → all advance automatically, no issue
- A tie where all tied contestants are below the cutoff → none advance, no issue
- Only a tie that crosses the cutoff boundary triggers the manual tie resolution UI — a tie in one gender never affects the other gender's advancement
- After advancing, the previous round's results remain permanently visible in Round Results for history and verification

**Advancement Logic (run once per gender, then combined)**

```
Per-gender limit = N               (same N applied to females and to males independently)
Contestants of that gender clearly above cutoff = A        (A < N, no tie concerns)
Tied contestants of that gender straddling the cutoff = T  (A + T > N)
Admin must pick exactly (N - A) from that gender's T tied contestants
```

**No Tie case (both genders clean):**
- All top N contestants of each gender are clearly ranked → Advance button is immediately enabled → one click advances all

**Tie case (one or both genders):**
- Full rankings table (all category columns) remains visible — same as the no-tie view, typically grouped/labeled by gender
- When `advancement.hasTie` is `true`, a tie-resolution panel appears **below** the rankings table for each gender that has a tie (a tie in only one gender shows only that gender's panel)
- Each panel shows "Included" (from `advancement.included`, filtered to that gender) and "Tie — select X more" (checkboxes from `advancement.tied`, filtered to that gender)
- Admin checks the required number of tied contestants **in each affected gender's panel** to fill that gender's remaining spots
- Remaining checkbox count per panel = `N - A` for that gender (system always shows exactly how many are needed)
- Unneeded checkboxes in a tied group are disabled once that group's required count is reached (prevents over-selection)
- Advance button is disabled until every affected gender satisfies: `auto-included + tied selections === N` for that gender
- No separate "Save" step — selection state lives on the page as one combined array; when every gender's count matches, button unlocks
- One click on the enabled Advance button advances all (auto-included + selected tied, both genders) to the next round

**On confirmation:**
1. All advancing contestants inserted into `round_contestants` for the next round
2. Next round becomes the current round (derived automatically from data)
3. Judges' sidebar reflects the new current round on next refresh

---

### 3.3 Declare Winners (Final Round)

**Features**

- Final round results view shows final rankings
- Declare Winners button locks all results
- Displays 1st Place, 2nd Place, 3rd Place prominently, **per gender** (a Ms. podium and a Mr. podium)

**Business Rules**

- The round with the highest `phase_order` is treated as the final round — no "Advance" button, only "Declare Winners"
- Declaring winners sets `winners_declared_at` on that round and inserts `RoundWinner` rows in the same transaction — lock plus official podium snapshot (`placement`, `gender`, `contestantId`, `overallScore`)
- **Placement is per gender**: sorting, ranking, and `placement` numbering (1..N) are computed independently for females and males, so a female and a male can both be declared placement 1 in the same round. `RoundWinner`'s primary key is `(roundId, gender, placement)`
- Official declared podium (placement + score snapshot) is stored in `RoundWinner` rows at declare time — sorted by gender then score then `candidateNumber` at write; separate from score-based `rankings` on the round results page
- Read path: `GET /live-event/round-results/:id/declared-winners` returns `declaredWinners` from `RoundWinner` when `winners_declared_at` is set; `null` when not declared — frontend shows two podiums (grouped by `gender`) on the same Round Results page (`/admin/live/results/:roundId`), not a separate route
- Once `winners_declared_at` is set: the Declare button is hidden, the page shows the official winners display (from declared-winners GET), and no further changes are possible
- Declaring winners is irreversible — no undo
- The final round's roster is already fixed by the time it's reached: `advanceRound` always caps the number of contestants of each gender entering a round at that round's own `contestant_limit` for that gender, so the final round can never hold more of either gender than its `contestant_limit`. A cutoff tie for the last qualifying spot in a gender is resolved one round earlier, during Advance into the final round — not at Declare Winners
- The API still exposes the same cutoff-tie shape (`advancement.hasTie`, `included`, `tied`, all gender-tagged) on the final round's results GET for structural consistency with Advance, and `canDeclareWinners` is `false` while `advancement.hasTie` is `true` for either gender — but given the roster cap above, this condition is not reachable through normal play; it is defensive, not a flow admins should expect to hit
- **Placement ties require Chairman resolution — they are not silently broken.** Even with the roster already fixed, two or more same-gender finalists can legitimately share the exact same `overallScore` (e.g. both at 100 for a Top 3 round). `GET /live-event/round-results/:id/advancement` exposes these as `placementTies` — one entry per tied cluster (`gender`, `contestants[]`) — computed from the already-decided winner set once any cutoff tie is resolved. `canDeclareWinners` is `false` while `placementTies` is non-empty
- To declare, the Chairman must submit `placementOrder: number[]` — the exact set of tied contestant IDs, ordered by chosen finish order within each cluster (order across unrelated clusters doesn't matter, since only same-score contestants are ever compared). The backend re-validates this set server-side (`PLACEMENT_ORDER_REQUIRED` / `PLACEMENT_ORDER_MISMATCH` / `PLACEMENT_ORDER_NOT_ALLOWED`) before assigning `placement` — a client can never dictate placement numbers directly, only break the tie
- Non-tied contestants are always ordered by `overallScore` descending regardless of `placementOrder`; `candidateNumber` ascending remains the fallback tiebreak only for the (now unreachable post-validation) case where two contestants are equal-scored but not covered by a submitted order
- `canDeclareWinners` follows the same readiness gates as Advance (all judges submitted, not already declared, current round has categories), plus any cutoff tie (either gender) must be resolved via local selection and POST body when `advancement.hasTie` is `true`, and any placement tie must be resolved via `placementOrder` when `placementTies` is non-empty — GET returns `canDeclareWinners: false` while either is unresolved
- **Declare is role-conditional, same split as Advance (§3.2):** only **Admin** can declare when there is no tie of either kind; only **Chairman** can declare when a cutoff tie or placement tie exists. Admin's Declare button is hidden and replaced with a "resolved by the Chairman" message while a tie is unresolved; Chairman's button only appears when there is a tie to resolve. Enforced server-side regardless of UI state: Admin POST during a tie → `409 DECLARE_REQUIRES_CHAIRMAN`; Chairman POST with no tie → `409 CHAIRMAN_ACTION_REQUIRES_TIE`
- Results fetch for the final round should include `canDeclareWinners` and `winnersDeclaredAt` (or `isWinnersDeclared`) so the frontend can show/hide Declare and the winners display; podium rows come from [[live-event/live-round-declared-winners]] after declare
- **Admin account:** a single admin account is seeded into the database before the event — no self-registration flow exists for admin

---

## 4. Judge — Scoring Interface

**Features**

- Sidebar shows all rounds, each expandable to reveal categories underneath
- Clicking a category fetches and displays the scoring grid
- Scoring grid: contestants (rows) × scoring fields (columns) with max score indicators
- Judge fills in scores for all contestants freely — no per-contestant submit
- One **Submit All** button per category — submits all contestant scores at once
- Once submitted, all inputs in that category become read-only with submitted values retained
- Cannot edit after Submit All is clicked

**Business Rules**

- Judge sees all rounds in the sidebar (for context), but only rounds with contestants are interactive
- Rounds without contestants show "No contestants yet" when expanded — no scoring is possible
- On category open: system fetches contestants in the current round + any existing scores by this judge for that category to determine submitted state
- **Submitted state is per category** — if any score exists for this judge + category → entire category is submitted and all inputs are read-only
- Judge can freely change any contestant's score before clicking Submit All
- All fields for all contestants must be filled before Submit All is allowed — partial submission is not allowed
- Each field value must be between 0 and its `max_value` (inclusive); server also validates
- Backend receives an array of all contestant scores in one request and inserts them in a single transaction — all succeed or all fail
- Backend rejects submission if scores already exist for this judge + category (double-submit prevention)
- DB unique constraint `[judgeId, contestantId, criteriaFieldId]` provides a second layer of protection against duplicate scores
- After Submit All: all inputs for that category are read-only and retain submitted values so the judge can verify; Submit All button is hidden
- Judge cannot re-submit or edit a submitted category under any circumstance
- Score submission is visible to admin on next round-results page refresh (no auto-polling)
- Judge sidebar refetches rounds/categories on page mount and manual refresh only — judge refreshes to see newly advanced rounds

---

### Cross-Cutting Business Rules

- Single-tenant, single-event system — all data belongs to one pageant
- Role-based access enforced on both frontend routes and backend API middleware
- Admin cannot submit scores; Judges cannot access setup or live event management
- All score values stored as `decimal(5,2)` — up to 2 decimal places
- Scores cannot be deleted (immutable audit trail)
- The `round_contestants` table is the source of truth for who participates in which round
- For the first round (phase_order = 1), the system always returns all contestants — no `round_contestants` rows needed; subsequent rounds are populated only via the advancement flow
- Rounds, categories, and fields created in Setup cannot be modified once scores exist against them

---

### System Scope

**In Scope**

- Username + password login for Admin, Judge, and Chairman
- Public candidates page (read-only, no auth)
- Admin setup: rounds, categories, scoring fields, contestants, judge/chairman accounts
- Admin live event: round control, results, advancement, tie resolution, declare winners (tie-free only)
- Chairman live event: same results view as Admin (no Setup access); resolves ties only
- Judge scoring interface with per-category batch submission and lock
- Auto score calculation and ranking
- Judge submission status tracking

**Out of Scope (Not built in this version)**

- Image upload UI for candidates (images placed manually in folder)
- Real-time WebSocket or auto-polling (admin and judge views refetch on manual page refresh only)
- Print or PDF export of results
- SMS or email notifications
- Score editing or correction after submission
- Multiple concurrent pageant events
- Audit log page

---

**Related docs:** [[Wireframe & Flows]]
