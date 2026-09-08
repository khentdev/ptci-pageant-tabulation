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

**Testing tie resolution from scratch:** the default seed pre-fills Top 3's pool as part of the "already declared" demo, which also marks Top 5 as already advanced (`isCompleted: true`) — so the tie among #103/#104/#105 never reaches the API. Use the `:tie` variant instead to leave Top 3 empty (categories still created) so Top 5 genuinely reports `hasTie: true`:

```bash
npm run seed:dev:tie
# or, first time:
npm run seed:all:tie
```

Then open **Top 5** in Admin Live Results, resolve the tie panel (pick 1 of #103/#104/#105), click Advance, and score Top 3 via the judge UI to continue on to Declare Winners.

**Testing Declare Winners without judge scoring:** if judge scoring isn't available yet, use the `:declare` variant instead — it fills and fully scores Top 3 directly (same #101/#102/#103 pool and score map as the default seed) but stops short of the direct `winnersDeclaredAt`/`RoundWinner` writes, so **Declare Winners is immediately clickable** through the real endpoint with no judge UI interaction needed:

```bash
npm run seed:dev:declare
# or, first time:
npm run seed:all:declare
```

Then open **Top 3** in Admin Live Results and click **Declare Winners**.

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
| **Top 5** | 3 | 5 | Default / `:declare` seed: `isCompleted: true` (already "advanced"). `seed:dev:tie`: **State 2b** — `hasTie: true`, `canAdvance: true` | Scores are always tied at the cutoff (#103/#104/#105); only the `:tie` variant leaves Top 3 unfilled so the tie actually surfaces — see below |
| **Top 3** | 4 | 3 | Default seed: **Final — declared** — `winnersDeclaredAt` set, podium rows. `seed:dev:declare`: pool filled (#101/#102/#103), fully scored, genuinely final, **not yet declared** — `canDeclareWinners: true`. `seed:dev:tie`: empty pool, categories ready, genuinely final (no round above it) | Default: all judges submitted, Declare hidden, use declared-winners GET for podium. `:declare`: click Declare Winners immediately, no judge scoring needed. `:tie`: advance into it from Top 5 to populate, then score + declare for real |
| **Spare Round** | 5 | 5 | **Default seed only** — N/A | Empty — **safe to delete**. Not created under `seed:dev:tie`/`seed:dev:declare` — its presence above Top 3 would make `nextRound` non-null and permanently block `canDeclareWinners` |
| **Advancement Only** | 6 | 2 | **Default seed only** — N/A | 2 contestants, no categories — delete → `ROUND_PHASE_HAS_CONTESTANTS`. Not created under `seed:dev:tie`/`seed:dev:declare`, same reason as Spare Round |

### Top 5 tie detail

Advancing to Top 3 (limit 3):

- **Auto-included:** #101 (95.00), #102 (92.00)
- **Tied at cutoff:** #103, #104, #105 (all 88.00) — admin picks exactly **1**
- `advancement.requiredSelections` = 1

**Note:** with the default `npm run seed:dev`, Top 3's pool is pre-filled (#101, #102, #103) as if advance from Top 5 already happened — this also makes Top 5 report `isCompleted: true`, so `hasTie` never surfaces even though the underlying scores are tied. Run `npm run seed:dev:tie` instead to leave Top 3's pool empty and test advance + tie resolution on **Top 5** from scratch.

### Top 3 declared winners (podium)

With the **default** seed, open **Top 3** in Admin Live Results after seed — `GET declared-winners` returns:

| Placement | Contestant # | Name | overallScore |
|-----------|--------------|------|--------------|
| 1 | 101 | Keanna Reyes | 95.00 |
| 2 | 102 | Marcus Lin | 88.00 |
| 3 | 103 | Sofia Mendoza | 82.00 |

To test **Declare Winners** through the real endpoint:

- **Fast path, no judge scoring needed:** run `npm run seed:dev:declare`, open **Top 3**, click **Declare Winners** directly — the pool is already filled and scored, just not yet declared.
- **Full path, exercises advance + scoring too:** run `npm run seed:dev:tie`, advance from **Top 5** (resolve the tie), then score Top 3 via judge UI or manual API before declaring.

Under both `--tie` and `--declare`, Top 3 is the only round above Top 5 (no Spare Round/Advancement Only), so it's genuinely the final round and `canDeclareWinners` becomes reachable once all judges submit.

---

## Error-toast cheat sheet

Reflects the **default** seed (`npm run seed:dev`). Under `seed:dev:tie`, Top 3 has no `RoundContestant`/scores yet, so its rows here won't apply until you advance into it manually. Under `seed:dev:declare`, Spare Round/Advancement Only don't exist, so their rows don't apply either.

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
| Top 3 | Evening Wear, Q&A (fields created either way; fully scored + winners declared under default seed, fully scored + undeclared under `seed:dev:declare`, unscored/empty pool under `seed:dev:tie`) |
| Spare / Advancement Only | none |
