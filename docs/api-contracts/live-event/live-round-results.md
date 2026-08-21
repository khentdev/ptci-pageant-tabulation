# Get Round Results (Rankings & Advancement)

`GET /live-event/round-results/:id/advancement`

Admin only.

Returns **rankings**, advancement preview, and round-state flags for one round. Used for the Rankings section, Advance button, tie-resolution panel, and Declare Winners on the Admin Live Event → Round Results page.

**Read-only.** Confirming advancement is a separate POST — see [[live-event/live-round-advance]] (`POST /live-event/round-results/:id/advancement`).

**Does not include** `judgeSubmissions` — fetch that separately via [[live-event/live-judge-submissions]] (`GET /live-event/round-results/:id`).

**Related docs:** [[live-event/live-results-sidebar]] (sidebar navigation) · [[live-event/live-judge-submissions]] (judge matrix) · [[Wireframe & Flows]] §6 (Rankings UI) · [[System Documentation]] §3.2 (business rules)

## Consumers

- Admin Live Event → Round Results page — **Rankings** table, Advance button, tie-resolution panel, Declare Winners

## When to fetch

| Trigger | Fetch? |
|---------|--------|
| Round Results page mount (`route.params.roundId` set) | Yes |
| Full page refresh on Round Results page | Yes |
| Sidebar round click (same page, new `roundId`) | Yes — refetch for the new round |
| Auto-polling | No |

Fetch alongside [[live-event/live-judge-submissions]] on mount / refresh / round change. Two separate GETs — do not merge client-side.

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
          "name": "Keanna"
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
    }
  },
  "message": "Round results fetched successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetRoundResultsDTO` | Rankings and round-state flags for the requested round |
| `data.rankings` | `RankingRow[]` | One row per contestant in the round's contestant pool. Sorted by `overallScore` descending; `null` overall scores last; ties broken by `candidateNumber` ascending |
| `data.rankings[].contestant` | `{ id, candidateNumber, name }` | Contestant identity for the row |
| `data.rankings[].contestant.id` | `number` | Contestant ID |
| `data.rankings[].contestant.candidateNumber` | `number` | Display number |
| `data.rankings[].contestant.name` | `string` | Display name |
| `data.rankings[].categories` | `RankingCategoryScore[]` | One column per category in this round. Ordered by category `name` ascending |
| `data.rankings[].categories[].id` | `number` | Category ID |
| `data.rankings[].categories[].name` | `string` | Category name (column header) |
| `data.rankings[].categories[].avgScore` | `number \| null` | Average of judges who submitted for this contestant in this category. `null` → render `—` in UI. Rounded to 2 decimal places |
| `data.rankings[].overallScore` | `number \| null` | Average of non-null category averages for this contestant. `null` when no category has a score. Rounded to 2 decimal places |
| `data.rankings[].rank` | `number \| null` | `1..N` by `overallScore` descending; `null` when `overallScore` is `null` |
| `data.allJudgesSubmitted` | `boolean` | `true` when every judge has submitted every category in this round. `false` when zero judges. Vacuously `true` when the round has zero categories but judges exist |
| `data.isCompleted` | `boolean` | `true` when the next round already has rows in `round_contestants` (this round was advanced). Page is read-only history (Wireframe State 3) |
| `data.canAdvance` | `boolean` | `true` only when Advance is allowed. `canAdvance` may be `true` while `advancement.hasTie` is `true` — frontend disables Advance until tie selections match |
| `data.canAdvanceReason` | `CanAdvanceReason \| null` | When `canAdvance` is `false`, code for disabled helper text. `null` when `canAdvance` is `true`, or on the final round |
| `data.canDeclareWinners` | `boolean` | Final round only. `true` when all judges submitted, no cutoff tie, and winners not yet declared |
| `data.winnersDeclaredAt` | `string \| null` | ISO timestamp when winners were declared on the final round; `null` otherwise |
| `data.nextRound` | `object \| null` | Next round metadata. `null` on the final round |
| `data.nextRound.id` | `number` | Next round ID |
| `data.nextRound.name` | `string` | Next round name (Advance button label) |
| `data.nextRound.contestantLimit` | `number \| null` | How many contestants advance into the next round |
| `data.nextRound.categoryCount` | `number` | Number of categories configured on the next round |
| `data.advancement` | `AdvancementPreview` | Advancement preview — populated only when `allJudgesSubmitted` is `true`, `isCompleted` is `false`, current round has categories, and a positive advancement limit exists |
| `data.advancement.hasTie` | `boolean` | `true` when tied contestants straddle the cutoff (Wireframe State 2b) |
| `data.advancement.requiredSelections` | `number` | How many tied contestants admin must pick (`N - included.length`). `0` when no tie |
| `data.advancement.included` | `AdvancementContestant[]` | Auto-included contestants above the cutoff |
| `data.advancement.included[].id` | `number` | Contestant ID |
| `data.advancement.included[].name` | `string` | Contestant name |
| `data.advancement.included[].overallScore` | `number` | Overall score (2 dp) |
| `data.advancement.tied` | `AdvancementContestant[]` | Tied contestants at the cutoff for admin selection |
| `message` | `string` | Success message |

### Rankings rules

| Rule | Behavior |
|------|----------|
| Partial averages (State 1) | Only judges who submitted count toward each category average. Categories with no submissions → `avgScore: null` → UI `—` |
| Overall score | Average of non-null category averages only |
| Contestant pool — Preliminary (`phaseOrder = 1`) | All contestants |
| Contestant pool — Top N (`phaseOrder > 1`) | Only `round_contestants` for that round |
| Score math | Sum criteria fields per judge per category → average across judges per category → average across categories → overall |
| Sort / rank | Higher `overallScore` ranks first; tie on overall breaks by `candidateNumber` ascending; `null` overall → `rank: null`, sorted last |

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

| Case                     | `advancement` shape                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Judges still scoring     | `hasTie: false`, `included: []`, `tied: []`                                                                          |
| Round completed          | Empty advancement (same as above)                                                                                    |
| All judges done, no tie  | `included` = top N by overall; `hasTie: false`                                                                       |
| Eligible ≤ limit         | All scored contestants in `included`; no tie                                                                         |
| Tie at cutoff (State 2b) | `hasTie: true`, `requiredSelections = N - included.length`, `included` = above cutoff, `tied` = same score at cutoff |
| Tie below cutoff only    | `hasTie: false` — tied group does not straddle the line                                                              |

Tie comparison uses `overallScore` rounded to **2 decimal places**. Advancement write is [[live-event/live-round-advance]] — not covered here.

### Empty / edge cases

| Case | Response shape |
|------|----------------|
| Round exists, no contestants in pool | `rankings: []` |
| Contestants but no scores | Rows present; all `avgScore` / `overallScore` / `rank` null |
| Zero judges | `allJudgesSubmitted: false` |
| Zero categories | `allJudgesSubmitted: true` (vacuous); `canAdvanceReason: CURRENT_ROUND_NO_CATEGORIES` |
| Final round | `nextRound: null`, `canAdvance: false`, `canAdvanceReason: null` |

## Frontend UI rules

| Signal | Rule |
|--------|------|
| Ranking columns | `rankings[].categories[].name` — category `name` ascending |
| Category cell | `avgScore` — number or `—` when `null` |
| Overall cell | `overallScore` — number or `—` when `null` |
| Rank cell | `rank` — number or `—` when `null` |
| All submitted badge | Show when `allJudgesSubmitted === true` (Wireframe State 2+) |
| Advance button | Hidden when `isCompleted`; enabled when `canAdvance`; disabled helper from `canAdvanceReason`. On click, POST [[live-event/live-round-advance]] |
| Advance label | `Advance to ${nextRound.name}` when `nextRound` is set |
| Tie panel | Show when `advancement.hasTie === true` |
| Declare Winners | Final round; enabled when `canDeclareWinners === true` |
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
