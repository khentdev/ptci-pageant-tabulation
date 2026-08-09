**Last synced with codebase:** Aug 7, 2026
User flows and wireframes in plain English with ASCII layouts.
See [[System Documentation]] for business rules.

---

## Auth

### 1. Login

**Flow**

- User visits the app root `/` → redirected to `/login`
- User fills in username and password → submits
  - On invalid credentials → show "Invalid username or password", stay on page
  - On success (role = `admin`) → redirect to `/admin/live/results`
  - On success (role = `judge`) → redirect to `/judge/scoring`
- Expired or invalid session on any protected page → redirected back to `/login`

**Wireframe — Login Page**

```
┌─────────────────────────────────────────┐
│                                         │
│         PTCI Pageant Tabulation         │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Username                          │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Password                          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │            Sign In                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [ Invalid username or password ]       │  ← shown on fail
│                                         │
└─────────────────────────────────────────┘
```

---

## Public — Candidates Page (Last na 'to: Wala pang contestants)

### 1. View Candidates

**Flow**

- User visits `/candidates` — no login required
- Contestant data (number, name, gender, team) is hardcoded in the frontend — no backend API call at all
- Photos are loaded from frontend's own `public/candidates/{candidate_number}.jpg`
- If no photo file exists for a candidate number → placeholder image shown (handled entirely on frontend)
- User clicks gender filter → grid re-renders with filtered results
- Page is read-only — no add, edit, or delete

**Wireframe — Candidates Page**

```
┌──────────────────────────────────────────────────────────────┐
│  PTCI Pageant 2026 — Candidates                              │
│                                                               │
│  Filter: [ All ]  [ Male ]  [ Female ]                        │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  [photo] │  │  [photo] │  │  [photo] │  │  [photo] │     │
│  │    #1    │  │    #2    │  │    #3    │  │    #4    │     │
│  │ Dela Cruz│  │ Lungcay  │  │ Badang   │  │ Palay    │     │
│  │🔵 Blue   │  │🔴 Red    │  │🟡 Yellow │  │🟣 Purple │     │
│  │  Team    │  │  Team    │  │  Team    │  │  Team    │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  [photo] │  │  [photo] │  │  [photo] │  │  [photo] │     │
│  │    #5    │  │    #6    │  │    #7    │  │    #8    │     │
│  │  ...     │  │  ...     │  │  ...     │  │  ...     │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                               │
│  [ scrolls vertically ]                                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Admin Flows

### Layout — Admin Shell

```
┌──────────────────────────────────────────────────────────────────┐
│  PTCI Admin                                       [ Logout ]      │
├────────────────┬─────────────────────────────────────────────────┤
│ SETUP          │                                                  │
│  Rounds        │   [ Main Content Area ]                          │
│  Categories    │                                                  │
│  Contestants   │                                                  │
│  Judges        │                                                  │
│                │                                                  │
│ LIVE EVENT     │                                                  │
│  Round Results │                                                  │
│    Preliminary │                                                  │
│    Top 10      │                                                  │
│    Top 5       │                                                  │
│    Top 3       │                                                  │
└────────────────┴─────────────────────────────────────────────────┘
```

- Round Results sidebar items are dynamically generated from the rounds in the database, ordered by phase_order
- Sidebar links to each round's individual results page

---

## Admin — Setup Flows

### 2. Create Round

**Flow**

- Admin navigates to Setup → Rounds
- Sees list of existing rounds (ordered by phase order)
- Clicks "Add Round" → form slides in or modal opens
- Fills in: Round Name, Phase Order, Contestant Limit (blank = unlimited)
- On success → round appears in list; round also appears in Live Event sidebar
- On fail (duplicate phase order, missing fields) → inline field errors

**Wireframe — Rounds List**

```
┌──────────────────────────────────────────────────────┐
│ Rounds                             [ + Add Round ]    │
│                                                       │
│  #   Name            Phase Order   Limit              │
│  ─── ─────────────   ───────────   ─────              │
│  1   Preliminary     1             Unlimited          │
│  2   Top 10          2             10                 │
│  3   Top 5           3             5                  │
│  4   Top 3           4             3                  │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Wireframe — Add Round Form**

```
┌──────────────────────────────────────────┐
│ Add Round                                │
│                                          │
│  Round Name      [ Preliminary         ] │
│  Phase Order     [ 1                   ] │
│  Contestant Limit[ (blank = unlimited) ] │
│                                          │
│  [ Cancel ]              [ Save Round ]  │
└──────────────────────────────────────────┘
```

---

### 3. Create Category

**Flow**

- Admin navigates to Setup → Categories
- Sees list of all categories grouped by round
- Clicks "Add Category"
- Selects round from dropdown (fetches all rounds live)
- Enters category name
- Saves → category created; now admin adds scoring fields
- Admin clicks category → opens field editor
- Adds fields one by one: field name, max score
- Running total shown; error shown if total ≠ 100
- Category shows as "Ready" when total = 100

**Wireframe — Categories List**

```
┌──────────────────────────────────────────────────────┐
│ Categories                       [ + Add Category ]   │
│                                                       │
│  PRELIMINARY                                          │
│  ├── Swimwear           4 fields   Total: 100  ✓      │
│  ├── Talent             4 fields   Total: 100  ✓      │
│  ├── Formal Wear        4 fields   Total: 100  ✓      │
│  └── Production         3 fields   Total: 80   ⚠      │
│                                                       │
│  TOP 5                                                │
│  └── Q&A Round          2 fields   Total: 100  ✓      │
│                                                       │
│  TOP 3                                                │
│  └── Final Question     2 fields   Total: 100  ✓      │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Wireframe — Category Field Editor**

```
┌──────────────────────────────────────────────────────┐
│ Swimwear — Scoring Fields                             │
│                                                       │
│  #   Field Name             Max Score                 │
│  ─   ─────────────────────  ─────────                 │
│  1   Stage Presence         40                        │
│  2   Figure & Fitness       30                        │
│  3   Poise & Bearing        20                        │
│  4   Overall Impact         10                        │
│                                                       │
│  Running Total: 100 / 100  ✓                          │
│                                                       │
│  [ + Add Field ]                [ Save ]              │
└──────────────────────────────────────────────────────┘
```

---

### 4. Add Contestant

**Flow**

- Admin navigates to Setup → Contestants
- Views list filterable by gender (All / Male / Female)
- Clicks "Add Contestant" → fills form
- On success → contestant appears in list

**Wireframe — Contestants List**

```
┌──────────────────────────────────────────────────────┐
│ Contestants                    [ + Add Contestant ]   │
│                                                       │
│  Filter: [ All ]  [ Male ]  [ Female ]                │
│                                                       │
│  #    Name                 Gender   Team              │
│  ──   ─────────────────    ──────   ────              │
│  1    Aniar, Andrea Mae    Female   Yellow            │
│  2    Dela Cruz, Christine Female   Purple            │
│  3    Delos Santos, Jona   Female   Purple            │
│  ...                                                  │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

### 5. Add Judge

**Flow**

- Admin navigates to Setup → Judges
- Clicks "Add Judge" → fills name, username, password
- On success → judge appears in list; judge can now log in

**Wireframe — Judges List**

```
┌──────────────────────────────────────────────────────┐
│ Judges                               [ + Add Judge ]  │
│                                                       │
│  Name         Username    Actions                     │
│  ──────────   ─────────   ───────                     │
│  Judge 1      judge1      [ Reset Password ]          │
│  Judge 2      judge2      [ Reset Password ]          │
│  Judge 3      judge3      [ Reset Password ]          │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## Admin — Live Event Flows

### 6. Monitor Round Progress

**Flow**

- Admin navigates to Live Event → Round Results → Preliminary
- Page immediately shows all contestants and judge submission progress — no "Start Round" needed
- Preliminary is always live; judges can score as soon as they log in
- Admin monitors submission progress per judge per category
- Once all judges have fully submitted → "Advance to Top N" button becomes enabled
- Top N round pages show "No contestants yet" until advancement

**Wireframe — Preliminary (In Progress)**

```
┌──────────────────────────────────────────────────────────────┐
│ Round Results: Preliminary                                    │
│                                                               │
│  Judge Submissions                                            │
│  ─────────────────────────────────────────────               │
│  Judge 1   Swimwear ✓  Talent ✓  Formal ✓  Production ✓  ✓   │
│  Judge 2   Swimwear ✓  Talent ✓  Formal ✓  Production ✗  ✗   │
│  Judge 3   Swimwear ✗  Talent ✗  Formal ✗  Production ✗  ✗   │
│                                                               │
│  2 of 3 judges fully submitted                                │
│                                                               │
│  [ Advance to Top 10 ]   ← disabled                          │
└──────────────────────────────────────────────────────────────┘
```

---

### 8. View Results & Advance (No Tie)

**Flow**

- All judges submit → page auto-refreshes (or admin refreshes)
- Advance button becomes enabled
- System shows ranked contestants with computed overall scores
- Admin reviews rankings → clicks "Advance to Top 10"
- System takes top 10, inserts into `round_contestants` for Top 10 round
- Top 10 is now the current round (derived from data — has contestants, next round has none)
- Admin clicks Top 10 in sidebar to monitor its progress
- Judges' sidebar reflects the change on next poll

**Wireframe — Preliminary (All Submitted, No Tie)**

```
┌──────────────────────────────────────────────────────────────┐
│ Round Results: Preliminary                ✅ All Submitted    │
│                                                               │
│  Rank  Contestant             Overall Score                   │
│  ────  ─────────────────────  ─────────────                   │
│    1   Lungcay, Keanna              95.33                     │
│    2   Palay, Roldan                91.60                     │
│    3   Badang, Ethel                84.00                     │
│    4   Tenorio, Sean                83.80                     │
│    5   Reyes, Julian                83.75                     │
│    6   Dela Cruz, Christine         82.33   ← cutoff line     │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                    │
│    7   Aniar, Andrea                77.25                     │
│    8   Cortez, Ivy                  74.67                     │
│   ...                                                         │
│                                                               │
│            [ Advance Top 5 to Top 5 Round ]                  │
└──────────────────────────────────────────────────────────────┘
```

---

### 9. Tie Resolution

**Flow**

- Admin opens Round Results — page already shows rankings
- If no tie at cutoff → Advance button is immediately enabled (see Step 8)
- If tie straddles the cutoff → page shows two sections
- Admin selects the required number from the tied group
- Once selection count matches required spots → Advance button enables
- Checking more than required is blocked (extra checkboxes disabled)
- Admin clicks Advance → all (auto-included + selected) advance together in one action
- No separate "Save" step

**Wireframe — No Tie (button immediately enabled)**

```
┌──────────────────────────────────────────────────────────────┐
│ Round Results: Preliminary                ✅ All Submitted    │
│                                                               │
│  Rank  Contestant             Score                           │
│   1    Lungcay, Keanna        95.33  ← advancing             │
│   2    Palay, Roldan          91.60  ← advancing             │
│   3    Badang, Ethel          84.00  ← advancing             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  cutoff                  │
│   4    Tenorio, Sean          82.40                           │
│   5    Reyes, Julian          80.10                           │
│                                                               │
│              [ Advance to Top 3 ]  ← enabled                 │
└──────────────────────────────────────────────────────────────┘
```

**Wireframe — Tie at Cutoff**

```
┌──────────────────────────────────────────────────────────────┐
│ Round Results: Preliminary                ✅ All Submitted    │
│                                                               │
│  ✅ Included in Top 3 — 2 of 3 spots filled:                 │
│   1    Lungcay, Keanna        95.33                           │
│   2    Palay, Roldan          91.60                           │
│                                                               │
│  ⚠️  Tie — select 1 more to fill remaining spot:             │
│   [ ]  Badang, Ethel          82.00                           │
│   [ ]  Tenorio, Sean          82.00                           │
│   [ ]  Reyes, Julian          82.00                           │
│                                                               │
│   Selected: 0 of 1 required                                   │
│                                                               │
│              [ Advance to Top 3 ]  ← disabled                │
│                                                               │
│  (after admin selects 1)                                      │
│   Selected: 1 of 1 required ✓                                 │
│              [ Advance to Top 3 ]  ← enabled                 │
└──────────────────────────────────────────────────────────────┘
```

---

### 10. Next Round — Waiting for Scores

**Flow**

- Admin clicks Top 5 in sidebar (after advancement)
- Sees the 5 advanced contestants with no scores yet
- Judges can now see and score Top 5 categories
- Same monitoring flow as Step 6 (Monitor Round Progress)

**Wireframe — Top 5 (Just Activated)**

```
┌──────────────────────────────────────────────────────────────┐
│ Round Results: Top 5                                         │
│                                                               │
│  Contestants advanced from Preliminary:                       │
│                                                               │
│  Rank  Contestant             Overall Score                   │
│  ────  ─────────────────────  ─────────────                   │
│    —   Lungcay, Keanna              —                         │
│    —   Palay, Roldan                —                         │
│    —   Badang, Ethel                —                         │
│    —   Tenorio, Sean                —                         │
│    —   Reyes, Julian                —                         │
│                                                               │
│  ⏳ Waiting for judges to submit scores...                    │
│                                                               │
│  [ Advance to Top 3 ]  ← disabled                            │
└──────────────────────────────────────────────────────────────┘
```

---

### 11. Declare Winners (Final Round)

**Flow**

- Admin views the final round (highest phase_order)
- All judges have submitted
- Sees final rankings
- Clicks "Declare Winners" → confirmation prompt → confirms
- Rankings are permanently locked
- Winners displayed with medal indicators

**Wireframe — Final Round Results**

```
┌──────────────────────────────────────────────────────────────┐
│ Round Results: Top 3                      ✅ All Submitted    │
│                                                               │
│  Final Rankings                                               │
│  ──────────────────────────────────────────                   │
│  🥇  Lungcay, Keanna              95.00                       │
│  🥈  Palay, Roldan                88.50                       │
│  🥉  Badang, Ethel                84.00                       │
│                                                               │
│         [ 🏆 Declare Winners ]                                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Judge Flows

### Layout — Judge Shell

```
┌────────────────────────────────────────────────────────────────┐
│  PTCI Judging Panel    Welcome, Judge 1          [ Logout ]    │
├───────────────────┬────────────────────────────────────────────┤
│ ▼ Preliminary     │                                            │
│    Swimwear        │   [ Scoring Content Area ]                │
│    Talent          │                                           │
│    Formal Wear     │                                           │
│    Production      │                                           │
│                    │                                           │
│ ▶ Top 5            │                                           │
│ ▶ Top 3            │                                           │
└───────────────────┴────────────────────────────────────────────┘
```

- No active round indicator — no status column exists to derive it from
- Rounds with contestants show interactive categories; rounds without contestants show "No contestants yet" when expanded
- Judge naturally knows which round is current by which categories are scoreable
- Sidebar polling refreshes every 10 seconds to detect newly advanced rounds

---

### 12. View and Score a Category

**Flow**

- Judge clicks a category under the current round (e.g., "Swimwear")
- System fetches:
  1. All contestants in the current round
  2. Scoring fields for this category (with max values)
  3. Any existing scores by this judge for this category
- If scores already exist → entire category is read-only, shows submitted values, no Submit All button
- If no scores → all inputs editable, Submit All button visible at the bottom
- Judge freely fills in and adjusts scores for all contestants — no per-contestant locking
- Judge reviews all scores → clicks Submit All
- Frontend sends one request: array of all contestant scores for this category
- Backend validates: all fields filled, values within 0–max, not already submitted
- Backend inserts all scores in a single transaction — all succeed or all fail
- On success → all inputs lock, values retained read-only, Submit All button hidden
- On error → inline error message shown, inputs remain editable for correction

**Wireframe — Scoring Grid (Swimwear, not yet submitted)**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Swimwear                                                              │
│ Preliminary Round                                                     │
│                                                                       │
│  Contestant           Stage(40)  Figure(30)  Poise(20)  Impact(10)   │
│  ─────────────────    ─────────  ──────────  ─────────  ──────────   │
│  Lungcay, Keanna      [  38  ]   [  27  ]    [  18  ]   [  9   ]     │
│  Palay, Roldan        [  35  ]   [  27  ]    [  17  ]   [  8   ]     │
│  Badang, Ethel        [  40  ]   [  29  ]    [  19  ]   [  9   ]     │
│  Tenorio, Sean        [  36  ]   [  25  ]    [  16  ]   [  8   ]     │
│  Reyes, Julian        [  33  ]   [  24  ]    [  15  ]   [  7   ]     │
│                                                                       │
│                                          [ Submit All ]  ← enabled   │
└──────────────────────────────────────────────────────────────────────┘
```

**Wireframe — Scoring Grid (Swimwear, already submitted)**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Swimwear                                          ✓ Submitted         │
│ Preliminary Round                                                     │
│                                                                       │
│  Contestant           Stage(40)  Figure(30)  Poise(20)  Impact(10)   │
│  ─────────────────    ─────────  ──────────  ─────────  ──────────   │
│  Lungcay, Keanna      [  38  ]   [  27  ]    [  18  ]   [  9   ]     │
│  Palay, Roldan        [  35  ]   [  27  ]    [  17  ]   [  8   ]     │
│  Badang, Ethel        [  40  ]   [  29  ]    [  19  ]   [  9   ]     │
│  Tenorio, Sean        [  36  ]   [  25  ]    [  16  ]   [  8   ]     │
│  Reyes, Julian        [  33  ]   [  24  ]    [  15  ]   [  7   ]     │
│                                                                       │
│  (all inputs read-only, no Submit All button)                         │
└──────────────────────────────────────────────────────────────────────┘
```

- Field shows max score as label: `Stage(40)` means max is 40
- Submitted category is visually distinct — greyed out inputs, ✓ Submitted label in header
- Validation error shown inline if any value exceeds max or is empty on Submit All

---

### 13. Inactive Round Clicked

**Flow**

- Judge clicks "Top 5" in sidebar (when Preliminary is still active)
- Top 5 expands to show its categories
- Judge clicks a category → sees "No data yet" message
- No scoring inputs are shown

**Wireframe — Inactive Round Category**

```
┌──────────────────────────────────────────────────────┐
│ Q&A Round                                            │
│ Top 5 Round  (not active yet)                        │
│                                                      │
│   No data yet. This round has not started.           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### 14. Round Switches (Preliminary → Top 5)

**Flow**

- Admin confirms advancement → contestants inserted into `round_contestants` for Top 5
- Judge's sidebar (on next 10s poll) reflects the change:
  - Preliminary remains collapsed and browsable (no label change)
  - Top 5 now has contestants → categories become interactive
- Judge clicks Top 5 category → sees only the 5 advanced contestants with blank score inputs
- Scoring proceeds as in Step 12

**Wireframe — Sidebar After Advancement**

```
┌───────────────────┐
│ ▶ Preliminary     │   ← past, collapsed, still viewable
│                   │
│ ▼ Top 5           │   ← has contestants, expanded, scoreable
│    Q&A Round      │   ← clickable
│                   │
│ ▶ Top 3           │   ← no contestants yet
└───────────────────┘
```

---

## Page & Route Map

| Route                         | Access   | Description                              |
| ----------------------------- | -------- | ---------------------------------------- |
| `/`                           | Public   | Redirects to `/login`                    |
| `/candidates`                 | Public   | Candidate photo grid                     |
| `/login`                      | Public   | Shared login page                        |
| `/admin/setup/rounds`         | Admin    | Create and manage rounds                 |
| `/admin/setup/categories`     | Admin    | Create categories and scoring fields     |
| `/admin/setup/contestants`    | Admin    | Add and manage contestants               |
| `/admin/setup/judges`         | Admin    | Add and manage judge accounts            |
| `/admin/live/results/:roundId`| Admin    | Round results, advancement, tie resolution |
| `/judge/scoring`              | Judge    | Scoring interface with sidebar and grid  |

---

**Doc map:** [[System Documentation]] (what & why) · **This page** (user journeys and wireframes)
