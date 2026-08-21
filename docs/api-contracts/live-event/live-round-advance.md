# Advance Round

`POST /live-event/round-results/:id/advancement`

Admin only.

Confirms advancement for the current round — inserts advancing contestants into the **next** round's `round_contestants`. Does not return rankings; refetch [[live-event/live-round-results]] after success.

**Related docs:** [[live-event/live-round-results]] (rankings preview and flags) · [[live-event/live-judge-submissions]] · [[live-event/live-results-sidebar]] · [[Wireframe & Flows]] §6 · [[System Documentation]] §3.2

## Consumers

- Admin Live Event → Round Results page — **Advance** button (no-tie and tie-resolution flows)

## When to call

| Trigger | Call? |
|---------|-------|
| Advance button click | Yes — only on explicit admin action |
| Page mount / refresh | No |
| Sidebar round change | No |
| Auto-polling | No |

Call only when `canAdvance === true` from [[live-event/live-round-results]]. When `advancement.hasTie === true`, disable Advance until local tie selections match `advancement.requiredSelections`, then send selected IDs.

## Request

**Headers** *(frontend sets explicitly)*

| Header | Required | Value |
|--------|----------|-------|
| `X-CSRF-Token` | Yes | Value from `csrfToken` cookie |
| `X-Fingerprint` | Yes | Same JSON fingerprint object as other admin POSTs |
| `Content-Type` | Yes | `application/json` |

**Cookies** *(auto-sent with `credentials: 'include'`)*

| Cookie | Required | Notes |
|--------|----------|-------|
| `sid` | Yes | Session cookie |
| `csrfToken` | Yes | Read value for `X-CSRF-Token` header |

**Path params**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | Yes | Current round being advanced **from** (same as `route.params.roundId`) |

**Request body**

Optional. Omit body or send `{}` when there is no tie.

| Case | Body | Notes |
|------|------|-------|
| No tie | Omit or `{}` | Backend uses `advancement.included` from a fresh `canAdvance` check. Do **not** send `selectedContestantIds` |
| Tie at cutoff | `{ "selectedContestantIds": number[] }` | IDs from `advancement.tied` only. Length must equal `advancement.requiredSelections`. Merged with `advancement.included` |
| Eligible ≤ limit | Omit or `{}` | May advance fewer than `nextRound.contestantLimit` when fewer contestants have scores |

```json
{
  "selectedContestantIds": [3, 7]
}
```

## Response

**201**

```json
{
  "message": "Round advanced successfully"
}
```

No `data` field. Refetch `GET /live-event/round-results/:id/advancement` to see `isCompleted: true` and updated state.

## Business rules

| Rule | Behavior |
|------|----------|
| Re-validation | Backend re-runs `getRoundResultsInTx` and rejects when `canAdvance` is `false` |
| Write target | Inserts into **next** round (`nextRound.id`), not the current round |
| No tie | `advancingContestantIds = advancement.included` |
| Tie | `advancingContestantIds = advancement.included + selectedContestantIds`; total must equal `nextRound.contestantLimit` |
| Eligible ≤ limit | `included` may be shorter than N — valid advance with fewer rows |
| Idempotency | Second advance on same round → `ADVANCE_NOT_ALLOWED` (`ROUND_COMPLETED` or `NEXT_ROUND_ALREADY_FILLED`) |
| Rankings | Not returned — use GET round results after success |

### `ADVANCE_NOT_ALLOWED` — `error.data.reason`

Returned with HTTP `409` when advancement is rejected.

| Reason | When |
|--------|------|
| `JUDGES_NOT_COMPLETE` | Not all judges finished scoring |
| `CURRENT_ROUND_NO_CATEGORIES` | Current round has zero categories |
| `NEXT_ROUND_NO_CATEGORIES` | Next round missing, has zero categories, or null/zero `contestantLimit` |
| `ROUND_COMPLETED` | Next round already has `round_contestants` rows (`isCompleted`) |
| `NEXT_ROUND_ALREADY_FILLED` | Same DB state as `ROUND_COMPLETED` (checked again at write time) |
| `NO_ELIGIBLE_CONTESTANTS` | No contestants to advance (empty pool or none in `included` + selections) |

When `canAdvance` is `false` on GET, `canAdvanceReason` uses the same codes (except `NO_ELIGIBLE_CONTESTANTS`, which is POST-only).

## Frontend UI rules

| Signal | Rule |
|--------|------|
| When to POST | Advance button click only — never on mount or poll |
| Enable gate | `canAdvance === true`; if `advancement.hasTie`, also require selection count === `requiredSelections` |
| No-tie body | Empty body or `{}` — do not send `selectedContestantIds` |
| Tie body | `{ selectedContestantIds }` from checked rows in `advancement.tied` |
| After success | Refetch GET round results (and optionally judge submissions); clear local tie selection |
| Button hidden | When `isCompleted === true` |

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
| `400` | `ROUND_ID_INVALID` | Round ID must be a valid number. | `field`: `advance_round_input_id` |
| `400` | `SELECTED_CONTESTANT_IDS_INVALID` | Selected contestant IDs are invalid. | Body `selectedContestantIds` is not an array |
| `400` | `SELECTED_CONTESTANT_ID_INVALID` | Selected contestant ID is invalid. | Non-integer or ≤ 0 |
| `400` | `SELECTED_CONTESTANT_IDS_DUPLICATE` | Selected contestant IDs are duplicate. | Duplicate IDs in array |
| `400` | `SELECTED_CONTESTANT_IDS_NOT_ALLOWED` | Selected contestant IDs are not allowed when there is no tie. | Sent when `advancement.hasTie` is `false` |
| `400` | `SELECTED_CONTESTANT_IDS_REQUIRED` | Selected contestant IDs are required to resolve a tie. | Tie case with missing/empty selection |
| `400` | `SELECTED_CONTESTANT_IDS_COUNT_INVALID` | Selected contestant count does not match the required tie selections. | Length ≠ `requiredSelections` |
| `400` | `SELECTED_CONTESTANT_ID_NOT_IN_TIE_GROUP` | One or more selected contestants are not in the tied group. | ID not in `advancement.tied` |
| `400` | `ADVANCE_CONTESTANT_COUNT_MISMATCH` | Advancing contestant count does not match the next round limit. | Merged count ≠ `contestantLimit` (tie path) |
| `403` | `FORBIDDEN` | *(shared)* | Non-admin session |
| `404` | `ROUND_PHASE_NOT_FOUND` | Round phase not found. | Round `id` does not exist |
| `409` | `ADVANCE_NOT_ALLOWED` | Round cannot be advanced at this time. | `data.reason` — see table above |
| `500` | `ROUND_ADVANCEMENT_ERROR` | Unable to advance round. | Unexpected failure |
