# Category Fields

Admin only.

The category field editor uses two endpoints on the same resource:

1. `GET /categories/:id/fields` — fetch existing fields and lock state when opening the field editor
2. `PUT /categories/:id/fields` — save the full field batch

**Frontend field editor rules**

| Rule | Detail |
|------|--------|
| Open editor | Always refetch `GET /categories/:id/fields` on open (stale-tab safety) |
| Empty state | When `fields` is empty, show one empty row for admin to fill |
| Locked category | When `isLocked = true`, render fields read-only, hide Save Fields, show locked note |
| Save | Submit full batch via PUT; backend enforces lock — show error toast if bypassed |

---

## Get Category Fields

`GET /categories/:id/fields`

Used when the admin clicks **[ Fields ]** on a category row.

Unlike save, this endpoint **always returns `200`** when the category exists — including when locked. Use `isLocked` to control editability in the UI.

### Request

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

### Response

**200**

```json
{
  "data": {
    "categoryName": "Swimwear",
    "isLocked": false,
    "fields": [
      {
        "id": 1,
        "name": "Stage Presence",
        "maxValue": 40
      },
      {
        "id": 2,
        "name": "Poise",
        "maxValue": 35
      },
      {
        "id": 3,
        "name": "Confidence",
        "maxValue": 25
      }
    ]
  },
  "message": "Category fields retrieved successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetCategoryFieldsDTO` | Field editor payload |
| `data.categoryName` | `string` | Category name — used in editor title (e.g. `"Swimwear — Scoring Fields"`) |
| `data.isLocked` | `boolean` | `true` when scores already exist — render read-only editor and hide Save Fields |
| `data.fields` | `CategoryFieldDTO[]` | Existing criteria fields — ordered by `maxValue` descending |
| `data.fields[].id` | `number` | Criteria field ID |
| `data.fields[].name` | `string` | Field name |
| `data.fields[].maxValue` | `number` | Max score — returned as a **number** with up to **2** decimal places |
| `message` | `string` | Success message |

Returns `fields: []` when the category exists but has no scoring fields configured yet.

When locked, returns `200` with `isLocked: true` and the existing fields — does **not** return `CATEGORY_LOCKED`.

> **Response vs request `maxValue`:** GET returns `maxValue` as a `number`. PUT expects `maxValue` as a `string` in the request body. Frontend should convert field input strings for save (e.g. use input `.value` as string when building the PUT payload).

### Errors

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
| `400` | `CATEGORY_ID_INVALID` | Category ID must be a valid number. | Backend API layer only. Do not handle in frontend. |
| `404` | `CATEGORY_NOT_FOUND` | Category not found. | |
| `500` | `CATEGORY_FIELDS_GET_ERROR` | Unable to get category fields. | |

---

## Save Category Fields

`PUT /categories/:id/fields`

Replaces all scoring fields for a category in one request. The backend deletes every existing field for the category and inserts the submitted batch in a single transaction.

Used when the admin clicks **Save Fields** in the category field editor.

**Frontend save rules**

| Rule | Detail |
|------|--------|
| Batch only | Submit the full field set in one request — no partial saves |
| Running total | Live total must equal **100** before Save Fields is enabled |
| Replace-all | Rows removed in the UI are omitted from the request body; backend replaces the entire set |
| Locked category | Rejected when `isLocked = true` (scores already exist for this category) — field editor is read-only |
| After success | Show success toast, refetch `GET /categories` to refresh field count / ✓ status, close editor |

### Request

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
  "fields": [
    {
      "name": "Stage Presence",
      "maxValue": "40"
    },
    {
      "name": "Poise",
      "maxValue": "35"
    },
    {
      "name": "Confidence",
      "maxValue": "25"
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `fields` | `CategoryFieldRequestBody[]` | Yes | At least one field — full batch that replaces all existing fields |
| `fields[].name` | `string` | Yes | Non-empty after trim — free text (e.g. `"Stage Presence"`) |
| `fields[].maxValue` | `string` | Yes | See **maxValue rules** below |

**maxValue rules** *(important — request body)*

Send `maxValue` as a **string**, not a JSON number. Numeric values in the JSON body are rejected.

| Rule | Detail |
|------|--------|
| Type | Must be a non-empty `string` (e.g. `"40"`, `"33.33"`) |
| Decimal places | Up to **2** decimal places — matches `decimal(5,2)` storage |
| Minimum | Must be at least **1** per field |
| Batch total | Sum of all `maxValue`s in the batch must equal exactly **100** — validated server-side with decimal precision |
| Examples | Valid: `"100"`, `"40"`, `"33.33"`, `"33.34"` — Invalid: `40` (number), `"0"`, `"10.123"`, `"abc"` |

> Frontend: bind max-score inputs as strings (e.g. from `<input type="number">` use `.value` as string). Do not `JSON.stringify` numeric types for `maxValue`.

Field IDs are not accepted — this endpoint always replaces the full field set.

### Response

**200**

```json
{
  "message": "Category fields saved successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `message` | `string` | Success message |

### Errors

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

| Status | Code                                | Message                                                                   | Notes                                                                                                                                      |
| ------ | ----------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `400`  | `CATEGORY_ID_INVALID`               | Category ID must be a valid number.                                       | Backend API layer only. Do not handle in frontend.                                                                                         |
| `400`  | `CATEGORY_FIELDS_REQUIRED`          | Add at least one scoring field.                                           |                                                                                                                                            |
| `400`  | `CATEGORY_FIELD_NAME_REQUIRED`      | Field name is required.                                                   | `field` includes row index, e.g. `save_category_fields_input_fields_0_name`                                                                |
| `400`  | `CATEGORY_FIELD_MAX_VALUE_REQUIRED` | Max score is required.                                                    | `field` includes row index, e.g. `save_category_fields_input_fields_0_max_value` — returned when value is missing or sent as a JSON number |
| `400`  | `CATEGORY_FIELD_MAX_VALUE_INVALID`  | Max score must be at least 1 with up to 2 decimal places.                 |                                                                                                                                            |
| `400`  | `CATEGORY_FIELDS_TOTAL_INVALID`     | Scoring fields must total exactly 100.                                    |                                                                                                                                            |
| `400`  | `CATEGORY_LOCKED`                   | Category cannot be edited because scores already exist for this category. | Save Fields rejected once judging has started                                                                                              |
| `404`  | `CATEGORY_NOT_FOUND`                | Category not found.                                                       |                                                                                                                                            |
| `500`  | `CATEGORY_FIELDS_SAVE_ERROR`        | Unable to save scoring fields.                                            |                                                                                                                                            |
