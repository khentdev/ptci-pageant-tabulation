# Edit Category

Admin only.

The edit category flow uses two endpoints on the same resource:

1. `GET /categories/:id` — fetch current values and lock state when opening the edit form
2. `PATCH /categories/:id` — save changes

**Frontend form rules**

| Field | Rule |
|-------|------|
| Round | Always read-only (display only — not sent on save) |
| Name | Required — non-empty after trim; editable when `isLocked = false`; read-only when `isLocked = true` |

---

## Get Category By Id

`GET /categories/:id`

Used when the admin clicks **Edit** on a category row.

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

### Response

**200**

```json
{
  "data": {
    "id": 1,
    "name": "Swimwear",
    "roundId": 1,
    "roundName": "Preliminary",
    "isLocked": false
  },
  "message": "Category retrieved successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetCategoryByIdDTO` | Category details for the edit form |
| `data.id` | `number` | Category ID |
| `data.name` | `string` | Category name |
| `data.roundId` | `number` | Round ID — always read-only in the edit form |
| `data.roundName` | `string` | Round name — always read-only in the edit form |
| `data.isLocked` | `boolean` | `true` when scores already exist for this category |
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

| Status | Code | Message | Notes |
|--------|------|---------|-------|
| `400` | `CATEGORY_ID_INVALID` | Category ID must be a valid number. | Backend API layer only. Do not handle in frontend. |
| `404` | `CATEGORY_NOT_FOUND` | Category not found. | |
| `500` | `CATEGORY_GET_BY_ID_ERROR` | Unable to get category by id. | |

---

## Save Category

`PATCH /categories/:id`

Used when the admin submits the edit form.

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
  "name": "string"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `string` | Yes | Non-empty after trim — editable only when `isLocked = false` |

Round assignment is immutable after creation and is not accepted in the request body.

### Response

**200**

```json
{
  "message": "Category updated successfully"
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

| Status | Code | Message | Notes |
|--------|------|---------|-------|
| `400` | `CATEGORY_ID_INVALID` | Category ID must be a valid number. | Backend API layer only. Do not handle in frontend. |
| `400` | `CATEGORY_NAME_REQUIRED` | Category name is required. | |
| `400` | `CATEGORY_LOCKED` | Category cannot be edited because scores already exist for this category. | |
| `404` | `CATEGORY_NOT_FOUND` | Category not found. | |
| `500` | `CATEGORY_EDIT_ERROR` | Unable to edit category. | |
