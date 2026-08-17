**Last synced with codebase:** Aug 17, 2026
Product-level documentation only. API contracts, request/response shapes, and implementation details live in the repo.

---

### Overview

| Field            | Details                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| **Project Name** | PTCI Pageant Tabulation System                                                                   |
| **Type**         | Internal Web Application (Single Event)                                                          |
| **Purpose**      | Digital scoring and tabulation for PTCI school intramurals pageant — replaces the old PHP system |
| **Target Users** | Admin (event organizer) and Judges                                                               |
| **Tech Stack**   | Vue.js (TypeScript) + Tailwind CSS (frontend) · Hono + Prisma + PostgreSQL (backend)             |
|                  |                                                                                                  |

---

### Module Index

| Module                    | Description                                                                 |
| ------------------------- | --------------------------------------------------------------------------- |
| Auth                      | Username + password login for Admin and Judge roles; role-based routing     |
| Public Candidates Page    | Public-facing grid of candidate photos filterable by gender                 |
| Admin — Setup             | Create rounds, categories, scoring fields, contestants, and judge accounts  |
| Admin — Live Event        | Monitor judge submissions, view results, advance contestants, declare winners |
| Judge — Scoring Interface | View active categories, fill in scores per contestant, submit              |

---

### Core Features

---

## 0. Auth

**Features**

- Login with username + password
- Role-based redirect after login: Admin → `/admin/live/results/:roundId` (Preliminary, `phase_order = 1`) · Judge → Scoring panel
- Session management via JWT stored in HTTP-only cookie
- Logout clears session and redirects to login

**Business Rules**

- Only two roles: `admin` and `judge`
- No self-registration; all accounts are created by Admin
- Admin creates judge accounts manually through the Setup panel
- Invalid credentials → generic "Invalid username or password" — never reveal which field is wrong
- Admin cannot access the Judge scoring panel; Judges cannot access the Admin panel
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
- The `contestant_limit` of a round determines how many contestants are advanced into it from the previous round
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
- Add scoring fields (criteria) to a category: field name, max score
- Delete scoring field (only if no scores exist for that field)
- Delete category (only if no scores exist for that category)
- View list of all categories grouped by round
- Category is marked as **ready** only when all its fields sum to exactly 100; categories with fields not summing to 100 are incomplete and shown with a warning

**Business Rules**

- A category must belong to exactly one round (selected from round dropdown)
- Round dropdown always fetches live data so admin can attach a forgotten category to an existing round at any time
- A category can have one or more scoring fields (minimum 1 to activate)
- Each scoring field has a `name` and a `max_value` (integer or decimal, min 1)
- The sum of all `max_value`s in a category must equal **100** before the category can go live
- System shows running total and error if fields do not sum to 100
- A judge scores each field from **0 up to its `max_value`**
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

Frontend does not compute submission state, ties, or whether Advance is allowed. Backend sends flags on every `GET` round results fetch. Admin refreshes the page (or navigates back to the round) to see updated scores.

| Field                            | Purpose                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allJudgesSubmitted`             | `true` only when every judge has submitted every contestant in every category of this round. `false` if there are zero judges                                                                                     |
| `judgeSubmissions`               | Per judge, per category submitted flags. Frontend only renders ✓ / ✗ from this                                                                                                                                    |
| `rankings`                       | Contestant rows with category averages + overall score (see partial rules above)                                                                                                                                  |
| `isCompleted`                    | `true` when the next round already has contestants in `round_contestants` (i.e. this round was already advanced). Page is read-only history (State 3). Frontend **hides** Advance button and tie-resolution panel |
| `canAdvance`                     | `true` only when Advance is allowed (all conditions below met). When `false`, Advance stays hidden if `isCompleted` is `true`; otherwise disabled with helper from `canAdvanceReason`                             |
| `canAdvanceReason`               | When `canAdvance` is `false`, optional code for disabled button helper text (e.g. `JUDGES_NOT_COMPLETE`, `NEXT_ROUND_ALREADY_FILLED`, `NEXT_ROUND_NO_CATEGORIES`, `ROUND_COMPLETED`)                              |
| `advancement.hasTie`             | `true` only if a tie straddles the next round's cutoff — frontend shows tie-resolution panel below the full rankings table                                                                                        |
| `advancement.requiredSelections` | How many tied contestants admin must pick (`N - A`). `0` if no tie                                                                                                                                                |
| `advancement.included`           | Auto-included contestants: `id`, `name`, `overallScore`                                                                                                                                                           |
| `advancement.tied`               | Tied contestants admin may pick: `id`, `name`, `overallScore`                                                                                                                                                     |
| `nextRound`                      | `{ id, name, contestantLimit, categoryCount }`. `null` on the final round                                                                                                                                         |

`canAdvance` is `true` only when all of the following hold:

1. This round is not completed (`isCompleted` is `false`)
2. Not the final round (`nextRound` is not `null` for Advance; final round uses Declare Winners)
3. `allJudgesSubmitted` is `true`
4. Next round has no contestants in `round_contestants` yet
5. Next round has at least one category (`nextRound.categoryCount > 0`)

Tie / included lists are only sent when `allJudgesSubmitted` is `true` and `isCompleted` is `false`. While judges are still scoring, send empty `included` / `tied` arrays and `hasTie: false`.

**Tie comparison**

- Two contestants are tied when their `overallScore` matches after rounding to **2 decimal places**
- Only a tie that **straddles the cutoff** (not enough spots for all tied contestants) triggers the tie UI
- Ties entirely above or below the cutoff do not require admin action

**Advance API**

`POST /rounds/:id/advance`

| Case | Request body | Backend behavior |
| --- | --- | --- |
| No tie | No body (or empty) | Backend takes top `N` from final rankings (`included` list) |
| Tie at cutoff | `{ selectedContestantIds: number[] }` — IDs from `advancement.tied` only | Backend merges `advancement.included` + `selectedContestantIds`; validates count === `nextRound.contestantLimit` |

Backend re-validates tie rules and `canAdvance` conditions on submit. Frontend keeps tie checkbox selection in local state until Advance succeeds (no auto-polling to reset it).

**Business Rules**

- Rankings are computed on the fly from the `scores` table — not stored separately
- Tie detection runs on every results fetch — not after clicking Advance. Advance is only the confirm action
- Advance button shown and enabled only when `canAdvance` is `true`
- When `isCompleted` is `true`, hide Advance button and tie-resolution panel entirely (State 3)
- If `allJudgesSubmitted` is `false`, Advance stays disabled (or hidden until all judges submit — same as State 1)
- Advance is rejected if the next round has no categories — admin must add categories in Setup first
- System determines how many to advance by reading the **next round's `contestant_limit`**
- Contestants ranked above the cutoff are auto-advanced; no admin selection needed
- A tie only requires admin resolution when it **straddles the cutoff line** — meaning some tied contestants fall above the cutoff and some below (not enough spots for all tied contestants)
- A tie where all tied contestants are above the cutoff → all advance automatically, no issue
- A tie where all tied contestants are below the cutoff → none advance, no issue
- Only a tie that crosses the cutoff boundary triggers the manual tie resolution UI
- After advancing, the previous round's results remain permanently visible in Round Results for history and verification

**Advancement Logic**

```
Next round limit = N
Contestants clearly above cutoff = A        (A < N, no tie concerns)
Tied contestants straddling the cutoff = T  (A + T > N)
Admin must pick exactly (N - A) from the T tied contestants
```

**No Tie case:**
- All top N contestants are clearly ranked → Advance button is immediately enabled → one click advances all

**Tie case:**
- Full rankings table (all category columns) remains visible — same as the no-tie view
- When `advancement.hasTie` is `true`, a tie-resolution panel appears **below** the rankings table
- Panel shows "Included" (from `advancement.included`) and "Tie — select X more" (checkboxes from `advancement.tied`)
- Admin checks the required number of tied contestants to fill remaining spots
- Remaining checkbox count = `N - A` (system always shows exactly how many are needed)
- Unneeded checkboxes in the tied group are disabled once the required count is reached (prevents over-selection)
- Advance button is disabled until: `auto-included + tied selections === N`
- No separate "Save" step — selection state lives on the page; when count matches, button unlocks
- One click on the enabled Advance button advances all (auto-included + selected tied) to the next round

**On confirmation:**
1. All advancing contestants inserted into `round_contestants` for the next round
2. Next round becomes the current round (derived automatically from data)
3. Judges' sidebar reflects the new current round on next refresh

---

### 3.3 Declare Winners (Final Round)

**Features**

- Final round results view shows final rankings
- Declare Winners button locks all results
- Displays 1st Place, 2nd Place, 3rd Place prominently

**Business Rules**

- The round with the highest `phase_order` is treated as the final round — no "Advance" button, only "Declare Winners"
- Declaring winners sets `winners_declared_at` timestamp on that round — this is the lock mechanism
- Once `winners_declared_at` is set: the Declare button is hidden, the page shows the official winners display, and no further changes are possible
- Declaring winners is irreversible — no undo
- Final round uses the same cutoff tie UI when more contestants tie at the top-N cutoff than slots remain (e.g. top 3 with a tie at rank 3). Admin picks who is included in the ranked top 3; medals (1st / 2nd / 3rd) follow final ranking order after resolution
- `canDeclareWinners` follows the same gating as `canAdvance` (all judges submitted, not already declared) plus any cutoff tie resolved
- Results fetch for the final round should include `canDeclareWinners` and `winnersDeclaredAt` (or `isWinnersDeclared`) so the frontend can show/hide Declare and the winners display
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

- Username + password login for Admin and Judge
- Public candidates page (read-only, no auth)
- Admin setup: rounds, categories, scoring fields, contestants, judge accounts
- Admin live event: round control, results, advancement, tie resolution, declare winners
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
