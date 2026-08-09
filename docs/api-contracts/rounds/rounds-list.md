# Get Rounds List

`GET /rounds`

Admin only.

## Request

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

## Response

**200**

```json
{
  "data": [
    {
      "id": 1,
      "phaseOrder": 1,
      "name": "Preliminary",
      "contestantLimit": null
    },
    {
      "id": 2,
      "phaseOrder": 2,
      "name": "Top 10",
      "contestantLimit": 10
    }
  ],
  "message": "Rounds list retrieved successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetRoundsListDTO[]` | Ordered by `phaseOrder` ascending |
| `data[].id` | `number` | Round ID |
| `data[].phaseOrder` | `number` | Round sequence order |
| `data[].name` | `string` | Round name |
| `data[].contestantLimit` | `number \| null` | `null` = unlimited (preliminary round) |
| `message` | `string` | Success message |

Returns an empty array when no rounds exist.

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
| `403` | `FORBIDDEN` | You do not have permission to perform this action. |
| `500` | `ROUND_PHASE_GET_LIST_ERROR` | Unable to get round phases. Please try again later. |
| `500` | `SERVER_ERROR` | Something went wrong on our end. Please try again later. |
