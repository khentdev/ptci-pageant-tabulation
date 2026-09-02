# Get Declared Winners

`GET /live-event/round-results/:id/declared-winners`

Admin only.

Returns the **official declared podium** for one round after POST [[live-event/live-round-declare-winners]]. Rows come from `RoundWinner` (`placement`, contestant identity, `overallScore` snapshot at declare time). Not score-based `rankings` from [[live-event/live-round-results]].

**Related docs:** [[live-event/live-round-declare-winners]] (write) · [[live-event/live-round-results]] (`winnersDeclaredAt` gate) · [[live-event/live-judge-submissions]] · [[live-event/live-results-sidebar]] · [[Wireframe & Flows]] §6 · §11 · [[System Documentation]] §3.3

## Consumers

- Admin Live Event → Round Results page — **Declared Winners** podium block (final round only, after declare; same route `/admin/live/results/:roundId` — no separate Declared Winners page)

## When to fetch

| Trigger | Fetch? |
|---------|--------|
| Round Results page mount (`route.params.roundId` set) | Optional — only when `winnersDeclaredAt` from advancement GET is set; or always (returns `declaredWinners: null` when not declared) |
| Full page refresh on Round Results page | Same as mount |
| Sidebar round click (same page, new `roundId`) | Same as mount |
| After Declare Winners POST success | **Yes** — refetch for podium data |
| Auto-polling | No |

Fetch matrix with other Round Results GETs:

| Trigger | Judge GET | Advancement GET | Declared-winners GET |
|---------|-----------|-----------------|----------------------|
| Page mount / refresh / sidebar round change | Always | Always | Only when `winnersDeclaredAt` is set (or call always and treat `null`) |
| After Declare POST success | Refetch | Refetch | **Yes** |
| Auto-polling | No | No | No |

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
    "declaredWinners": [
      {
        "placement": 1,
        "contestant": {
          "id": 1,
          "candidateNumber": 101,
          "name": "Keanna"
        },
        "overallScore": 95
      },
      {
        "placement": 2,
        "contestant": {
          "id": 2,
          "candidateNumber": 102,
          "name": "Roldan"
        },
        "overallScore": 88.5
      },
      {
        "placement": 3,
        "contestant": {
          "id": 3,
          "candidateNumber": 103,
          "name": "Ethel"
        },
        "overallScore": 84
      }
    ]
  },
  "message": "Declared winners fetched successfully"
}
```

When winners are not declared (`winnersDeclaredAt` is `null` on the round):

```json
{
  "data": {
    "declaredWinners": null
  },
  "message": "Declared winners fetched successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetDeclaredWinnersDTO` | Official podium payload |
| `data.declaredWinners` | `DeclaredWinnerRow[] \| null` | `null` when `winnersDeclaredAt` is not set. Non-null array when declared (may be empty if timestamp set but no rows — edge case) |
| `message` | `string` | Success message |

### Types

**`GetDeclaredWinnersDTO`**

| Field | Type | Notes |
|-------|------|-------|
| `declaredWinners` | `DeclaredWinnerRow[] \| null` | Official podium rows ordered by `placement` ascending |

**`DeclaredWinnerRow`**

| Field | Type | Notes |
|-------|------|-------|
| `placement` | `number` | Medal rank `1..N` assigned at declare time |
| `contestant` | `DeclaredWinnerContestant` | Contestant identity |
| `overallScore` | `number` | Score snapshot at declare (2 decimal places) |

**`DeclaredWinnerContestant`**

| Field | Type | Notes |
|-------|------|-------|
| `id` | `number` | Contestant ID |
| `candidateNumber` | `number` | Display number |
| `name` | `string` | Display name |

## Business rules

| Rule | Behavior |
|------|----------|
| Read source | `RoundWinner` rows for the round, ordered by `placement` ascending |
| Not declared | `winnersDeclaredAt === null` → `declaredWinners: null` (any round, including non-final) |
| Declared | `winnersDeclaredAt` set → array of rows (empty array if timestamp set but no `RoundWinner` rows) |
| vs rankings | Podium names and 3rd place after tie resolution come from this endpoint — not `rankings[0..2]` or `rank` column |
| Tie at cutoff | Admin tie pick stored in `RoundWinner` at declare — 3rd place reflects selection, not score-only rank |
| Sort at write | POST declare sorts by `overallScore` desc, `candidateNumber` asc before assigning `placement` |
| Idempotent read | Repeated GET after declare returns identical payload |
| Non-final round | Returns `declaredWinners: null` when never declared (declare POST is rejected on non-final rounds) |

## Frontend UI rules

| Signal | Rule |
|--------|------|
| Podium source | Bind 🥇 🥈 🥉 rows from `declaredWinners[]` — `placement`, `contestant.name`, `overallScore` |
| When to show | `declaredWinners !== null` (or `winnersDeclaredAt` from advancement GET) |
| Before declare | No podium block; no declared-winners GET required while `winnersDeclaredAt` is `null` |
| After declare | Replace Declare button with podium block; data from this GET, not rankings |
| Rankings table | May remain visible as score snapshot (optional); official medals use this endpoint |
| Tie case | 3rd place name from admin tie pick in `RoundWinner`, not rankings rank column |
| Refetch | Mount (when gated), after Declare POST success, manual refresh — no auto-polling |

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
| `400` | `ROUND_ID_INVALID` | Round ID must be a valid number. | `field`: `get_declared_winners_input_id` |
| `403` | `FORBIDDEN` | *(shared)* | Non-admin session |
| `404` | `ROUND_PHASE_NOT_FOUND` | Round phase not found. | Round `id` does not exist |
| `500` | `DECLARED_WINNERS_GET_ERROR` | Unable to get declared winners. | Unexpected failure |
