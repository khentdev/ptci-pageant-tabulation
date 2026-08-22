**Last synced with codebase:** Aug 17, 2026
User flows and wireframes in plain English with ASCII layouts.
See [[System Documentation]] for business rules.

---

## Auth

### 1. Login

**Flow**

- User visits the app root `/` → redirected to `/login`
- User fills in username and password → submits
  - On invalid credentials → show "Invalid username or password", stay on page
  - On success (role = `admin`) → redirect to `/admin/live/results/:roundId` where `roundId` is the round with `phase_order = 1` (Preliminary)
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
│  Delete rejected by backend if round has categories or scores        │
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
- Admin clicks [ Fields ] on a category → fetch `GET /categories/:id/fields` → opens field editor; existing fields are pre-filled as editable rows; empty row shown if no fields yet
- Admin fills all fields in one form (field name + max score per row), adds rows with [ + Add Row ]
- Clicking [ Remove ] on a row removes it from the form UI only — no API call yet
- Running total updates live as admin types or removes rows; Save Fields button disabled until total === 100
- Admin clicks Save Fields → all fields submitted as a batch in one request; backend deletes all existing fields for this category and inserts the new batch in one transaction
- Validated server-side: total max_value must equal 100; rejected if not
- Guard: Save Fields is rejected if scores already exist for this category (fields are locked once judging begins)
- A category either has a complete set of fields (total = 100) or no fields — no partial states allowed in DB

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
│  ├── Swimwear      4 fields  ✓  [ Edit ] [ Fields ] [ Delete ]         │
│  ├── Talent        4 fields  ✓  [ Edit ] [ Fields ] [ Delete ]         │
│  ├── Formal Wear   4 fields  ✓  [ Edit ] [ Fields ] [ Delete ]         │
│  └── Production    No fields    [ Edit ] [ Fields ] [ Delete ]         │
│                                                                        │
│  TOP 5                                                                 │
│  └── Q&A Round     2 fields  ✓  [ Edit ] [ Fields ] [ Delete ]         │
│                                                                        │
│  TOP 3                                                                 │
│  └── Final Question 2 fields ✓  [ Edit ] [ Fields ] [ Delete ]         │
│                                                                        │
│  Edit and Delete rejected by backend if scores exist for that category │
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

**Wireframe — Category Field Editor (Batch Form)**

Admin fills all fields at once. Running total updates live. Save is disabled until total = 100.

```
┌──────────────────────────────────────────────────────┐
│ Swimwear — Scoring Fields                             │
│                                                       │
│  #   Field Name             Max Score   Actions       │
│  ─   ─────────────────────  ─────────   ───────       │
│  1   [ Stage Presence     ] [  40  ]    [ Remove ]    │
│  2   [ Figure & Fitness   ] [  30  ]    [ Remove ]    │
│  3   [ Poise & Bearing    ] [  20  ]    [ Remove ]    │
│  4   [ Overall Impact     ] [  10  ]    [ Remove ]    │
│                                                       │
│  [ + Add Row ]                                        │
│                                                       │
│  Total: 100 / 100  ✓                                  │
│                                                       │
│  [ Cancel ]              [ Save Fields ]  ← enabled   │
└──────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────┐
│ Swimwear — Scoring Fields                             │
│                                                       │
│  #   Field Name             Max Score   Actions       │
│  ─   ─────────────────────  ─────────   ───────       │
│  1   [ Stage Presence     ] [  40  ]    [ Remove ]    │
│  2   [ Figure & Fitness   ] [  30  ]    [ Remove ]    │
│  3   [ Poise & Bearing    ] [  20  ]    [ Remove ]    │
│                                                       │
│  [ + Add Row ]                                        │
│                                                       │
│  Total: 90 / 100  ⚠ Must equal 100                   │
│                                                       │
│  [ Cancel ]              [ Save Fields ]  ← disabled  │
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
┌──────────────────────────────────────────────────────────────────────┐
│ Contestants                                  [ + Add Contestant ]     │
│                                                                      │
│  Filter: [ All ]  [ Male ]  [ Female ]                               │
│                                                                      │
│  #    Name                 Gender   Team      Actions                │
│  ──   ─────────────────    ──────   ────      ───────────────────    │
│  1    Aniar, Andrea Mae    Female   Yellow    [ Edit ] [ Delete ]    │
│  2    Dela Cruz, Christine Female   Purple    [ Edit ] [ Delete ]    │
│  3    Delos Santos, Jona   Female   Purple    [ Edit ] [ Delete ]    │
│  ...                                                                 │
│                                                                      │
│  Delete rejected by backend if scores exist for that contestant      │
└──────────────────────────────────────────────────────────────────────┘
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

On page mount and manual refresh only (no auto-polling), frontend fetches round results once. Backend returns:

- `allJudgesSubmitted` — every judge has submitted every category in this round
- `isCompleted` — `true` after this round was advanced (next round has `round_contestants` rows). Hides Advance and tie UI; read-only history (State 3)
- `canAdvance` — gates the Advance button; `canAdvanceReason` when disabled (e.g. judges incomplete, next round already filled, next round has no categories)
- `judgeSubmissions` — frontend only paints ✓ / ✗ from this; it does not invent submitted state
- `rankings` — category averages + overall (`—` for categories with no submissions yet while judging is in progress)
- `advancement.included` — auto-included contestants (`id`, `name`, `overallScore`)
- `advancement.tied` — tied contestants to pick from (`id`, `name`, `overallScore`)
- `advancement.requiredSelections` — how many tied contestants must be selected
- `advancement.hasTie` — when `true`, show a tie-resolution panel **below** the full rankings table (do not replace or simplify the table)
- `nextRound` — `{ id, name, contestantLimit, categoryCount }`; `null` on final round

Frontend never computes the cutoff tie itself. **No tie:** Advance sends an empty body — backend picks top N. **Tie:** Advance sends `selectedContestantIds` for tied picks only; backend merges with `included`. Tie equality uses `overallScore` rounded to 2 decimal places. Checkbox selection stays in local state until Advance succeeds.

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
│ Rankings (partial — refresh page to update)                          │
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

Same as State 2 — full rankings table with all category columns stays visible. When `advancement.hasTie` is `true`, frontend renders an additional **Tie Resolution** block directly under the rankings table (inside the Rankings section). Data comes from `advancement.included`, `advancement.tied`, and `advancement.requiredSelections` — frontend does not compute the tie itself.

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
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ cutoff ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│    5   Reyes, Julian         80.00   83.00   81.00     79.00    80.75 │  ← tied
│    6   Dela Cruz, Christine  80.00   80.00   79.00     77.00    80.75 │  ← tied
│    7   Aniar, Andrea         80.00   77.00   76.00     74.00    80.75 │  ← tied
│   ...                                                                 │
│                                                                       │
│  ── Tie Resolution (shown only when advancement.hasTie) ───────────  │
│                                                                       │
│  ✅ Included in Top 5 — 4 of 5 spots filled:                         │
│    Lungcay, Keanna (93.00) · Palay, Roldan (89.75) ·                 │
│    Badang, Ethel (85.75) · Tenorio, Sean (82.75)                     │
│                                                                       │
│  ⚠️  Tie at cutoff — select 1 more to fill remaining spot:           │
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
│  ⚠️  Tie at cutoff — select 1 more to fill remaining spot:           │
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

See **§6 State 2** for layout. Flow summary:

- All judges submit → admin refreshes the page to see updated scores
- When `canAdvance` is `true` and `advancement.hasTie` is `false`, Advance button is enabled
- Admin reviews rankings → clicks "Advance to [Next Round Name]"
- Backend takes top N, inserts into `round_contestants` for next round (empty request body)
- Next round is now the current round (derived from data — has contestants, round after that has none)
- Preliminary page shows State 3 (`isCompleted`) on next refresh — read-only history
- Admin clicks next round in sidebar → sees State 4 transitioning to State 1 as judges score
- Judges' sidebar reflects the change on next page refresh

**Blocked:** If next round has no categories (`canAdvanceReason = NEXT_ROUND_NO_CATEGORIES`), Advance stays disabled with helper text — admin must add categories in Setup first.

---

### 9. Tie Resolution

See **§6 State 2b** for layout. Flow summary:

- Admin opens Round Results — page already shows rankings (refresh to update)
- If no tie at cutoff → Advance enabled when `canAdvance` is `true` (see §8)
- If tie straddles the cutoff → full rankings table stays; tie-resolution panel appears below it (see §6 State 2b)
- Admin selects the required number from the tied group (local checkbox state)
- Once selection count matches required spots → Advance enables
- Checking more than required is blocked (extra checkboxes disabled)
- Admin clicks Advance → backend merges auto-included + `selectedContestantIds` in one action
- No separate "Save" step; selection clears only after successful Advance

---

### 10. Next Round — Waiting for Scores

**Flow**

- Admin clicks Top 5 in sidebar (after advancement)
- Sees the 5 advanced contestants with no scores yet
- Judges can now see and score Top 5 categories
- Same monitoring flow as §6 (Round Results page — State 1 while judges score)

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

**Wireframe — Final Round Results (before declare)**

```
┌──────────────────────────────────────────────────────────────┐
│ Round Results: Top 3                      ✅ All Submitted    │
├──────────────────────────────────────────────────────────────┤
│ Judge Submissions + full Rankings table (same layout as §6)   │
│                                                               │
│  (tie-resolution panel below rankings if cutoff tie exists)   │
│                                                               │
│         [ 🏆 Declare Winners ]  ← no tie: enabled when canDeclareWinners; tie: disabled until tie picks complete │
└──────────────────────────────────────────────────────────────┘
```

**Wireframe — After Declare Winners**

```
┌──────────────────────────────────────────────────────────────┐
│ Round Results: Top 3                         ✓ Declared       │
│                                                               │
│  🥇  Lungcay, Keanna              95.00                       │
│  🥈  Palay, Roldan                88.50                       │
│  🥉  Badang, Ethel                84.00                       │
│                                                               │
│  (Declare button hidden — results locked)                     │
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
- Sidebar refetches on page refresh only — no auto-polling; judge refreshes to see newly advanced rounds
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
- Judge's sidebar (on next page refresh) reflects the change:
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

| Route                          | Access | Description                                                                 |
| ------------------------------ | ------ | --------------------------------------------------------------------------- |
| `/`                            | Public | Redirects to `/login`                                                       |
| `/candidates`                  | Public | Candidate photo grid                                                        |
| `/login`                       | Public | Shared login page                                                           |
| `/admin/setup/rounds`          | Admin  | Create and manage rounds                                                    |
| `/admin/setup/categories`      | Admin  | Create categories and scoring fields                                        |
| `/admin/setup/contestants`     | Admin  | Add and manage contestants                                                  |
| `/admin/setup/judges`          | Admin  | Add and manage judge accounts                                               |
| `/admin/live/results/:roundId` | Admin  | Round results, advancement, tie resolution                                  |
| `/judge/scoring`               | Judge  | Scoring interface — redirects to first available category                   |
| `/judge/scoring/:categoryId`   | Judge  | Scoring grid for a specific category; categoryId in URL persists on refresh |

---

**Doc map:** [[System Documentation]] (what & why) · **This page** (user journeys and wireframes)
