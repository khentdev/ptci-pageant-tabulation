# Submit Category Scores

`POST /judge-scoring/categories/:id/scores`

Judge only.

Submits **all** of this judge's contestant scores for a category in a single request. The backend validates the batch is complete and in-range, then inserts every row in one transaction — all succeed or all fail ([[System Documentation]] §4).

Judge identity is taken from the session, never from the request body.

**Frontend submit rules**

| Rule | Detail |
|------|--------|
| Batch only | Submit every contestant × every field in one request — Submit All is disabled until all inputs are filled ([[Wireframe & Flows]] §12) |
| No per-contestant submit | Judges edit all contestants freely before clicking one Submit All button for the category |
| One-shot | Once submitted, the category becomes permanently read-only for this judge — there is no edit or re-submit endpoint |
| After success | Refetch [[judge-scoring/judge-scoring-category-scores]] (or just flip local state) so the grid becomes read-only with the submitted values retained and Submit All hidden |
| On failure | Leave inputs editable and show the error inline — do not clear what the judge entered |

## Request

**Headers** *(frontend sets explicitly)*

| Header          | Required | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Type`  | Yes      | `application/json`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
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

**Body**

```json
{
  "scores": [
    { "contestantId": 3, "criteriaFieldId": 1, "value": "38" },
    { "contestantId": 3, "criteriaFieldId": 2, "value": "33" },
    { "contestantId": 5, "criteriaFieldId": 1, "value": "40" },
    { "contestantId": 5, "criteriaFieldId": 2, "value": "30" }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `scores` | `SubmitCategoryScoreEntry[]` | Yes | Must contain **exactly one row per (contestant × field)** combination in the category/round — no partial submission |
| `scores[].contestantId` | `number` | Yes | Must be a contestant eligible in this category's round (see [[judge-scoring/judge-scoring-round-contestants]]) |
| `scores[].criteriaFieldId` | `number` | Yes | Must belong to this category (see [[judge-scoring/judge-scoring-category-fields]]) |
| `scores[].value` | `string` | Yes | See **value rules** below |

**value rules** *(important — request body)*

Send `value` as a **string**, not a JSON number — same convention as `maxValue` on [[category-fields/categories-fields-save]].

| Rule | Detail |
|------|--------|
| Type | Must be a non-empty `string` (e.g. `"38"`, `"33.5"`) |
| Decimal places | Up to 2 decimal places — matches `decimal(5,2)` storage |
| Range | Must be between `0` and the field's `maxValue`, inclusive |
| Examples | Valid: `"0"`, `"38"`, `"33.5"` — Invalid: `38` (number), `"-1"`, `"40.123"`, `"abc"` |

## Response

**201**

```json
{
  "message": "Scores submitted successfully."
}
```

| Field | Type | Notes |
|-------|------|-------|
| `message` | `string` | Success message |

## Business rules enforced server-side

| Rule | Behavior when violated |
|------|------------------------|
| All fields for all eligible contestants must be present, no duplicates | `SCORING_SCORES_INCOMPLETE` |
| Every `contestantId` must be eligible in the round | `SCORING_CONTESTANT_NOT_IN_ROUND` |
| Every `criteriaFieldId` must belong to the category | `SCORING_FIELD_NOT_IN_CATEGORY` |
| Every `value` must be `0 ≤ value ≤ field.maxValue` | `SCORING_VALUE_OUT_OF_RANGE` (`data.contestantId`, `data.criteriaFieldId`, `data.maxValue`) |
| Cannot resubmit — scores already exist for this judge + category | `SCORING_ALREADY_SUBMITTED`. Also enforced by the `Score` table's `[judgeId, contestantId, criteriaFieldId]` unique constraint as a second layer against concurrent double-submits |
| Cannot submit once winners are declared for this round | `SCORING_ROUND_LOCKED` |
| Cannot submit once a later round has already been populated (this round is completed) | `SCORING_ROUND_COMPLETED` |
| Scores are immutable | There is no edit/delete endpoint — once inserted, a score row is permanent |

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
| `400` | `SCORING_CATEGORY_ID_INVALID` | Category ID must be a positive whole number. | `field`: `submit_category_scores_input_id`. Backend API layer only |
| `400` | `SCORING_SCORES_REQUIRED` | At least one score is required. | `scores` missing or empty |
| `400` | `SCORING_SCORE_ENTRY_INVALID` | Each score must include a valid contestant, field, and value. | `field` includes row index, e.g. `submit_category_scores_input_scores_0` |
| `400` | `SCORING_VALUE_INVALID` | Score value must be a number with at most 2 decimal places. | `value` not sent as a valid numeric string |
| `400` | `SCORING_DUPLICATE_ENTRY` | Duplicate score entry for the same contestant and field. | Same `(contestantId, criteriaFieldId)` pair appears twice in the batch |
| `400` | `SCORING_CATEGORY_NO_FIELDS` | This category has no scoring fields yet. | Category has zero `CriteriaField` rows |
| `400` | `SCORING_ROUND_NO_CONTESTANTS` | This round has no contestants yet. | Round has zero eligible contestants |
| `400` | `SCORING_CONTESTANT_NOT_IN_ROUND` | A submitted contestant is not part of this round. | `data.contestantId` |
| `400` | `SCORING_FIELD_NOT_IN_CATEGORY` | A submitted field does not belong to this category. | `data.criteriaFieldId` |
| `400` | `SCORING_SCORES_INCOMPLETE` | All fields for all contestants must be filled before submitting. | Row count doesn't match `contestants × fields`, or a pair is missing |
| `400` | `SCORING_VALUE_OUT_OF_RANGE` | Score value must be between 0 and the field's maximum. | `data.contestantId`, `data.criteriaFieldId`, `data.maxValue` |
| `400` | `SCORING_ALREADY_SUBMITTED` | Scores for this category have already been submitted. | Double-submit — by this same request or a concurrent one |
| `400` | `SCORING_ROUND_LOCKED` | Winners for this round have already been declared. | |
| `400` | `SCORING_ROUND_COMPLETED` | This round has already been completed. | A later round already has contestants |
| `404` | `SCORING_CATEGORY_NOT_FOUND` | Category not found. | Category `id` does not exist |
| `500` | `SCORING_SUBMIT_ERROR` | Unable to submit scores. | Unexpected failure while inserting scores |
