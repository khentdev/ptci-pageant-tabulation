# Get My Category Scores

`GET /judge-scoring/categories/:id/scores`

Judge only.

Returns the **calling judge's own** submitted scores for a category, and whether the category is already submitted. Fetched alongside [[judge-scoring/judge-scoring-round-contestants]] and [[judge-scoring/judge-scoring-category-fields]] when a judge opens a category.

Judge identity is taken from the session, never from a request parameter — a judge can never see or affect another judge's scores through this endpoint.

**Submitted state is per judge + category, all-or-nothing.** If any score row exists for this judge in this category, `isSubmitted` is `true` and the frontend renders the whole grid read-only with the submitted values, hides Submit All, and shows a "✓ Submitted" badge in the header ([[System Documentation]] §4).

## When to fetch

| Trigger | Fetch? |
|---------|--------|
| Judge opens a category (alongside contestants + fields) | Yes |
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
| `id` | `number` | Yes | Category ID — positive whole number |

No request body. Judge is identified from the session cookie.

## Response

**200**

```json
{
  "data": {
    "isSubmitted": true,
    "scores": [
      { "contestantId": 3, "criteriaFieldId": 1, "value": 38 },
      { "contestantId": 3, "criteriaFieldId": 2, "value": 33 },
      { "contestantId": 5, "criteriaFieldId": 1, "value": 40 },
      { "contestantId": 5, "criteriaFieldId": 2, "value": 30 }
    ]
  },
  "message": "Scores fetched successfully."
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetMyCategoryScoresDTO` | This judge's scores for the category |
| `data.isSubmitted` | `boolean` | `true` when any score exists for this judge + category. Frontend renders the whole grid read-only when `true` |
| `data.scores` | `MyCategoryScoreDTO[]` | Empty array when not yet submitted |
| `data.scores[].contestantId` | `number` | Contestant the score belongs to |
| `data.scores[].criteriaFieldId` | `number` | Criteria field the score belongs to |
| `data.scores[].value` | `number` | Submitted value, up to 2 decimal places |
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
| `400` | `SCORING_CATEGORY_ID_INVALID` | Category ID must be a positive whole number. | `field`: `get_my_category_scores_input_id`. Backend API layer only — do not handle in frontend |
| `404` | `SCORING_CATEGORY_NOT_FOUND` | Category not found. | Category `id` does not exist |
| `500` | `SCORING_SCORES_GET_ERROR` | Unable to get scores. | Unexpected failure while loading scores |
