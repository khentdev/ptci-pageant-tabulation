# Get Round Results (Rankings & Advancement)

`GET /live-event/round-results/:id/advancement`

Admin only.

Returns **rankings**, advancement preview, and round-state flags for one round. Used for the Rankings section, Advance button, tie-resolution panel, and Declare Winners on the Admin Live Event → Round Results page.

**Advancement is computed independently per gender.** `rankings`, `advancement.included`, and `advancement.tied` are flat arrays covering both genders together, but rank numbering, the cutoff, and tie detection all restart per gender — a round's `contestantLimit` is applied once to females and once to males, not to the combined pool. See "Rule" table below and [[System Documentation]] §3.2.

**Read-only.** Confirming advancement is a separate POST — see [[live-event/live-round-advance]] (`POST /live-event/round-results/:id/advancement`). Declaring winners on the final round is [[live-event/live-round-declare-winners]] (`POST /live-event/round-results/:id/declare-winners`). Official podium after declare is [[live-event/live-round-declared-winners]] (`GET /live-event/round-results/:id/declared-winners`).

**Does not include** `judgeSubmissions` or `declaredWinners` — fetch judge matrix via [[live-event/live-judge-submissions]] (`GET /live-event/round-results/:id`); fetch podium via [[live-event/live-round-declared-winners]] when `winnersDeclaredAt` is set.

**Related docs:** [[live-event/live-results-sidebar]] (sidebar navigation) · [[live-event/live-judge-submissions]] (judge matrix) · [[live-event/live-round-declared-winners]] (podium) · [[Wireframe & Flows]] §6 (Rankings UI) · [[System Documentation]] §3.2 (business rules)

## Consumers

- Admin Live Event → Round Results page — **Rankings** table, Advance button, tie-resolution panel, Declare Winners

## When to fetch

| Trigger | Fetch? |
|---------|--------|
| Round Results page mount (`route.params.roundId` set) | Yes |
| Full page refresh on Round Results page | Yes |
| Sidebar round click (same page, new `roundId`) | Yes — refetch for the new round |
| Auto-polling | No |

Fetch alongside [[live-event/live-judge-submissions]] on mount / refresh / round change. When `winnersDeclaredAt` is set (or after Declare POST), also fetch [[live-event/live-round-declared-winners]] for the podium — three GETs total, not merged client-side.

## Request

**Headers** *(frontend sets explicitly)*

| Header          | Required | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `X-CSRF-Token`  | Yes      | Value from `csrfToken` cookie                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `X-Fingerprint` | Yes      | JSON string, non-empty object e.g. `{"X-Fingerprint":"{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"}` |

**Cookies** *(auto-sent by browser with `credentials: 'include'`)*

| Cookie | Required | Notes |
|--------|----------|-------|
| `sid` | Yes | Session cookie — browser sends automatically |
| `csrfToken` | Yes | Browser sends automatically; frontend reads value for `X-CSRF-Token` header |

**Path params**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | Yes | Round ID — positive whole number (same as sidebar `data[].id` / `route.params.roundId`) |

## Response

**200**

```json
{
  "data": {
    "rankings": [
      {
        "contestant": {
          "id": 1,
          "candidateNumber": 101,
          "name": "Keanna",
          "gender": "FEMALE"
        },
        "categories": [
          {
            "id": 10,
            "name": "Swimwear",
            "avgScore": 89
          },
          {
            "id": 11,
            "name": "Talent",
            "avgScore": 97
          }
        ],
        "overallScore": 93,
        "rank": 1
      }
    ],
    "allJudgesSubmitted": false,
    "isCompleted": false,
    "canAdvance": false,
    "canAdvanceReason": "JUDGES_NOT_COMPLETE",
    "canDeclareWinners": false,
    "winnersDeclaredAt": null,
    "nextRound": {
      "id": 2,
      "name": "Top 5",
      "contestantLimit": 5,
      "categoryCount": 4
    },
    "advancement": {
      "hasTie": false,
      "requiredSelections": 0,
      "included": [],
      "tied": []
    },
    "placementTies": []
  },
  "message": "Round results fetched successfully"
}
```

| Field                                 | Type                       | Notes                                                                                                                                                                     |
| ------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                                | `GetRoundResultsDTO`       | Rankings and round-state flags for the requested round                                                                                                                    |
| `data.rankings`                       | `RankingRow[]`             | One row per contestant in the round's contestant pool. Grouped by gender (FEMALE rows first, then MALE — matching the judge-scoring contestant list), each group sorted by `overallScore` descending with `null` overall scores last and ties broken by `candidateNumber` ascending        |
| `data.allJudgesSubmitted`             | `boolean`                  | `true` when every judge has submitted every category in this round. `false` when zero judges. Vacuously `true` when the round has zero categories but judges exist        |
| `data.isCompleted`                    | `boolean`                  | `true` when the next round already has rows in `round_contestants` (this round was advanced). Page is read-only history (Wireframe State 3)                               |
| `data.canAdvance`                     | `boolean`                  | `true` only when Advance is allowed. `canAdvance` may be `true` while `advancement.hasTie` is `true` — frontend disables Advance until tie selections match               |
| `data.canAdvanceReason`               | `CanAdvanceReason \| null` | When `canAdvance` is `false`, code for disabled helper text. `null` when `canAdvance` is `true`, or on the final round                                                    |
| `data.canDeclareWinners`              | `boolean`                  | Final round only. `true` when all judges submitted, no cutoff tie, and winners not yet declared                                                                           |
| `data.winnersDeclaredAt`              | `string \| null`           | ISO timestamp when winners were declared on the final round; `null` otherwise                                                                                             |
| `data.nextRound`                      | `NextRoundSummary \| null` | Next round metadata. `null` on the final round                                                                                                                            |
| `data.advancement`                    | `AdvancementPreview`       | Advancement preview — populated only when `allJudgesSubmitted` is `true`, `isCompleted` is `false`, current round has categories, and a positive advancement limit exists |
| `data.advancement.hasTie`             | `boolean`                  | `true` when either gender has tied contestants straddling its cutoff (Wireframe State 2b)                                                                                 |
| `data.advancement.requiredSelections` | `number`                   | Total tied contestants admin must pick across both genders (sum of each gender's `N - included.length`). `0` when no tie                                                 |
| `data.advancement.included`         | `AdvancementContestant[]`  | Contestants above the cutoff who advance automatically — computed per gender, then combined into one array                                                                |
| `data.advancement.tied`             | `AdvancementContestant[]`  | Tied contestants at the cutoff for admin selection — may contain one gender's tie, the other's, or both at once; each entry's `gender` says which group it belongs to    |
| `data.placementTies`                  | `PlacementTieCluster[]`    | Same-gender contestants in the already-decided winner set who share an identical `overallScore` — their relative finish order (1st vs 2nd, etc.) is ambiguous and must be resolved by the admin. Only populated on the final round, and only once `advancement.hasTie` is `false` (a cutoff tie must be resolved first). Empty otherwise |
| `message`                             | `string`                   | Success message                                                                                                                                                           |

### Types

**`GetRoundResultsDTO`**

| Field                | Type                       | Notes                                        |
| -------------------- | -------------------------- | -------------------------------------------- |
| `rankings`           | `RankingRow[]`             | Rankings table rows                          |
| `allJudgesSubmitted` | `boolean`                  | All judges finished scoring                  |
| `isCompleted`        | `boolean`                  | Round already advanced                       |
| `canAdvance`         | `boolean`                  | Advance button allowed                       |
| `canAdvanceReason`   | `CanAdvanceReason \| null` | Disabled reason when `canAdvance` is `false` |
| `canDeclareWinners`  | `boolean`                  | Declare Winners button allowed (final round) |
| `winnersDeclaredAt`  | `string \| null`           | ISO timestamp when winners declared          |
| `nextRound`          | `NextRoundSummary \| null` | Next round metadata                          |
| `advancement`        | `AdvancementPreview`       | Advancement preview                          |
| `placementTies`      | `PlacementTieCluster[]`    | Placement ties among the final-round winner set awaiting admin resolution |

**`RankingRow`**

| Field           | Type                       | Notes |
| --------------- | -------------------------- | ----- |
| `contestant`    | `RankingContestant`        | Contestant identity for the row |
| `categories`    | `RankingCategoryScore[]`   | One column per category in this round. Ordered by category `name` ascending |
| `overallScore`  | `number \| null`           | Average of non-null category averages. `null` when no category has a score. Rounded to 2 decimal places |
| `rank`          | `number \| null`           | `1..N` by `overallScore` descending; `null` when `overallScore` is `null` |

**`RankingContestant`**

| Field              | Type                 | Notes |
| ------------------ | -------------------- | ----- |
| `id`               | `number`             | Contestant ID |
| `candidateNumber`  | `number`             | Display number |
| `name`             | `string`             | Display name |
| `gender`           | `"MALE" \| "FEMALE"` | Which per-gender ranking/advancement group this row belongs to |

**`RankingCategoryScore`**

| Field       | Type               | Notes |
| ----------- | ------------------ | ----- |
| `id`        | `number`           | Category ID |
| `name`      | `string`           | Category name (column header) |
| `avgScore`  | `number \| null`   | Average of judges who submitted for this contestant in this category. `null` → render `—` in UI. Rounded to 2 decimal places |

**`NextRoundSummary`**

| Field               | Type               | Notes |
| ------------------- | ------------------ | ----- |
| `id`                | `number`           | Next round ID |
| `name`              | `string`           | Next round name (Advance button label) |
| `contestantLimit`   | `number \| null`   | How many contestants advance into the next round **per gender** (e.g. `5` advances up to 5 females and up to 5 males — up to 10 total) |
| `categoryCount`     | `number`           | Number of categories configured on the next round |

**`AdvancementPreview`**

Cutoff and tie detection run independently per gender against the same `contestantLimit`, then the two groups' results are combined into these flat arrays/flags.

| Field                 | Type                      | Notes |
| --------------------- | ------------------------- | ----- |
| `hasTie`              | `boolean`                 | `true` when either gender's tied contestants straddle its cutoff |
| `requiredSelections`  | `number`                  | Sum of each gender's `N - included.length`. `0` when neither gender has a tie |
| `included`            | `AdvancementContestant[]` | Contestants above the cutoff who advance automatically, both genders combined |
| `tied`                | `AdvancementContestant[]` | Tied contestants for admin selection, both genders combined — filter by `gender` to render separate tie panels |

**`AdvancementContestant`**

| Field            | Type                 | Notes |
| ---------------- | -------------------- | ----- |
| `id`             | `number`             | Contestant ID |
| `name`           | `string`             | Contestant name |
| `gender`         | `"MALE" \| "FEMALE"` | Which gender's cutoff this contestant was evaluated against |
| `overallScore`   | `number`             | Overall score (2 dp) |

**`PlacementTieCluster`**

One entry per group of 2+ same-gender contestants sharing an identical `overallScore` in the final-round winner set.

| Field          | Type                       | Notes |
| -------------- | --------------------------- | ----- |
| `gender`       | `"MALE" \| "FEMALE"`        | Which gender's placement this cluster affects |
| `contestants`  | `AdvancementContestant[]`   | The tied contestants, unordered — the admin decides their finish order via `placementOrder` on [[live-event/live-round-declare-winners]] |

**`CanAdvanceReason`**

`"ROUND_COMPLETED" | "JUDGES_NOT_COMPLETE" | "CURRENT_ROUND_NO_CATEGORIES" | "NEXT_ROUND_ALREADY_FILLED" | "NEXT_ROUND_NO_CATEGORIES"`

| Rule | Behavior |
|------|----------|
| Partial averages (State 1) | Only judges who submitted count toward each category average. Categories with no submissions → `avgScore: null` → UI `—` |
| Overall score | Average of non-null category averages only |
| Contestant pool — Preliminary (`phaseOrder = 1`) | All contestants |
| Contestant pool — Top N (`phaseOrder > 1`) | Only `round_contestants` for that round |
| Score math | Sum criteria fields per judge per category → average across judges per category → average across categories → overall |
| Sort / rank | Computed **per gender**: higher `overallScore` ranks first within that gender; tie on overall breaks by `candidateNumber` ascending; `null` overall → `rank: null`, sorted last. `rank` restarts at 1 for each gender |
| Advancement cutoff | Computed **per gender** against the same `contestantLimit` — e.g. a limit of 5 advances the top 5 females and the top 5 males independently, not the top 5 overall |

### `canAdvanceReason` codes

| Code | When |
|------|------|
| `ROUND_COMPLETED` | `isCompleted` is `true` — round already advanced |
| `JUDGES_NOT_COMPLETE` | Not all judges finished scoring |
| `CURRENT_ROUND_NO_CATEGORIES` | Current round has zero categories |
| `NEXT_ROUND_ALREADY_FILLED` | Next round already has contestants *(same DB state as `ROUND_COMPLETED`; `ROUND_COMPLETED` takes precedence in response)* |
| `NEXT_ROUND_NO_CATEGORIES` | Next round missing, has zero categories, or has null/zero `contestantLimit` |

`canAdvance` is `true` only when all of the following hold:

1. `isCompleted` is `false`
2. Not the final round (`nextRound` is not `null`)
3. Current round has at least one category
4. `allJudgesSubmitted` is `true`
5. Next round has no contestants in `round_contestants` yet
6. Next round has at least one category and a positive `contestantLimit`

### Advancement preview

Each case below is evaluated **once per gender** (against the same `contestantLimit`), then both genders' `included`/`tied` are concatenated into the flat arrays on the response.

| Case                     | Per-gender `advancement` contribution                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Judges still scoring     | `hasTie: false`, `included: []`, `tied: []`                                                                          |
| Round completed          | Empty advancement (same as above)                                                                                    |
| All judges done, no tie  | `included` = that gender's top N by overall; `hasTie: false`                                                                       |
| Eligible ≤ limit         | All of that gender's scored contestants in `included`; no tie                                                                         |
| Tie at cutoff (State 2b) | `hasTie: true`, that gender's `requiredSelections = N - included.length`, `included` = above cutoff, `tied` = same score at cutoff |
| Tie below cutoff only    | `hasTie: false` for that gender — tied group does not straddle the line                                                              |

A tie in only one gender still sets the overall `hasTie: true` and populates `tied` with just that gender's contestants — the other gender's contestants land in `included` with nothing required. Ties in both genders simultaneously populate `tied` with both groups at once (filter by `gender` to tell them apart), and `requiredSelections` is their sum.

Tie comparison uses `overallScore` rounded to **2 decimal places**. Advancement write is [[live-event/live-round-advance]] — not covered here.

### Empty / edge cases

| Case | Response shape |
|------|----------------|
| Round exists, no contestants in pool | `rankings: []` |
| Contestants but no scores | Rows present; all `avgScore` / `overallScore` / `rank` null |
| Zero judges | `allJudgesSubmitted: false` |
| Zero categories | `allJudgesSubmitted: true` (vacuous); `canAdvanceReason: CURRENT_ROUND_NO_CATEGORIES` |
| Final round | `nextRound: null`, `canAdvance: false`, `canAdvanceReason: null` |
| Final round declared | `winnersDeclaredAt` ISO timestamp, `canDeclareWinners: false` |
| Final round, two+ same-gender finalists tie in score | `placementTies` contains one cluster for that gender, `canDeclareWinners: false` |
| Final round, cutoff tie unresolved | `placementTies: []` (winner set not fixed yet — resolve `advancement.hasTie` first, then placement ties are computed on the next fetch or the declare-time re-check) |

## Frontend UI rules

| Signal | Rule |
|--------|------|
| Ranking columns | `rankings[].categories[].name` — category `name` ascending |
| Rankings grouping | Group `rankings` by `contestant.gender` client-side (or rely on the FEMALE-first/MALE-second server ordering) to render as two tables/sections — `rank` already restarts per gender |
| Category cell | `avgScore` — number or `—` when `null` |
| Overall cell | `overallScore` — number or `—` when `null` |
| Rank cell | `rank` — number or `—` when `null` |
| All submitted badge | Show when `allJudgesSubmitted === true` (Wireframe State 2+) |
| Advance button | Hidden when `isCompleted`; enabled when `canAdvance`; disabled helper from `canAdvanceReason`. On click, POST [[live-event/live-round-advance]] |
| Advance label | `Advance to ${nextRound.name}` when `nextRound` is set |
| Tie panel | Show when `advancement.hasTie === true`. Filter `advancement.tied` by `gender` to show one panel per affected gender (a tie may exist in only one gender) — combine both genders' checked selections into one `selectedContestantIds` array before posting |
| Declare Winners | Final round only (`nextRound === null`). **No tie:** enabled when `canDeclareWinners === true`; POST [[live-event/live-round-declare-winners]] with empty body. **Cutoff tie:** `canDeclareWinners === false` — show disabled Declare + tie panel; enable locally when selection count === `requiredSelections`; POST with `{ selectedContestantIds }`. **Placement tie:** `canDeclareWinners === false`, `placementTies` non-empty — show disabled Declare + placement-order panel (one control per tied contestant, per cluster); enable locally once every cluster has a fully assigned, unique finish order; POST with `{ placementOrder }` (combinable with `selectedContestantIds` if both kinds of tie are present). Hidden when `winnersDeclaredAt` is set |
| Placement tie panel | Show when `placementTies.length > 0`. Render one section per cluster (filter by `gender`); let the admin assign a unique relative rank to each contestant within that cluster only (order across different clusters is irrelevant — flatten all clusters' chosen order into one `placementOrder` array before posting) |
| Podium | When `winnersDeclaredAt` is set, show Declared Winners block from [[live-event/live-round-declared-winners]] — not `rankings[0..2]` |
| Refetch | Page mount and manual browser refresh only — no auto-polling |

## Errors

```json
{
  "error": {
    "message": "string",
    "code": "string",
    "field": "string",
    "data": {}
  }
}
```

See [[global/errors]] for shared error codes handled by the axios interceptor.

| Status | Code | Message | Notes |
|--------|------|---------|-------|
| `400` | `ROUND_ID_INVALID` | Round ID must be a valid number. | `field`: `get_round_results_input_id`. Backend API layer only — do not handle in frontend |
| `404` | `ROUND_PHASE_NOT_FOUND` | Round phase not found. | Round `id` does not exist |
| `500` | `ROUND_RESULTS_GET_ERROR` | Unable to get round results. | Unexpected failure while loading round results |
