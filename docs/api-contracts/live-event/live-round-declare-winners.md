# Declare Winners

`POST /live-event/round-results/:id/declare-winners`

Admin only.

Locks final-round results by inserting `RoundWinner` rows and setting `winnersDeclaredAt` on the current round. Irreversible. Does not return rankings; refetch [[live-event/live-round-results]] after success for lock flags.

**Related docs:** [[live-event/live-round-results]] (rankings preview and flags) · [[live-event/live-judge-submissions]] · [[live-event/live-results-sidebar]] · [[Wireframe & Flows]] §11 · [[System Documentation]] §3.3

## Consumers

- Admin Live Event → Round Results page — **Declare Winners** button (final round only; no-tie and tie-resolution flows)

## When to call

| Trigger | Call? |
|---------|-------|
| Declare Winners button click (after confirmation) | Yes — only on explicit admin action |
| Page mount / refresh | No |
| Sidebar round change | No |
| Auto-polling | No |

Call when the final round is ready:

- **No tie:** `canDeclareWinners === true` from [[live-event/live-round-results]]
- **Tie at cutoff:** `canDeclareWinners === false` but `advancement.hasTie === true` — disable Declare until local tie selections match `advancement.requiredSelections`, then POST with `selectedContestantIds`

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
| No tie | Omit or `{}` | Backend uses `advancement.included`. Do **not** send `selectedContestantIds` |
| Tie at cutoff | `{ "selectedContestantIds": number[] }` | IDs from `advancement.tied` only. Length must equal `advancement.requiredSelections`. Merged with `advancement.included` |

```json
{
  "selectedContestantIds": [12]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `selectedContestantIds` | `number[]` | No | Required only when resolving a cutoff tie. IDs from `advancement.tied` only |

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

No `data` field. Refetch `GET /live-event/round-results/:id/advancement` to see `winnersDeclaredAt` set and `canDeclareWinners: false`. Official podium rows are stored in `RoundWinner` (read API is a follow-up).

### Types

**`DeclareWinnersRequestBody`**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `selectedContestantIds` | `number[]` | No | Tie-resolution selections from `advancement.tied`. Omit when `advancement.hasTie` is `false` |

**`DeclareWinnersResponse`**

| Field | Type | Notes |
|-------|------|-------|
| `message` | `string` | Success message |

## Business rules

| Rule | Behavior |
|------|----------|
| Final round only | `nextRound === null` on a fresh results check |
| Re-validation | Backend re-runs `getRoundResultsInTx` before write. Does **not** gate on `canDeclareWinners` alone (tie POST allowed when selections are valid) |
| Write target | Inserts `RoundWinner` rows (`placement`, `contestantId`, `overallScore` snapshot) and sets `winnersDeclaredAt` on the **current** round in one transaction |
| Placement sort | Winner set sorted by `overallScore` descending, then `candidateNumber` ascending — same tiebreak as rankings; `placement` 1..N assigned at declare time |
| No tie | `winningContestantIds = advancement.included` |
| Tie | `winningContestantIds = advancement.included + selectedContestantIds`; total must equal current round `contestantLimit` when limit is set |
| Eligible ≤ limit | `included` may be shorter than N — valid declare with fewer scored contestants |
| Idempotency | Second declare on same round → `DECLARE_NOT_ALLOWED` (`WINNERS_ALREADY_DECLARED`) — also rejected when `RoundWinner` rows already exist |
| Irreversible | No undo endpoint |
| Rankings | Not returned — `rankings` on GET round results stay score-based; official podium read API is follow-up |

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
| Show button | Final round (`nextRound === null`); hide when `winnersDeclaredAt` is set |
| No tie | Enable when `canDeclareWinners === true`; empty body or `{}` |
| Tie | Show tie-resolution panel; **disable** Declare until local selection count === `requiredSelections`; then enable and POST `{ selectedContestantIds }` |
| After success | Refetch GET round results for `winnersDeclaredAt`; clear local tie selection. Podium display will use GET declared-winners (follow-up) |
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
| `400` | `DECLARE_WINNER_COUNT_MISMATCH` | Declared winner count does not match the round limit. | Merged count ≠ `contestantLimit` (tie path) |
| `403` | `FORBIDDEN` | *(shared)* | Non-admin session |
| `404` | `ROUND_PHASE_NOT_FOUND` | Round phase not found. | Round `id` does not exist |
| `409` | `DECLARE_NOT_ALLOWED` | Winners cannot be declared at this time. | `data.reason` — see table above |
| `500` | `DECLARE_WINNERS_ERROR` | Unable to declare winners. | Unexpected failure |
