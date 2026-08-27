# Dev Seed Reference — PTCI Pageant 2026

Quick reference for frontend and manual testing after running the dev seed.

## How to run

On `feat/admin-live-results`, apply migrations first (includes `RoundWinner` table):

```bash
npm run db:dev
```

```bash
# First time (creates admin from .env)
npm run seed:admin

# Anytime — wipes non-admin data and inserts the full scenario
npm run seed:dev

# Both in sequence
npm run seed:all
```

**Warning:** `seed:dev` deletes all judges, contestants, rounds, categories, scores, and declared winners (`RoundWinner`). The admin account is preserved.

---

## Logins

| Role | Username | Password |
|------|----------|----------|
| Admin | `ADMIN_USERNAME` from `.env` | `ADMIN_PASSWORD` from `.env` |
| Judge (has scores — locked delete) | `judge.maria` | `DEV_JUDGE_PASSWORD` (default: `judge-dev-password`) |
| Judge (has scores — locked delete) | `judge.juan` | same |

**Judge delete (success):** Create a new judge via the admin UI first, then delete it — both seeded judges have scores and return `JUDGE_LOCKED`.

---

## Contestants (12)

| # | Name | Gender | Team | Scores? |
|---|------|--------|------|---------|
| 101–110 | See seed data | Mixed | Sining / Diwa / Lakas | Yes — locked edit/delete |
| 111 Chloe Ramos | FEMALE | Team Diwa | No — editable/deletable |
| 112 Daniel Ong | MALE | Team Lakas | No — editable/deletable |

---

## Rounds and live-event states

Round IDs vary after each seed — use `GET /rounds` or the seed log. Names are stable:

| Round | phaseOrder | Limit | Live-event state | Notes |
|-------|------------|-------|------------------|-------|
| **Preliminary** | 1 | unlimited | **State 3** — `isCompleted: true` | All judges submitted; already advanced top 10 |
| **Top 10** | 2 | 10 | **State 1** — `allJudgesSubmitted: false` | Maria done; Juan partial; limit locked |
| **Top 5** | 3 | 5 | **State 2b** — `hasTie: true`, `canAdvance: true` | Tie at cutoff advancing to Top 3 (pick 1 of 3 tied) |
| **Top 3** | 4 | 3 | **Final — declared** — `winnersDeclaredAt` set, podium rows | All judges submitted; Declare hidden; use declared-winners GET for podium |
| **Spare Round** | 5 | 5 | N/A | Empty — **safe to delete** |
| **Advancement Only** | 6 | 2 | N/A | 2 contestants, no categories — delete → `ROUND_PHASE_HAS_CONTESTANTS` |

### Top 5 tie detail

Advancing to Top 3 (limit 3):

- **Auto-included:** #101 (95.00), #102 (92.00)
- **Tied at cutoff:** #103, #104, #105 (all 88.00) — admin picks exactly **1**
- `advancement.requiredSelections` = 1

**Note:** Top 3 pool in seed is pre-filled (#101, #102, #103) as if advance from Top 5 already happened (tie pick #103). Use **Top 5** in the UI to test advance + tie resolution from scratch.

### Top 3 declared winners (podium)

Open **Top 3** in Admin Live Results after seed — `GET declared-winners` returns:

| Placement | Contestant # | Name | overallScore |
|-----------|--------------|------|--------------|
| 1 | 101 | Keanna Reyes | 95.00 |
| 2 | 102 | Marcus Lin | 88.00 |
| 3 | 103 | Sofia Mendoza | 82.00 |

To test **Declare Winners** flow from scratch: re-run `npm run seed:dev`, advance from **Top 5** (resolve tie), then score Top 3 via judge UI or manual API before declare.

---

## Error-toast cheat sheet

| Action | Target | Expected code |
|--------|--------|---------------|
| Delete round | Preliminary / Top 10 / Top 5 / Top 3 | `ROUND_PHASE_CATEGORY_LOCKED` |
| Delete round | Advancement Only | `ROUND_PHASE_HAS_CONTESTANTS` |
| Delete round | Spare Round | Success |
| Edit round limit | Top 10 | `ROUND_CONTESTANT_LIMIT_LOCKED` |
| Edit round limit | Top 3 | `ROUND_CONTESTANT_LIMIT_LOCKED` |
| Delete category | Preliminary Swimwear | `CATEGORY_LOCKED` |
| Delete category | Top 10 Q&A (empty) | Success |
| Edit category name | Preliminary Swimwear | `CATEGORY_LOCKED` |
| Edit category name | Top 10 Q&A | Success |
| Delete contestant | #111 or #112 | Success |
| Delete contestant | #101 | `CONTESTANT_LOCKED` |
| Delete judge | `judge.maria` | `JUDGE_LOCKED` |
| Delete judge | New judge created via UI | Success |

---

## Safe to delete during manual testing

Re-run `npm run seed:dev` to reset after experimenting (including after declare winners).

- **Spare Round** (entire round)
- **Top 10 → Q&A** category (empty, no fields)
- **Contestants #111, #112**

---

## Categories by round

| Round | Categories |
|-------|------------|
| Preliminary | Swimwear, Talent, Evening Gown (all with fields, scored) |
| Top 10 | Production Number, Formal Wear (scored, partial); Q&A (empty) |
| Top 5 | Swimwear, Talent (fully scored, tie scenario) |
| Top 3 | Evening Wear, Q&A (fields, fully scored; winners declared) |
| Spare / Advancement Only | none |
