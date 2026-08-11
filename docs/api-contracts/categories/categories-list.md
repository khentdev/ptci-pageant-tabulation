# Get Category List

`GET /categories`

Admin only.

Returns all rounds with their categories grouped underneath. Used on the Admin Setup → Categories page to render the grouped list (field count, scoring-field status, and per-row actions).

Rounds are ordered by `phaseOrder` ascending. Categories within each round are ordered by `name` ascending.

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

## Response

**200**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Preliminary",
      "phaseOrder": 1,
      "categories": [
        {
          "id": 1,
          "name": "Swimwear",
          "fieldCount": 4,
          "totalScore": 100,
          "isLocked": false
        },
        {
          "id": 2,
          "name": "Talent",
          "fieldCount": 4,
          "totalScore": 100,
          "isLocked": false
        },
        {
          "id": 3,
          "name": "Production",
          "fieldCount": 0,
          "totalScore": 0,
          "isLocked": false
        }
      ]
    },
    {
      "id": 2,
      "name": "Top 5",
      "phaseOrder": 2,
      "categories": [
        {
          "id": 4,
          "name": "Q&A",
          "fieldCount": 2,
          "totalScore": 100,
          "isLocked": true
        }
      ]
    }
  ],
  "message": "Category list retrieved successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetCategoryListDTO[]` | Rounds with nested categories — ordered by `phaseOrder` ascending |
| `data[].id` | `number` | Round ID |
| `data[].name` | `string` | Round name — used as the group heading in the list UI |
| `data[].phaseOrder` | `number` | Round sequence order |
| `data[].categories` | `CategoryDTO[]` | Categories in this round — ordered by `name` ascending; empty array when the round has no categories |
| `data[].categories[].id` | `number` | Category ID |
| `data[].categories[].name` | `string` | Category name |
| `data[].categories[].fieldCount` | `number` | Number of scoring fields configured for this category |
| `data[].categories[].totalScore` | `number` | Sum of `maxValue` across all criteria fields in this category |
| `data[].categories[].isLocked` | `boolean` | `true` when scores already exist for this category — hide Edit and Delete in the list UI |
| `message` | `string` | Success message |

**Frontend list UI rules**

| Signal        | Rule                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Field status  | Show `✓` with field count when `fieldCount > 0` and `totalScore === 100`; show `No fields` when `fieldCount === 0` |
| Edit / Delete | Hide when `isLocked = true`; show when `isLocked = false` |
| Fields        | Always available — opens the field editor for that category                                                        |

Returns an empty array when no rounds exist. Rounds without categories still appear with `categories: []`.

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

| Status | Code | Message |
|--------|------|---------|
| `500` | `CATEGORY_GET_LIST_ERROR` | Unable to get category list. |
