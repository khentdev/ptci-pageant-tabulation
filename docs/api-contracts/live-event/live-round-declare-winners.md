# Declare Winners

`POST /live-event/round-results/:id/declare-winners`

Admin or Chairman — role-conditional on whether a tie (cutoff or placement) exists (see **Business rules**).

Locks final-round results by inserting `RoundWinner` rows and setting `winnersDeclaredAt` on the current round. Irreversible. Does not return rankings; refetch [[live-event/live-round-results]] after success for lock flags.

**Placement is assigned independently per gender** — a Ms. and a Mr. can each hold placement 1 in the same round. `advancement`/tie resolution follow the same per-gender rules as [[live-event/live-round-advance]].

**Role split:** resolving a tie (cutoff or placement) is a judging decision, not an operational one. Admin declares every routine (tie-free) final round; Chairman is the only role allowed to declare when `advancement.hasTie` or `placementTies.length > 0`. Sending the request as the wrong role for the current tie state is rejected — see `DECLARE_REQUIRES_CHAIRMAN` / `CHAIRMAN_ACTION_REQUIRES_TIE` below.

**Related docs:** [[live-event/live-round-results]] (rankings preview and flags) · [[live-event/live-judge-submissions]] · [[live-event/live-results-sidebar]] · [[Wireframe & Flows]] §11 · [[System Documentation]] §3.3

## Consumers

- Admin Live Event → Round Results page — **Declare Winners** button, shown to Admin only when there is no tie
- Chairman Live Event → Round Results page (same page, Chairman-scoped nav) — **Declare Winners** button, shown to Chairman only when a tie exists

## When to call

| Trigger | Call? |
|---------|-------|
| Declare Winners button click (after confirmation) | Yes — only on explicit Admin or Chairman action |
| Page mount / refresh | No |
| Sidebar round change | No |
| Auto-polling | No |

Call when the final round is ready:

- **No tie:** `canDeclareWinners === true` from [[live-event/live-round-results]]
- **Tie at cutoff:** `canDeclareWinners === false` but `advancement.hasTie === true` — disable Declare until local tie selections match `advancement.requiredSelections`, then POST with `selectedContestantIds`
- **Placement tie:** `canDeclareWinners === false` and `placementTies.length > 0` — disable Declare until every cluster in `placementTies` has a fully assigned finish order, then POST with `placementOrder`. Independent of the cutoff-tie case above; both can be sent together if both apply

## Request

**Headers** *(frontend sets explicitly)*

| Header | Required | Value |
|--------|----------|-------|
| `X-CSRF-Token` | Yes | Value from `csrfToken` cookie |
| `X-Fingerprint` | Yes | Same JSON fingerprint object as other admin POSTs |
| `Content-Type` | Yes | `application/json` when sending a body |

**Cookies** *(auto-sent with `credentials: 'include'`)*

| Cookie | Required | Notes |
|--------|----------|-------|
| `sid` | Yes | Session cookie |
| `csrfToken` | Yes | Read value for `X-CSRF-Token` header |

**Path params**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | Yes | Final round ID (same as `route.params.roundId`; `nextRound` is `null` on GET) |

**Request body**

Optional. Omit body or send `{}` when there is no tie.

| Case | Body | Notes |
|------|------|-------|
| No tie | Omit or `{}` | Backend uses `advancement.included`. Do **not** send `selectedContestantIds` or `placementOrder` |
| Tie at cutoff | `{ "selectedContestantIds": number[] }` | IDs from `advancement.tied` only. Length must equal `advancement.requiredSelections`. Merged with `advancement.included` |
| Placement tie | `{ "placementOrder": number[] }` | The exact union of every `placementTies[].contestants[].id`, ordered by chosen finish order within each cluster (order across different clusters doesn't matter) |
| Both at once | `{ "selectedContestantIds": [...], "placementOrder": [...] }` | Rare, but possible if resolving a cutoff tie also produces a placement tie among the newly-selected members |

```json
{
  "selectedContestantIds": [12],
  "placementOrder": [7, 8]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `selectedContestantIds` | `number[]` | No | Required only when resolving a cutoff tie. IDs from `advancement.tied` only |
| `placementOrder` | `number[]` | No | Required only when `placementTies` is non-empty. Must be exactly the set of tied contestant IDs across all clusters, ordered by chosen finish order within each cluster |

## Response

**201**

```json
{
  "message": "Winners declared successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `message` | `string` | Success message |

No `data` field. After success:

1. Refetch `GET /live-event/round-results/:id/advancement` — `winnersDeclaredAt` set, `canDeclareWinners: false`
2. Refetch `GET /live-event/round-results/:id/declared-winners` — official podium for UI ([[live-event/live-round-declared-winners]])

### Types

**`DeclareWinnersRequestBody`**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `selectedContestantIds` | `number[]` | No | Tie-resolution selections from `advancement.tied`. Omit when `advancement.hasTie` is `false` |
| `placementOrder` | `number[]` | No | Finish-order resolution for `placementTies`. Omit when `placementTies` is empty |

**`DeclareWinnersResponse`**

| Field | Type | Notes |
|-------|------|-------|
| `message` | `string` | Success message |

## Business rules

| Rule | Behavior |
|------|----------|
| Final round only | `nextRound === null` on a fresh results check |
| Re-validation | Backend re-runs `getRoundResultsInTx` before write. Does **not** gate on `canDeclareWinners` alone (tie POST allowed when selections are valid) |
| Write target | Inserts `RoundWinner` rows (`placement`, `gender`, `contestantId`, `overallScore` snapshot) and sets `winnersDeclaredAt` on the **current** round in one transaction |
| Placement sort | Computed **per gender**: winners sorted by `overallScore` descending; ties broken by `placementOrder` (the submitted finish order) when the pair is a resolved placement tie, else by `candidateNumber` ascending as a fallback; `placement` 1..N assigned per gender at declare time, so a female and a male winner can both be placement 1 |
| No tie | `winningContestantIds = advancement.included` |
| Cutoff tie | `winningContestantIds = advancement.included + selectedContestantIds`, resolved per gender: each gender's own included + its own share of picks must equal the current round `contestantLimit` for that gender when the limit is set |
| Placement tie | Recomputed server-side from the *final* `winningContestantIds` (after cutoff-tie resolution, if any) — clusters of 2+ same-gender winners sharing an identical `overallScore`. Rejected with `PLACEMENT_ORDER_REQUIRED` if any cluster exists and `placementOrder` is missing, `PLACEMENT_ORDER_MISMATCH` if it doesn't exactly cover every cluster's contestant IDs, `PLACEMENT_ORDER_NOT_ALLOWED` if sent with no cluster |
| Role gate | Checked before the tie-selection logic above, using the caller's role from the session JWT (never client-supplied): Admin + (`advancement.hasTie` or `placementTies.length > 0`) → `409 DECLARE_REQUIRES_CHAIRMAN`. Chairman + neither → `409 CHAIRMAN_ACTION_REQUIRES_TIE` |
| Eligible ≤ limit | `included` may be shorter than N **per gender** — valid declare with fewer scored contestants |
| Idempotency | Second declare on same round → `DECLARE_NOT_ALLOWED` (`WINNERS_ALREADY_DECLARED`) — also rejected when `RoundWinner` rows already exist |
| Irreversible | No undo endpoint |
| Rankings | Not returned — `rankings` on GET round results stay score-based; official podium from [[live-event/live-round-declared-winners]] |

### `DECLARE_NOT_ALLOWED` — `error.data.reason`

Returned with HTTP `409` when declare is rejected.

| Reason | When |
|--------|------|
| `NOT_FINAL_ROUND` | Round has a next round (`nextRound` is not `null`) |
| `WINNERS_ALREADY_DECLARED` | `winnersDeclaredAt` already set or `RoundWinner` rows exist for this round |
| `CURRENT_ROUND_NO_CATEGORIES` | Current round has zero categories |
| `JUDGES_NOT_COMPLETE` | Not all judges finished scoring |
| `NO_ELIGIBLE_CONTESTANTS` | No contestants in `included` + selections |

## Frontend UI rules

| Signal | Rule |
|--------|------|
| When to POST | Declare Winners button click only (after confirmation modal) — never on mount or poll |
| Show button (Admin) | Final round (`nextRound === null`), no tie of either kind, `winnersDeclaredAt` not set; when a tie exists, hide the button and show "A tie must be resolved by the Chairman before declaring winners." instead |
| Show button (Chairman) | Final round, `winnersDeclaredAt` not set, and a tie of either kind exists — nothing to do (and no button) otherwise |
| No tie | Enable when `canDeclareWinners === true`; empty body or `{}` |
| Cutoff tie | Show tie-resolution panel; **disable** Declare until local selection count === `requiredSelections`; then enable and POST `{ selectedContestantIds }`. Panel is read-only for Admin — only Chairman's checkboxes are interactive |
| Placement tie | Show placement-order panel (one control per tied contestant, grouped by `placementTies[].gender`); **disable** Declare until every cluster has a unique finish order assigned; then enable and POST `{ placementOrder }` — combine with `selectedContestantIds` in the same body if a cutoff tie is also being resolved. Panel is read-only for Admin — only Chairman's rank selects are interactive |
| After success | Refetch advancement GET for `winnersDeclaredAt`; refetch [[live-event/live-round-declared-winners]] for podium; clear local tie selection and placement order |
| Advance button | Never on final round (`canAdvance` is `false`) |

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

See [[global/errors]] for shared codes (`FORBIDDEN`, etc.).

| Status | Code | Message | Notes |
|--------|------|---------|-------|
| `400` | `ROUND_ID_INVALID` | Round ID must be a valid number. | `field`: `declare_winners_input_id` |
| `400` | `SELECTED_CONTESTANT_IDS_INVALID` | Selected contestant IDs are invalid. | Body `selectedContestantIds` is not an array |
| `400` | `SELECTED_CONTESTANT_ID_INVALID` | Selected contestant ID is invalid. | Non-integer or ≤ 0 |
| `400` | `SELECTED_CONTESTANT_IDS_DUPLICATE` | Selected contestant IDs are duplicate. | Duplicate IDs in array |
| `400` | `SELECTED_CONTESTANT_IDS_NOT_ALLOWED` | Selected contestant IDs are not allowed when there is no tie. | Sent when `advancement.hasTie` is `false` |
| `400` | `SELECTED_CONTESTANT_IDS_REQUIRED` | Selected contestant IDs are required to resolve a tie. | Tie case with missing/empty selection |
| `400` | `SELECTED_CONTESTANT_IDS_COUNT_INVALID` | Selected contestant count does not match the required tie selections. | Length ≠ `requiredSelections` |
| `400` | `SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP` | One or more selected contestants are not in the tied group. | ID not in `advancement.tied` |
| `400` | `PLACEMENT_ORDER_INVALID` | Placement order is invalid. | Body `placementOrder` is not an array |
| `400` | `PLACEMENT_ORDER_ID_INVALID` | Placement order contestant ID is invalid. | Non-integer or ≤ 0 |
| `400` | `PLACEMENT_ORDER_IDS_DUPLICATE` | Placement order contestant IDs are duplicate. | Duplicate IDs in array |
| `400` | `PLACEMENT_ORDER_NOT_ALLOWED` | Placement order is not allowed when there is no placement tie. | Sent while `placementTies` is empty |
| `400` | `PLACEMENT_ORDER_REQUIRED` | Placement order is required to resolve a score tie. | `placementTies` non-empty but `placementOrder` missing/empty |
| `400` | `PLACEMENT_ORDER_MISMATCH` | Placement order must include exactly the tied contestants, with no extras or omissions. | `placementOrder`'s ID set doesn't exactly match the union of every cluster's contestant IDs |
| `400` | `DECLARE_WINNER_COUNT_MISMATCH` | Declared winner count does not match the round limit. | One gender's merged count ≠ `contestantLimit` for that gender (tie path) — usually means picks weren't distributed correctly across the two genders' ties |
| `403` | `FORBIDDEN` | *(shared)* | Session role is not Admin or Chairman (e.g. a Judge session) |
| `404` | `ROUND_PHASE_NOT_FOUND` | Round phase not found. | Round `id` does not exist |
| `409` | `DECLARE_NOT_ALLOWED` | Winners cannot be declared at this time. | `data.reason` — see table above |
| `409` | `DECLARE_REQUIRES_CHAIRMAN` | This round has a tie. Only the Chairman can resolve it and declare winners. | Admin session, a cutoff or placement tie exists |
| `409` | `CHAIRMAN_ACTION_REQUIRES_TIE` | There is no tie to resolve. The Chairman can only act when a tie exists. | Chairman session, no tie of either kind |
| `500` | `DECLARE_WINNERS_ERROR` | Unable to declare winners. | Unexpected failure |
