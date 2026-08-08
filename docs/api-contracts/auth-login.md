# Login

`POST /auth/login`

## Request

**Headers**

| Header          | Required | Value                                                       |
| --------------- | -------- | ----------------------------------------------------------- |
| `Content-Type`  | Yes      | `application/json`                                          |
| `X-Fingerprint` | Yes      | JSON string, non-empty object e.g. `{"visitorId":"abc123"}` |

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
      "username": "string",
      "role": "ADMIN" | "JUDGE"
    }
  },
  "message": "Logged in successfully"
}
```

Sets cookies: `sid`, `csrfToken`

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
