# Edit Judge

`PATCH /judges/:id`

Admin only.

Updates a judge's name and username. Name and username are always editable — no lock condition applies even when the judge has submitted scores. Username must remain unique system-wide across all users.

**Frontend form rules**

| Field | Rule |
|-------|------|
| Name | Required — at least 3 characters after trim |
| Username | Required — at least 3 characters after trim; must be unique system-wide |

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
| `id` | `number` | Yes | Judge ID — positive whole number |

**Body**

```json
{
  "name": "Judge One",
  "username": "judge1"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `string` | Yes | At least 3 characters after trim |
| `username` | `string` | Yes | At least 3 characters after trim; must be unique across all users |

## Response

**200**

```json
{
  "message": "Judge updated successfully."
}
```

| Field | Type | Notes |
|-------|------|-------|
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
| `400` | `JUDGE_ID_INVALID` | Judge ID must be a positive whole number. | Backend API layer only. Do not handle in frontend. `field`: `edit_judge_input_id` |
| `400` | `JUDGE_NAME_TOO_SHORT` | Name must be at least 3 characters long. | `field`: `judge_name_input` |
| `400` | `JUDGE_USERNAME_TOO_SHORT` | Username must be at least 3 characters long. | `field`: `judge_username_input` |
| `400` | `JUDGE_USERNAME_EXISTS` | Username already exists. | Applies to any existing user, including admins |
| `404` | `JUDGE_NOT_FOUND` | Judge not found. | Includes admin IDs and non-existent IDs |
| `500` | `JUDGE_EDIT_FAILED` | Unable to edit judge. | |
