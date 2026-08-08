# Logout

`DELETE /session/logout`

## Request

**Headers**

| Header | Required | Value |
|--------|----------|-------|
| `Cookie` | Yes | `sid` session cookie |
| `Cookie` | Yes | `csrfToken` cookie |
| `X-CSRF-Token` | Yes | Must match `csrfToken` cookie value |
| `X-Fingerprint` | Yes | JSON string, non-empty object e.g. `{"visitorId":"abc123"}` |

## Response

**200**

```json
{
  "message": "Logged out successfully."
}
```

Clears cookies: `sid`, `csrfToken`

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

| Status | Code | Message |
|--------|------|---------|
| `400` | `INVALID_DEVICE_ID` | Unable to verify your device. Please refresh the page and try again. |
| `401` | `SESSION_UNAUTHORIZED` | Your session is invalid or has expired. Please log in again. |
| `401` | `TOKEN_EXPIRED` | Token has expired. |
| `401` | `TOKEN_INVALID` | Invalid or malformed token. |
| `500` | `SERVER_ERROR` | Something went wrong on our end. Please try again later. |
