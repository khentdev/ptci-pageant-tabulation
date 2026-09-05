# Get Category Scoring Fields

`GET /judge-scoring/categories/:id/fields`

Judge only.

Returns the scoring criteria fields for a category, ordered by `maxValue` descending — used to render the scoring grid's columns (field header shows max as a label, e.g. `Stage (40)`).

This is the judge-facing counterpart to the admin [[category-fields/categories-fields-save]] `GET /categories/:id/fields` endpoint — same underlying `CriteriaField` data, but scoped to the judge role and without the `isLocked` (admin edit-lock) concept, since judges never edit fields.

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

No request body.

## Response

**200**

```json
{
  "data": {
    "categoryId": 10,
    "categoryName": "Formal Wear",
    "roundId": 1,
    "fields": [
      { "id": 1, "name": "Stage Presence", "maxValue": 40 },
      { "id": 2, "name": "Poise", "maxValue": 35 },
      { "id": 3, "name": "Confidence", "maxValue": 25 }
    ]
  },
  "message": "Scoring fields fetched successfully."
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetCategoryScoringFieldsDTO` | Field payload for the scoring grid |
| `data.categoryId` | `number` | Category ID |
| `data.categoryName` | `string` | Category name — used in the grid header |
| `data.roundId` | `number` | Round the category belongs to |
| `data.fields` | `CategoryScoringFieldDTO[]` | Criteria fields, ordered by `maxValue` descending. Empty array when no fields are configured yet |
| `data.fields[].id` | `number` | Criteria field ID |
| `data.fields[].name` | `string` | Field name |
| `data.fields[].maxValue` | `number` | Max score — returned as a **number** with up to 2 decimal places |
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
| `400` | `SCORING_CATEGORY_ID_INVALID` | Category ID must be a positive whole number. | `field`: `get_category_scoring_fields_input_id`. Backend API layer only — do not handle in frontend |
| `404` | `SCORING_CATEGORY_NOT_FOUND` | Category not found. | Category `id` does not exist |
| `500` | `SCORING_FIELDS_GET_ERROR` | Unable to get scoring fields. | Unexpected failure while loading fields |
