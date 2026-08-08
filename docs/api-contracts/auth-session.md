# Get Session

`GET /session/me`

## Request

**Headers**

| Header          | Required | Value                                                       |
| --------------- | -------- | ----------------------------------------------------------- |
| `Cookie`        | Yes      | `sid` session cookie                                        |
| `Cookie`        | Yes      | `csrfToken` cookie                                          |
| `X-CSRF-Token`  | Yes      | Must match `csrfToken` cookie value                         |
| `X-Fingerprint` | Yes      | JSON string, non-empty object e.g. `{"X-Fingerprint":"{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"}` |

## Response

**200**

```json
{
  "user": {
    "id": 1,
    "name": "string",
    "username": "string",
    "role": "ADMIN" | "JUDGE"
  }
}
```

Rotates cookies when session token expires in less than 1 hour: `sid`, `csrfToken`

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
