# Get Round Contestants

`GET /judge-scoring/rounds/:id/contestants`

Judge only.

Returns the contestants eligible to be scored in a round — used together with [[judge-scoring/judge-scoring-category-fields]] and [[judge-scoring/judge-scoring-category-scores]] when a judge opens a category's scoring grid.

For the first round (`phaseOrder === 1`) this returns **all** contestants — no `round_contestants` rows are needed for prelims. For any later round it returns only the contestants advanced into that round via [[live-event/live-round-advance]].

## When to fetch

| Trigger | Fetch? |
|---------|--------|
| Judge opens a category (alongside fields + existing scores) | Yes |
| Auto-polling | No |

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
| `id` | `number` | Yes | Round ID — positive whole number |

No request body.

## Response

**200**

```json
{
  "data": [
    { "id": 3, "candidateNumber": 1, "name": "Contestant A" },
    { "id": 5, "candidateNumber": 2, "name": "Contestant B" }
  ],
  "message": "Contestants fetched successfully."
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetRoundContestantsDTO[]` | Eligible contestants, ordered by `candidateNumber` ascending. Empty array when the round has no contestants yet |
| `data[].id` | `number` | Contestant ID |
| `data[].candidateNumber` | `number` | Candidate number |
| `data[].name` | `string` | Contestant name |
| `message` | `string` | Success message |

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
| `400` | `SCORING_ROUND_ID_INVALID` | Round ID must be a positive whole number. | `field`: `get_round_contestants_input_id`. Backend API layer only — do not handle in frontend |
| `404` | `SCORING_ROUND_NOT_FOUND` | Round not found. | Round `id` does not exist |
| `500` | `SCORING_CONTESTANTS_GET_ERROR` | Unable to get contestants. | Unexpected failure while loading contestants |
