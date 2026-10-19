# PTCI Pageant Tabulation System: IT Week Walkthrough Video (Production Guide + Voice-Over Script)

## Context
You asked for an IT Week walkthrough video script based on the real system, not the docs alone. The focus is the system's **flow and goal**, not CRUD details. Nothing in the repo gets modified. This file is the deliverable.

**What I inspected:** `docs/System Documentation.md`, `docs/scoring-criteria.md`, `Backend/prisma/seeds/SEED_REFERENCE.md`, `Backend/prisma/seeds/dev-simple.ts`, `Backend/src/features/judge_scoring_management/service.ts` (submit validation), `Backend/src/features/live_event_management/data.ts` (ranking, ties, advancement, declare), the frontend routes (`Frontend/src/router/**`), `views/admin/adminMain.vue`, `views/admin/live_event/liveEventMain.vue`, `components/admin/liveEvent/*`, `views/judge/*`, `components/judge/*`, `stores/.../judgeScoring.ts`, and `views/auth/loginViews.vue`.

---

## A. System Understanding

- **What it is:** a web app that handles scoring and tabulation for the PTCI "Ms & Mr. PTCI" intramurals pageant. It replaced an older PHP system.
- **Stack (verified):** Vue 3 + TypeScript + Tailwind (frontend), Hono + Prisma + PostgreSQL (backend). Sessions use JWT in HTTP-only cookies.
- **Problem it solves:** paper or spreadsheet tabulation is slow, easy to get wrong, and easy to dispute. Judges score on their own screens, the server does all the math, and ranking, advancement and winner declaration follow fixed rules.
- **Roles:**
  - **Admin**: does the Setup (Rounds, Categories, Contestants, Judges & Chairman), watches Live Event results, advances rounds and declares winners **when there is no tie**.
  - **Judge**: sees only the scoring panel and scores each category once.
  - **Chairman**: sees the same Live Event results as the Admin but has no Setup. The Chairman acts **only to resolve ties** (both the cutoff tie and the placement tie).
  - **Public**: the `/candidates` page needs no login.
- **Data model, briefly:** Round (phase order, contestant limit per gender) → Category (belongs to one round) → Criteria fields (max values must total exactly 100). Score = one row per judge × contestant × field. `RoundContestant` records who advanced into a round. `RoundWinner` is the official podium snapshot. `AuditLog` records advances and declarations.
- **Scoring formula (verified in `live_event_management/data.ts:153-193`):**
  1. **Judge's category score** = the plain sum of that judge's field scores. The field maxes total 100, so this score is out of 100. The max value *is* the weight, and there is no separate percentage.
  2. **Category average** = the mean of the category scores from the judges who submitted that category, rounded to 2 decimals.
  3. **Overall score** = the unweighted mean of the category averages, rounded to 2 decimals. **Every category in a round counts equally.**
  4. **Ranking** is done **separately for females and males**: overall score descending, with candidate number as the display tiebreak.
- **Score validation (frontend and backend):** every field for every contestant has to be filled in. Each value must be between **1** and the field's max, with up to 2 decimals. The submission is one transaction. Each judge can submit a category once, and after that it is locked and cannot be edited. A database unique constraint backs this up.
- **Advancement:** the next round's `contestantLimit` applies **per gender**. For example, "Top 5" means the top 5 females and the top 5 males. Advancing requires:
  - every judge has submitted every category in the round,
  - the next round has categories,
  - the next round has not been filled yet.

  If a tie (compared at 2 decimals) straddles the cutoff, only the Chairman can advance, by picking from the tied group.
- **Final round:** the round with the highest phase order shows **Declare Winners** instead. Declaring is irreversible. It produces a separate Ms. podium and Mr. podium. If two finalists of the same gender have equal scores, the Chairman has to set their placement order first.
- **Limitations to be honest about:**
  - No auto-refresh. The admin refreshes or re-opens the round to see new submissions.
  - Judges can't correct a score after submitting.
  - Categories can't be weighted differently from each other.
  - Results are computed on the fly from the scores table, not stored, except the declared podium.
  - Judges never see totals.

### Discrepancies between docs and code (code wins)
- Docs §4 say a field value can be "between 0 and max". **The code enforces 1 to max** (`judgeScoring.ts`, backend `SCORING_VALUE_OUT_OF_RANGE`).
- The docs list "Audit log page" and "Print/PDF export" as out of scope. **Both exist now:** there is a "Records → Audit Trail" page and an admin-only **Print** button (desktop only) on the results page.
- **Submit All has no confirmation dialog.** One click submits and locks the category. Keep this in mind while recording.
- I did not verify the public Candidates page's data source in detail, so the script only mentions it in passing.

---

## B. End-to-End Workflow

| # | Who | Action | Dependency |
|---|---|---|---|
| 1 | Admin | Log in. Admin and Chairman land on Live Event, judges land on the scoring panel. | Admin account seeded (`seed:admin`) |
| 2 | Admin | **Rounds**: Preliminary (phase 1, all contestants), then Top N rounds with a per-gender limit | Phase 1 has to exist before any later round |
| 3 | Admin | **Categories** per round, then **Fields** that total exactly 100 | Round exists |
| 4 | Admin | **Contestants** (number, name, gender, team) and **Judges & Chairman** accounts | — |
| 5 | Judge | Log in, open a round and category in the sidebar, fill the grid, click **Submit All** | Category has fields and the round has contestants |
| 6 | System | Validates, saves all scores in one transaction, locks the category for that judge | — |
| 7 | Admin | Opens the round under Live Event: Judge Submissions matrix plus per-gender Rankings | Refresh to see new data |
| 8 | System | Computes category averages, the overall score, per-gender rank and the cutoff/tie | Advance is enabled only when all judges have submitted |
| 9 | Admin (or Chairman if tied) | **Advance to [Next Round]**. The qualifiers are written into the next round. | Next round has categories and is empty |
| 10 | Judges | Refresh and score the new round. Only the advanced contestants appear. | — |
| 11 | Admin (or Chairman if tied) | Final round: **Declare Winners**. This locks the round and shows the Ms. and Mr. podiums. | All judges submitted |
| 12 | Admin/Chairman | **Audit Trail** shows who advanced or declared, when, and how any tie was resolved | — |

---

## C. Screen-Recording Checklist

Record in **three sessions** so you log in as few times as possible.

**Session 1: Admin, setup tour (data already seeded)**
- [ ] Start at `/auth/login` with the form empty
- [ ] Log in as admin. You land in Live Event.
- [ ] Sidebar → Setup → **Rounds** (show Preliminary / Top 5 / Top 3 with their limits)
- [ ] **Categories** → click **Fields** on one category → show the running total at 100 → close it without saving
- [ ] **Contestants** (scroll the list briefly)
- [ ] **Judges & Chairman** (show the judge and chairman accounts)
- [ ] Live Event → **Preliminary**: show "Not submitted" in Judge Submissions, `-` scores, and the advance helper text "All judges must submit their scores before advancing."

**Session 2: Judge (`judge.aya`)**
- [ ] Log in. You land on the judge scoring panel.
- [ ] Sidebar → **Preliminary** → **Swimwear**
- [ ] Type scores into the grid (pre-fill most of them off-camera, or speed up the footage)
- [ ] Click **Submit All**. You get a success toast, the inputs become read-only, and a "Submitted" label appears.
- [ ] *(Off-camera)* Submit every remaining Preliminary category for both judges.

**Session 3: Admin (and optionally Chairman), results through to winners**
- [ ] Live Event → **Preliminary**: refresh. Judge Submissions shows "Submitted" and the Rankings show Female and Male tables.
- [ ] Click **Advance to Top 5**. Show the success toast and the "This round has already been completed." note.
- [ ] *(Off-camera)* judges score Top 5. Admin advances to Top 3. Judges score Top 3.
- [ ] *(Optional tie scene)* log in as `chairman.diaz`, use the Tie Resolution checkboxes, then Advance
- [ ] Live Event → **Top 3** → **Declare Winners**. The podium (Placement column) appears.
- [ ] Records → **Audit Trail**
- [ ] End on the declared-winners view

---

## D. Complete Voice-Over Script
(about 950 words, roughly 6½–7 minutes at a relaxed pace)

**Scene 1: Opening, the problem**
**Website screen:** Login page (`/auth/login`), "PTCI Pageant Tabulation".
**What to do on screen:** Hold still. Optionally open with a slow zoom on the title.
**Voice-over:**
"Every intramurals pageant ends the same way. Judges hand in score sheets, someone adds everything up by hand or in a spreadsheet, and everyone waits, hoping no number was mistyped. One wrong total can change who goes to the next round. For this IT Week, we're presenting our answer to that problem: the PTCI Pageant Tabulation System. It's a web application where judges score digitally, the server does all the computation, and the results follow clear, consistent rules from the first round to the crowning of the winners."
**Editing notes:** Put the title card over the first 2 seconds.
**Transition:** Cut to typing in the credentials.

**Scene 2: Login and roles**
**Website screen:** Login page → admin Live Event view.
**What to do on screen:** Type the admin username and password, then click **Sign in**.
**Voice-over:**
"The system has three roles, and each one sees only what it needs. The Admin sets up the event and runs it live. Judges only see their scoring panel. The Chairman, who is the head judge, views the results and steps in only when there's a tie. There's no public sign-up. The admin creates every account, and after login the system sends each user to their own area automatically. Access is also checked on the server, not just hidden in the interface."
**Editing notes:** Blur the password field. Briefly highlight the "(Admin)" label in the navbar.
**Transition:** Move the cursor to the Setup section of the sidebar.

**Scene 3: Rounds, the structure of the competition**
**Website screen:** Setup → **Rounds**.
**What to do on screen:** Open Rounds and slowly pan across the table.
**Voice-over:**
"Before the pageant starts, the admin builds the structure of the competition. First come the rounds. Each round has a phase order, which tells the system the sequence. The first round, the Preliminary, automatically includes every contestant. Every round after that has a contestant limit, and this limit applies per gender. 'Top 5' means the top five Ms. candidates and the top five Mr. candidates, so a strong field in one division can never push the other division out."
**Editing notes:** Zoom on the phase order and limit columns.
**Transition:** Click **Categories**.

**Scene 4: Categories and the scoring criteria**
**Website screen:** Setup → **Categories** → the **Fields** modal of one category.
**What to do on screen:** Show the categories grouped by round. Open **Fields** on one category and point at the running total. Close the modal **without saving**.
**Voice-over:**
"Each round contains categories, like Swimwear or Evening Gown, and each category has its own scoring criteria. This is where the scoring formula starts. Every criterion has a maximum score, and all the maximums in a category have to add up to exactly one hundred. The system won't save the criteria until the total reads one hundred out of one hundred, and the server checks the total again. Because of this rule, the maximum score already acts as the weight. A criterion worth fifty points counts for half of the category."
**Editing notes:** Zoom on the "100 / 100" counter. Add a caption: "Criteria must total 100."
**Transition:** Quick cuts to Contestants, then Judges.

**Scene 5: Contestants and judges**
**Website screen:** Setup → **Contestants**, then **Judges & Chairman**.
**What to do on screen:** Scroll each list for about 3 seconds. Don't open any forms.
**Voice-over:**
"Next, the admin registers the contestants with their candidate number, name, gender and team, and creates the accounts for the judges and the chairman. Once scoring begins, records that already have scores are locked, so the setup can't be changed under the judges' feet in the middle of the event."
**Editing notes:** Keep this fast. It's context, not a feature demo.
**Transition:** "With the event configured, let's switch to a judge." Log out, then log in as the judge.

**Scene 6: The judge's scoring panel**
**Website screen:** Judge view (`/judge/scoring`) → sidebar **Preliminary** → **Swimwear**.
**What to do on screen:** Expand Preliminary and click a category.
**Voice-over:**
"This is what a judge sees. The sidebar lists the rounds, with each round's categories inside it. Opening a category loads a scoring grid with the contestants as rows and the criteria as columns, and each column shows its maximum score. The system knows exactly what each score belongs to: this judge, this contestant, and this specific criterion of this category. In the Preliminary every contestant appears. Later rounds only show the contestants who actually advanced."
**Editing notes:** Highlight one column header's max value.
**Transition:** Start typing scores.

**Scene 7: Submitting scores**
**Website screen:** The same scoring grid.
**What to do on screen:** Type a few scores (speed up the rest), then click **Submit All**. Hold on the read-only grid and the "Submitted" label.
**Voice-over:**
"The judge can fill in and change scores freely until they're ready. Every box has to be filled, and each score has to be between one and that criterion's maximum. The browser checks this first, and the server checks it again. Then one click on Submit All sends the whole category at once. The server saves it in a single transaction, so either every score is saved or none of them are. After that the category locks for this judge. The inputs become read-only so the judge can still review what they submitted, but a score can't be changed or submitted twice. Notice that the judge never sees totals or rankings, only their own inputs. That keeps the judging independent."
**Editing notes:** Caption: "Submit All = final." Pause 1–2 seconds on the success toast.
**Transition:** "Meanwhile, on the admin's side…" Cut to the admin results.

**Scene 8: Live results and how the score is computed**
**Website screen:** Admin → Live Event → **Preliminary** (after all judges have submitted).
**What to do on screen:** Refresh. Show Judge Submissions ("Submitted"), then scroll to the Rankings (Female and Male tables).
**Voice-over:**
"Back in the admin's live view, the top panel tracks every judge's submission, category by category, so the admin knows exactly who's still scoring. Below it are the rankings, and this is where the computation happens on the server. For each contestant, a judge's category score is simply the sum of their criteria, which gives a score out of one hundred. The system averages those across the judges to get the category average. Then the overall score is the average of all the category averages in the round, so every category counts equally. For example, if two judges give a contestant eighty-five and seventy-eight in Swimwear, the Swimwear average is eighty-one point five. The rankings are then sorted separately for the Ms. and Mr. divisions."
**Editing notes:** Show an on-screen formula card during the explanation: `Category score = Σ criteria` → `Category avg = mean across judges` → `Overall = mean of category averages`. Zoom on the Overall column.
**Transition:** Move to the Advance button.

**Scene 9: Advancing to the next round**
**Website screen:** The same page, bottom action area.
**What to do on screen:** Click **Advance to Top 5**. Show the toast and the "This round has already been completed." note.
**Voice-over:**
"The admin can only advance once every judge has submitted every category. Until then the button stays disabled and the page explains why. When the round is complete, one click moves the top contestants of each division into the next round, based on that round's limit. If two contestants were ever tied exactly at the cutoff, the system wouldn't guess. Only the Chairman could choose who moves on, and the server checks that choice again. The Preliminary results stay visible as a permanent record, and when the judges refresh, the new round appears with only the qualified contestants."
**Editing notes:** If you recorded the "disabled" state in Session 1, cut it in here for a second. The tie sentences play over the existing advance footage. Nothing extra needs to be shown.
**Transition:** "After the judges score each round, we reach the final."

**Scene 10: Not recorded (removed).** The tie rule is now covered by two sentences in Scene 9. The scene numbers stay the same so they still match your recorded clips.

**Scene 11: Declaring the winners**
**Website screen:** Admin → Live Event → **Top 3** (final round, all judges submitted).
**What to do on screen:** Click **Declare Winners** and hold on the resulting placement table.
**Voice-over:**
"In the final round, the advance button becomes Declare Winners. Declaring is permanent. It locks the round, so no more scores can be submitted, and saves an official snapshot of the podium for the Ms. and Mr. divisions separately. If two finalists of the same gender end with identical scores, the Chairman has to set their placement order first. The system never breaks a tie silently."
**Editing notes:** Pause 3 seconds on the podium. Optionally zoom on the 1st-place rows.
**Transition:** Click Audit Trail.

**Scene 12: Accountability**
**Website screen:** Records → **Audit Trail** (optionally the **Print** button on the results page first).
**What to do on screen:** Show the table: Action, Round, Performed By, Role, Tie Resolution, Date & Time.
**Voice-over:**
"Finally, every advancement and declaration is recorded in the audit trail: who did it, under what role, when, and how any tie was resolved. The admin can also print the official results directly from the results page."
**Editing notes:** Keep it short. The "Tie Resolution" column will be empty in your footage, which is expected because no tie occurred.
**Transition:** Fade back to the winners view or the title card.

**Scene 13: Closing**
**Website screen:** Declared-winners view, or the login page/title card.
**What to do on screen:** No interaction.
**Voice-over:**
"To sum it up: the admin builds the event, judges score independently on their own screens, and the server turns those scores into rankings, advancement and winners using one fixed, transparent formula. Ties go to the Chairman, and every key decision leaves a record. What used to take a stack of paper and a lot of waiting now takes a few clicks, with results the whole event can trust. This has been the PTCI Pageant Tabulation System. Thank you for watching."
**Editing notes:** End on the logo or title for 2–3 seconds.

---

## E. Final Video Structure
- **Opening (~30s):** Scenes 1–2. The problem, then the system and its roles.
- **Main walkthrough (~5–6 min):**
  - Setup: Scenes 3–5
  - Judging: Scenes 6–7
  - Tabulation: Scenes 8–9 (Scene 10 was not recorded)
  - Final: Scenes 11–12
- **Closing (~20s):** Scene 13.

---

## F. Recording Preparation
- **Environment:** run on a **local/dev database, never production.** The seed scripts wipe data.
- **Recommended seed:** `npm run seed:all:simple`, which runs `seed:admin` then `seed:dev:simple`, from `Backend/`. It **deletes all non-admin data** and creates a clean slate:
  - 12 contestants (#201–212, 6 F / 6 M)
  - Rounds Preliminary → Top 5 (5 per gender) → Top 3 (3 per gender), with 2 categories each and two 50-point fields per category
  - Judges `judge.aya` and `judge.ben`, plus chairman `chairman.diaz`
  - No scores, so the whole flow runs through the real UI
- **Logins:**
  - Admin: `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `Backend/.env`
  - Judges and chairman: `DEV_JUDGE_PASSWORD`, default `judge-dev-password`.
- **To show a tie (Scene 10):** when scoring Top 5, deliberately give the 3rd and 4th-ranked contestants of one gender identical totals from both judges, so they land exactly at the Top 3 cutoff.
- **Scoring is irreversible** (there's no confirmation and no undo). Plan your score values before you type them. If you make a mistake, re-run the seed and start over.
- **Workload:** each judge enters 12 contestants × 2 fields per Preliminary category. Record one category on camera and do the rest off-camera.
- **Recording order:**
  1. Admin setup tour plus the Preliminary "not submitted" state
  2. Judge scoring on camera for one category
  3. Off-camera: finish all Preliminary scoring
  4. Admin results and Advance
  5. Off-camera: Top 5 and Top 3 scoring (with an optional tie)
  6. Chairman tie resolution (optional)
  7. Admin Declare Winners and Audit Trail

  Use a separate browser profile or incognito window for each role so you don't have to keep logging out.
- **Shortcut for only the final scenes:** `npm run seed:all:declare` (via `dev.ts --declare`) seeds a fully scored, undeclared Top 3. You can click Declare Winners right away. This uses different data and has no chairman account.

---

## Phase 6 Quality Checks (done)
1. Every page, label and button in the script was checked against the source: Sign in, Setup (Rounds, Categories, Contestants, Judges & Chairman), Live Event, Judge Submissions, Rankings, Advance to [Next Round], Tie Resolution, Declare Winners, Submit All, Records → Audit Trail, Print.
2. The workflow order matches the backend gates (`canAdvance`, `canDeclareWinners`, `SCORING_ROUND_COMPLETED`, `SCORING_ROUND_LOCKED`).
3. The formula matches `data.ts:153-193` exactly: sum → mean across submitting judges → unweighted mean of categories, each rounded to 2 decimals.
4. Success is narrated only after a visible toast or state change. Results need a manual refresh, and the script shows that.
5. The admin and chairman split (tie versus no tie) matches `advanceRound` and the `liveEventMain.vue` role logic.
6. Unknowns are stated: candidates page details.

## Verification before recording
- Do a dry run of the full flow on the seeded local database, and confirm every button and label appears as the script says.
- Time the narration by reading it aloud. The target is 6–7 minutes, and you can trim Scene 5 or 10 if it runs long.
