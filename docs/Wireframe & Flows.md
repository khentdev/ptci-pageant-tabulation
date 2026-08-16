**Last synced with codebase:** Aug 10, 2026
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

**Edit Round Flow**

- Admin clicks [ Edit ] on a round row → fetch `GET /rounds/:id` to get current values + lock state
- Form renders based on `phaseOrder` and `isLimitLocked` from response:
  - `phaseOrder === 1` → contestant limit field is **hidden entirely** (phase 1 is always unlimited, frontend does not send it)
  - `phaseOrder > 1` and `isLimitLocked = false` → contestant limit field is editable
  - `phaseOrder > 1` and `isLimitLocked = true` → contestant limit field is read-only with ⚠ warning
- Name → always editable
- Phase Order → always read-only (displayed but cannot be changed)
- Admin saves → on success → list updates inline

**Wireframe — Rounds List**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Rounds                                             [ + Add Round ]   │
│                                                                      │
│  #   Name          Phase Order  Limit      Actions                   │
│  ─── ───────────── ───────────  ────────   ─────────────────────     │
│  1   Preliminary   1            Unlimited  [ Edit ]  [ Delete ]      │
│  2   Top 10        2            10         [ Edit ]  [ Delete ]      │
│  3   Top 5         3            5          [ Edit ]  [ Delete ]      │
│  4   Top 3         4            3          [ Edit ]  [ Delete ]      │
│                                                                      │
│  Delete disabled if round has categories or scores                   │
└──────────────────────────────────────────────────────────────────────┘
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

**Wireframe — Edit Round Form (Phase 1 — Preliminary)**

Contestant limit field is hidden entirely. Frontend omits it from the request.

```
┌──────────────────────────────────────────────────┐
│ Edit Round                                        │
│                                                   │
│  Round Name      [ Preliminary                  ] │
│  Phase Order     [ 1 ]  (read-only)               │
│  (no contestant limit field — always unlimited)   │
│                                                   │
│  [ Cancel ]                    [ Save Changes ]   │
└──────────────────────────────────────────────────┘
```

**Wireframe — Edit Round Form (Phase 2+ — limit editable)**

```
┌──────────────────────────────────────────────────┐
│ Edit Round                                        │
│                                                   │
│  Round Name      [ Top 5                        ] │
│  Phase Order     [ 3 ]  (read-only)               │
│  Contestant Limit[ 5                            ] │
│                                                   │
│  [ Cancel ]                    [ Save Changes ]   │
└──────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────┐
│ Edit Round                                        │
│                                                   │
│  Round Name      [ Top 5                        ] │
│  Phase Order     [ 3 ]  (read-only)               │
│  Contestant Limit[ 5 ]  (read-only)               │
│                  ⚠ Locked — contestants already   │
│                    advanced into this round       │
│                                                   │
│  [ Cancel ]                    [ Save Changes ]   │
└──────────────────────────────────────────────────┘
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

**Edit Category Flow**

- Admin clicks [ Edit ] on a category row → fetch `GET /categories/:id` to get current values + lock state
- Form renders based on `isLocked` from response:
  - `isLocked = false` → name field is editable
  - `isLocked = true` → name field is read-only with ⚠ warning
- Round → always read-only (category cannot be moved to a different round)
- Admin saves → on success → list updates

**Wireframe — Categories List**

```
┌────────────────────────────────────────────────────────────────────────┐
│ Categories                                     [ + Add Category ]      │
│                                                                        │
│  PRELIMINARY                                                           │
│  ├── Swimwear      4 fields  Total:100 ✓  [ Edit ] [ Fields ] [ Delete ]│
│  ├── Talent        4 fields  Total:100 ✓  [ Edit ] [ Fields ] [ Delete ]│
│  ├── Formal Wear   4 fields  Total:100 ✓  [ Edit ] [ Fields ] [ Delete ]│
│  └── Production    3 fields  Total: 80 ⚠  [ Edit ] [ Fields ] [ Delete ]│
│                                                                        │
│  TOP 5                                                                 │
│  └── Q&A Round     2 fields  Total:100 ✓  [ Edit ] [ Fields ] [ Delete ]│
│                                                                        │
│  TOP 3                                                                 │
│  └── Final Question 2 fields Total:100 ✓  [ Edit ] [ Fields ] [ Delete ]│
│                                                                        │
│  Edit and Delete disabled if scores already exist for that category    │
└────────────────────────────────────────────────────────────────────────┘
```

**Wireframe — Add Category Form**

```
┌──────────────────────────────────────────────────┐
│ Add Category                                      │
│                                                   │
│  Round     [ Preliminary ▼ ]                      │
│  Name      [ Swimwear       ]                     │
│                                                   │
│  [ Cancel ]                   [ Save Category ]   │
└──────────────────────────────────────────────────┘
```

**Wireframe — Edit Category Form**

```
┌──────────────────────────────────────────────────┐
│ Edit Category                                     │
│                                                   │
│  Round     [ Preliminary ]  (read-only)           │
│  Name      [ Swimwear     ]                       │
│                                                   │
│  [ Cancel ]                   [ Save Changes ]    │
└──────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────┐
│ Edit Category                                     │
│                                                   │
│  Round     [ Preliminary ]  (read-only)           │
│  Name      [ Swimwear    ]  (read-only)           │
│            ⚠ Locked — scores already submitted    │
│              for this category                    │
│                                                   │
│  [ Cancel ]                                       │
└──────────────────────────────────────────────────┘
```

**Wireframe — Category Field Editor**

```
┌──────────────────────────────────────────────────────┐
│ Swimwear — Scoring Fields                             │
│                                                       │
│  #   Field Name             Max Score   Actions       │
│  ─   ─────────────────────  ─────────   ───────       │
│  1   Stage Presence         40          [ Delete ]    │
│  2   Figure & Fitness       30          [ Delete ]    │
│  3   Poise & Bearing        20          [ Delete ]    │
│  4   Overall Impact         10          [ Delete ]    │
│                                                       │
│  Running Total: 100 / 100  ✓                          │
│                                                       │
│  [ + Add Field ]                                      │
└──────────────────────────────────────────────────────┘
```

---

### 4. Add Contestant

**Flow**

- Admin navigates to Setup → Contestants
- Views list filterable by gender (All / Male / Female)
- Clicks "Add Contestant" → fills form
- On success → contestant appears in list

**Edit Contestant Flow**

- Admin clicks [ Edit ] on a contestant row → edit form opens prefilled
- All fields editable if no scores exist; all read-only with note if locked
- On success → list updates

**Wireframe — Contestants List**

```
┌──────────────────────────────────────────────────────────────┐
│ Contestants                          [ + Add Contestant ]     │
│                                                              │
│  Filter: [ All ]  [ Male ]  [ Female ]                       │
│                                                              │
│  #    Name                 Gender   Team      Actions        │
│  ──   ─────────────────    ──────   ────      ───────        │
│  1    Aniar, Andrea Mae    Female   Yellow    [ Edit ]       │
│  2    Dela Cruz, Christine Female   Purple    [ Edit ]       │
│  3    Delos Santos, Jona   Female   Purple    [ Edit ]       │
│  ...                                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Wireframe — Add Contestant Form**

```
┌──────────────────────────────────────────────────┐
│ Add Contestant                                    │
│                                                   │
│  Candidate No.  [ 1              ]                │
│  Name           [ Aniar, Andrea  ]                │
│  Gender         [ Female ▼       ]                │
│  Team Name      [ Yellow Team    ]                │
│  Team Color     [ Yellow         ]                │
│                                                   │
│  [ Cancel ]               [ Save Contestant ]     │
└──────────────────────────────────────────────────┘
```

**Wireframe — Edit Contestant Form**

```
┌──────────────────────────────────────────────────┐
│ Edit Contestant                                   │
│                                                   │
│  Candidate No.  [ 1              ]                │
│  Name           [ Aniar, Andrea  ]                │
│  Gender         [ Female ▼       ]                │
│  Team Name      [ Yellow Team    ]                │
│  Team Color     [ Yellow         ]                │
│                                                   │
│  [ Cancel ]               [ Save Changes ]        │
└──────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────┐
│ Edit Contestant                                   │
│                                                   │
│  Candidate No.  [ 1 ]  (read-only)                │
│  Name           [ Aniar, Andrea ]  (read-only)    │
│  Gender         [ Female ]  (read-only)           │
│  Team Name      [ Yellow Team ]  (read-only)      │
│  Team Color     [ Yellow ]  (read-only)           │
│  ⚠ Locked — scores already exist for this        │
│    contestant                                     │
│                                                   │
│  [ Close ]                                        │
└──────────────────────────────────────────────────┘
```

---

### 5. Add Judge

**Flow**

- Admin navigates to Setup → Judges
- Clicks "Add Judge" → fills name, username, password
- On success → judge appears in list; judge can now log in

**Wireframe — Judges List**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Judges                                             [ + Add Judge ]    │
│                                                                      │
│  Name       Username   Actions                                        │
│  ────────   ────────   ──────────────────────────────────────────    │
│  Judge 1    judge1     [ Edit ] [ Reset Password ] [ Delete ]         │
│  Judge 2    judge2     [ Edit ] [ Reset Password ] [ Delete ]         │
│  Judge 3    judge3     [ Edit ] [ Reset Password ] [ Delete ]         │
│                                                                      │
│  Delete rejected by backend if judge has submitted scores             │
└──────────────────────────────────────────────────────────────────────┘
```

**Wireframe — Add Judge Form**

```
┌──────────────────────────────────────────────────┐
│ Add Judge                                         │
│                                                   │
│  Name       [ Judge 1   ]                         │
│  Username   [ judge1    ]                         │
│  Password   [ ········  ]                         │
│                                                   │
│  [ Cancel ]                    [ Save Judge ]     │
└──────────────────────────────────────────────────┘
```

**Wireframe — Edit Judge Form**

```
┌──────────────────────────────────────────────────┐
│ Edit Judge                                        │
│                                                   │
│  Name       [ Judge 1   ]                         │
│  Username   [ judge1    ]                         │
│                                                   │
│  [ Cancel ]                  [ Save Changes ]     │
└──────────────────────────────────────────────────┘
```

**Wireframe — Reset Password Modal**

```
┌──────────────────────────────────────────────────┐
│ Reset Password — Judge 1                          │
│                                                   │
│  New Password   [ ········  ]                     │
│                                                   │
│  [ Cancel ]                 [ Reset Password ]    │
└──────────────────────────────────────────────────┘
```

---

## Admin — Live Event Flows

### 6. Round Results Page — Full Layout

Each round in the Live Event sidebar has its own page. The page always has two sections stacked vertically: **Judge Submissions** on top, **Rankings** below. Both are always visible — rankings show partial results as judges submit.

**State 1 — In Progress (some judges still scoring)**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Round Results: Preliminary                                            │
├──────────────────────────────────────────────────────────────────────┤
│ Judge Submissions                                                     │
│ ───────────────────────────────────────────────────────────────────  │
│  Judge    Swimwear   Talent   Formal Wear   Production   Done?        │
│  ──────   ────────   ──────   ──────────    ──────────   ─────        │
│  Judge 1     ✓          ✓         ✓              ✓         ✓          │
│  Judge 2     ✓          ✓         ✓              ✗         ✗          │
│  Judge 3     ✗          ✗         ✗              ✗         ✗          │
│                                                                       │
│  2 of 3 judges fully submitted                                        │
├──────────────────────────────────────────────────────────────────────┤
│ Rankings (partial — updates as judges submit)                         │
│ ───────────────────────────────────────────────────────────────────  │
│  Rank  Contestant          Swimwear  Talent  Formal  Production Overall│
│  ────  ─────────────────   ────────  ──────  ──────  ──────────  ─────│
│    1   Lungcay, Keanna       91.00   97.00     —         —       94.00│
│    2   Palay, Roldan         88.00   94.00     —         —       91.00│
│    3   Badang, Ethel         85.00     —       —         —         —  │
│   ...  (— means no scores yet for that category)                     │
│                                                                       │
│  [ Advance to Top 5 ]   ← disabled (not all judges submitted)        │
└──────────────────────────────────────────────────────────────────────┘
```

---

**State 2 — All Submitted, No Tie**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Round Results: Preliminary                        ✅ All Submitted    │
├──────────────────────────────────────────────────────────────────────┤
│ Judge Submissions                                                     │
│  Judge 1     ✓    ✓    ✓    ✓    ✓                                   │
│  Judge 2     ✓    ✓    ✓    ✓    ✓                                   │
│  Judge 3     ✓    ✓    ✓    ✓    ✓                                   │
│  3 of 3 judges fully submitted                                        │
├──────────────────────────────────────────────────────────────────────┤
│ Rankings                                                              │
│  Rank  Contestant          Swimwear  Talent  Formal  Production Overall│
│  ────  ─────────────────   ────────  ──────  ──────  ──────────  ─────│
│    1   Lungcay, Keanna       92.00   97.00   93.00     90.00    93.00 │
│    2   Palay, Roldan         88.00   94.00   90.00     87.00    89.75 │
│    3   Badang, Ethel         85.00   88.00   86.00     84.00    85.75 │
│    4   Tenorio, Sean         82.00   85.00   83.00     81.00    82.75 │
│    5   Reyes, Julian         80.00   83.00   81.00     79.00    80.75 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ cutoff ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│    6   Dela Cruz, Christine  78.00   80.00   79.00     77.00    78.50 │
│    7   Aniar, Andrea         75.00   77.00   76.00     74.00    75.50 │
│   ...                                                                 │
│                                                                       │
│              [ Advance to Top 5 ]  ← enabled                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

**State 2b — All Submitted, Tie at Cutoff**

Same layout as State 2 — Judge Submissions on top, Rankings below. The Rankings section splits into two parts when a tie is detected.

```
┌──────────────────────────────────────────────────────────────────────┐
│ Round Results: Preliminary                        ✅ All Submitted    │
├──────────────────────────────────────────────────────────────────────┤
│ Judge Submissions                                                     │
│  Judge 1     ✓    ✓    ✓    ✓    ✓                                   │
│  Judge 2     ✓    ✓    ✓    ✓    ✓                                   │
│  Judge 3     ✓    ✓    ✓    ✓    ✓                                   │
│  3 of 3 judges fully submitted                                        │
├──────────────────────────────────────────────────────────────────────┤
│ Rankings                                                              │
│                                                                       │
│  ✅ Included in Top 5 — 4 of 5 spots filled:                         │
│  Rank  Contestant          Overall                                    │
│    1   Lungcay, Keanna      93.00                                     │
│    2   Palay, Roldan        89.75                                     │
│    3   Badang, Ethel        85.75                                     │
│    4   Tenorio, Sean        82.75                                     │
│                                                                       │
│  ⚠️  Tie — select 1 more to fill remaining spot:                     │
│   [ ]  Reyes, Julian        80.75                                     │
│   [ ]  Dela Cruz, Christine 80.75                                     │
│   [ ]  Aniar, Andrea        80.75                                     │
│                                                                       │
│   Selected: 0 of 1 required                                           │
│                                                                       │
│              [ Advance to Top 5 ]  ← disabled until 1 selected       │
└──────────────────────────────────────────────────────────────────────┘
```

After admin selects 1:

```
│   [✓]  Reyes, Julian        80.75   ← selected                       │
│   [ ]  Dela Cruz, Christine 80.75   ← disabled (max reached)         │
│   [ ]  Aniar, Andrea        80.75   ← disabled (max reached)         │
│                                                                       │
│   Selected: 1 of 1 required ✓                                         │
│              [ Advance to Top 5 ]  ← enabled                         │
```

---

**State 3 — Past Round (already advanced, read-only history)**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Round Results: Preliminary                           ✓ Completed      │
├──────────────────────────────────────────────────────────────────────┤
│ Judge Submissions                                                     │
│  Judge 1     ✓    ✓    ✓    ✓    ✓                                   │
│  Judge 2     ✓    ✓    ✓    ✓    ✓                                   │
│  Judge 3     ✓    ✓    ✓    ✓    ✓                                   │
├──────────────────────────────────────────────────────────────────────┤
│ Final Rankings                                                        │
│  Rank  Contestant          Swimwear  Talent  Formal  Production Overall│
│    1   Lungcay, Keanna       92.00   97.00   93.00     90.00    93.00 │
│    2   Palay, Roldan         88.00   94.00   90.00     87.00    89.75 │
│   ...                                                                 │
│                                                                       │
│  (no advance button — this round is completed)                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

**State 4 — Top N Round, No Contestants Yet**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Round Results: Top 5                                                  │
│                                                                       │
│  No contestants yet.                                                  │
│  Advance contestants from the previous round to begin scoring.        │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 8. View Results & Advance (No Tie)

**Flow**

- All judges submit → page auto-refreshes (or admin refreshes)
- Advance button becomes enabled
- System shows ranked contestants with computed overall scores and cutoff line
- Admin reviews rankings → clicks "Advance to Top 5"
- System takes top 5, inserts into `round_contestants` for Top 5 round
- Top 5 is now the current round (derived from data — has contestants, next round has none)
- Preliminary page shows State 3 (read-only history)
- Admin clicks Top 5 in sidebar → sees State 4 transitioning to State 1 as judges score
- Judges' sidebar reflects the change on next poll

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
- Active category is highlighted in the sidebar based on the current URL `categoryId` param
- On page refresh, the `categoryId` in the URL is read on load and the correct category is fetched and highlighted automatically
- `/judge/scoring` with no categoryId redirects to or loads the first available category by default

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
| `/judge/scoring`              | Judge    | Scoring interface — redirects to first available category |
| `/judge/scoring/:categoryId`  | Judge    | Scoring grid for a specific category; categoryId in URL persists on refresh |

---

**Doc map:** [[System Documentation]] (what & why) · **This page** (user journeys and wireframes)
