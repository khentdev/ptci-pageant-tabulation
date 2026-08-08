# Login

`POST /auth/login`

## Request

**Headers**

| Header          | Required | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Type`  | Yes      | `application/json`                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `X-Fingerprint` | Yes      | JSON string, non-empty object e.g. `{"X-Fingerprint":"{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"}` |

**Body**

```json
{
  "username": "string",
  "password": "string"
}
```

## Response

**200**

```json
{
  "data": {
    "user": {
      "id": 1,
      "name":"string",
      "username": "string",
      "role": "ADMIN" | "JUDGE"
    }
  },
  "message": "Logged in successfully"
}
```

Sets cookies:

| Cookie | Sent by | Notes |
|--------|---------|-------|
| `sid` | Server | HttpOnly — auto-sent by browser on subsequent requests |
| `csrfToken` | Server | Read value and send as `X-CSRF-Token` header on subsequent requests |

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

| Status | Code                  | Message                                                              |     |
| ------ | --------------------- | -------------------------------------------------------------------- | --- |
| `400`  | `INVALID_DEVICE_ID`   | Unable to verify your device. Please refresh the page and try again. |     |
| `400`  | `INVALID_USERNAME`    | Username is required.                                                |     |
| `400`  | `INVALID_PASSWORD`    | Password is required.                                                |     |
| `401`  | `INVALID_CREDENTIALS` | Invalid username or password. Please try again.                      |     |
| `500`  | `SERVER_ERROR`        | Something went wrong on our end. Please try again later.             |     |
