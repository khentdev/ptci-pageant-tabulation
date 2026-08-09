# Add Round

`POST /rounds`

Admin only.

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
  "phaseOrder": 1,
  "contestantLimit": null
}
```

| Field             | Type              | Required    | Notes                                                                               |
| ----------------- | ----------------- | ----------- | ----------------------------------------------------------------------------------- |
| `name`            | `string`          | Yes         | Non-empty after trim                                                                |
| `phaseOrder`      | `number`          | Yes         | Positive whole number                                                               |
| `contestantLimit` | `number \| null`  | Conditional | Optional for `phaseOrder = 1` (stored as unlimited). Required for `phaseOrder > 1`. |

## Response

**201**

```json
{
  "message": "Round added successfully"
}
```

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

| Status | Code | Message |
|--------|------|---------|
| `400` | `ROUND_NAME_INVALID` | Round name is required. |
| `400` | `ROUND_PHASE_ORDER_INVALID` | Phase order must be a positive whole number. |
| `400` | `ROUND_CONTESTANT_LIMIT_INVALID` | Contestant limit must be a positive whole number. |
| `400` | `ROUND_PHASE_NO_PRELIMINARY_ROUND_EXISTS` | There is no preliminary round exists. Please create first round first. |
| `400` | `ROUND_PHASE_ORDER_ALREADY_EXISTS` | The first round has already been created. Please create a new round with a higher phase order. |
| `400` | `ROUND_PHASE_ORDER_DUPLICATE` | A round with this phase order already exists. Please use a different phase order. |
| `400` | `ROUND_CONTESTANT_LIMIT_REQUIRED` | Contestant limit is required for rounds after the preliminary round. |
| `500` | `ROUND_PHASE_ADD_ERROR` | Unable to add round phase. Please try again later. |
