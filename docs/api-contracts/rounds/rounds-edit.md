# Edit Round

Admin only.

The edit round flow uses two endpoints on the same resource:

1. `GET /rounds/:id` — fetch current values and lock state when opening the edit form
2. `PATCH /rounds/:id` — save changes

**Frontend form rules**

| Field | Rule |
|-------|------|
| Name | Always editable |
| Phase order | Always read-only (display only — not sent on save) |
| Contestant limit | Hidden when `phaseOrder === 1` (omit from request or send `null`); editable when `phaseOrder > 1` and `isLimitLocked = false`; read-only when `isLimitLocked = true` |

---

## Get Round By Id

`GET /rounds/:id`

Used when the admin clicks **Edit** on a round row.

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
| `id` | `number` | Yes | Round ID — positive whole number |

### Response

**200**

```json
{
  "data": {
    "id": 2,
    "phaseOrder": 2,
    "name": "Top 10",
    "contestantLimit": 10,
    "isLimitLocked": false
  },
  "message": "Round retrieved successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetRoundByIdDTO` | Round details for the edit form |
| `data.id` | `number` | Round ID |
| `data.phaseOrder` | `number` | Round sequence order — always read-only in the edit form |
| `data.name` | `string` | Round name |
| `data.contestantLimit` | `number \| null` | `null` = unlimited (preliminary round) |
| `data.isLimitLocked` | `boolean` | `true` when contestants have already advanced into this round |
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

| Status | Code | Message |
|--------|------|---------|
| `400` | `ROUND_ID_INVALID` | Round ID must be a valid number. |
| `400` | `INVALID_DEVICE_ID` | Unable to verify your device. Please refresh the page and try again. |
| `401` | `SESSION_UNAUTHORIZED` | Your session is invalid or has expired. Please log in again. |
| `401` | `TOKEN_EXPIRED` | Token has expired. |
| `401` | `TOKEN_INVALID` | Invalid or malformed token. |
| `403` | `FORBIDDEN` | You do not have permission to perform this action. |
| `404` | `ROUND_PHASE_NOT_FOUND` | Round phase not found. |
| `500` | `ROUND_PHASE_GET_BY_ID_ERROR` | Unable to get round phase. Please try again later. |
| `500` | `SERVER_ERROR` | Something went wrong on our end. Please try again later. |

---

## Save Round

`PATCH /rounds/:id`

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
| `id` | `number` | Yes | Round ID — positive whole number |

**Body**

```json
{
  "name": "string",
  "contestantLimit": 10
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `string` | Yes | Non-empty after trim — always editable |
| `contestantLimit` | `number \| null` | Conditional | Omit or send `null` for preliminary round (`phaseOrder = 1`). Positive whole number for later rounds. Must match the existing value when `isLimitLocked = true`. |

Phase order is immutable after creation and is not accepted in the request body.

### Response

**200**

```json
{
  "message": "Round edited successfully"
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

| Status | Code | Message |
|--------|------|---------|
| `400` | `ROUND_ID_INVALID` | Round ID must be a valid number. |
| `400` | `ROUND_NAME_INVALID` | Round name is required. |
| `400` | `ROUND_CONTESTANT_LIMIT_INVALID` | Contestant limit must be a positive whole number. |
| `400` | `ROUND_CONTESTANT_LIMIT_LOCKED` | Contestant limit cannot be changed after contestants have advanced into this round |
| `400` | `ROUND_PRELIMINARY_LIMIT_LOCKED` | Preliminary round contestant limit is always unlimited. |
| `400` | `INVALID_DEVICE_ID` | Unable to verify your device. Please refresh the page and try again. |
| `401` | `SESSION_UNAUTHORIZED` | Your session is invalid or has expired. Please log in again. |
| `401` | `TOKEN_EXPIRED` | Token has expired. |
| `401` | `TOKEN_INVALID` | Invalid or malformed token. |
| `403` | `FORBIDDEN` | You do not have permission to perform this action. |
| `404` | `ROUND_PHASE_NOT_FOUND` | Round phase not found. |
| `500` | `ROUND_PHASE_EDIT_ERROR` | Unable to edit round phase. Please try again later. |
| `500` | `SERVER_ERROR` | Something went wrong on our end. Please try again later. |
