# Get Judge Rounds

`GET /judge-scoring/rounds`

Judge only.

Returns every round with its categories, for the judge scoring sidebar. Used on judge shell mount and on manual page refresh — no auto-polling.

**Related docs:** [[judge-scoring/judge-scoring-round-contestants]] (contestants for a round) · [[Wireframe & Flows]] §12–14 (Judge Flows) · [[System Documentation]] §4 (Judge — Scoring Interface)

## When to fetch

| Trigger | Fetch? |
|---------|--------|
| Judge shell mount | Yes |
| Full page refresh | Yes |
| Auto-polling | No — judge refreshes manually to see newly advanced rounds |

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

No path params, no body.

## Response

**200**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Preliminaries",
      "phaseOrder": 1,
      "hasContestants": true,
      "categories": [
        { "id": 10, "name": "Formal Wear" },
        { "id": 11, "name": "Swimwear" }
      ]
    },
    {
      "id": 2,
      "name": "Finals",
      "phaseOrder": 2,
      "hasContestants": false,
      "categories": [
        { "id": 20, "name": "Talent" }
      ]
    }
  ],
  "message": "Rounds fetched successfully."
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetJudgeRoundsDTO[]` | All rounds, ordered by `phaseOrder` ascending |
| `data[].id` | `number` | Round ID |
| `data[].name` | `string` | Round name |
| `data[].phaseOrder` | `number` | Round phase order |
| `data[].hasContestants` | `boolean` | `true` when the round is interactive (has eligible contestants). For `phaseOrder === 1` this reflects whether any contestant exists at all; for later rounds it reflects whether the round has been populated via advancement |
| `data[].categories` | `GetJudgeRoundsCategoryDTO[]` | Categories under the round, ordered by `name` ascending |
| `data[].categories[].id` | `number` | Category ID |
| `data[].categories[].name` | `string` | Category name |
| `message` | `string` | Success message |

## Frontend UI rules

| Signal | Rule |
|--------|------|
| Round with `hasContestants: false` | Sidebar shows the round expandable, but expanding shows "No contestants yet" — no scoring possible ([[Wireframe & Flows]] §13) |
| Round with `hasContestants: true` | Categories are clickable; clicking one navigates to `/judge/scoring/:categoryId` |
| Refetch | Page mount and manual refresh only |

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
| `500` | `SCORING_ROUNDS_GET_ERROR` | Unable to get rounds. | Unexpected failure while loading rounds |
