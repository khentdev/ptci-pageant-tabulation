# Add Category

`POST /categories`

Admin only.

Creates a category with a name and round assignment only. Scoring fields are added separately after creation via the category field editor.

**Frontend form rules**

| Field | Rule |
|-------|------|
| Round | Required — dropdown populated from `GET /rounds` (fetched live when the form opens) |
| Name | Required — non-empty after trim |

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

**Body**

```json
{
  "name": "string",
  "roundId": "1"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | `string` | Yes | Non-empty after trim |
| `roundId` | `string` | Yes | Non-empty string that parses to a positive whole number |

## Response

**201**

```json
{
  "message": "Category added successfully"
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

| Status | Code | Message |
|--------|------|---------|
| `400` | `CATEGORY_NAME_INVALID` | Category name is invalid |
| `400` | `CATEGORY_ROUND_ID_INVALID` | Category round id is invalid |
| `400` | `INVALID_DEVICE_ID` | Unable to verify your device. Please refresh the page and try again. |
| `401` | `SESSION_UNAUTHORIZED` | Your session is invalid or has expired. Please log in again. |
| `401` | `TOKEN_EXPIRED` | Token has expired. |
| `401` | `TOKEN_INVALID` | Invalid or malformed token. |
| `403` | `FORBIDDEN` | You do not have permission to perform this action. |
| `404` | `ROUND_PHASE_NOT_FOUND` | Round phase not found. |
| `500` | `CATEGORY_ADD_ERROR` | Error adding category |
| `500` | `SERVER_ERROR` | Something went wrong on our end. Please try again later. |
