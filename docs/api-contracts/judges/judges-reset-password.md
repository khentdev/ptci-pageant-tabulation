# Reset Judge Password

`PATCH /judges/:id/password`

Admin only.

Resets a judge's password. The new password is hashed with argon2 before storage. The judge's existing session remains valid after reset; the new password is required on next login.

**Frontend form rules**

| Field | Rule |
|-------|------|
| New Password | Required — at least 8 characters after trim |

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
  "password": "newsecurepass"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `password` | `string` | Yes | At least 8 characters after trim; stored as an argon2 hash |

## Response

**200**

```json
{
  "message": "Judge password reset successfully."
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
| `400` | `JUDGE_ID_INVALID` | Judge ID must be a positive whole number. | Backend API layer only. Do not handle in frontend. `field`: `reset_judge_password_input_id` |
| `400` | `JUDGE_PASSWORD_TOO_SHORT` | Password must be at least 8 characters long. | `field`: `judge_password_input` |
| `404` | `JUDGE_NOT_FOUND` | Judge not found. | Includes admin IDs and non-existent IDs |
| `500` | `JUDGE_RESET_PASSWORD_FAILED` | Unable to reset judge password. | |
