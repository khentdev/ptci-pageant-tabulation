# Get Rounds List

`GET /rounds`

Admin only.

## Consumers

- Admin Setup → Rounds list page
- Admin Live Event → Round Results sidebar — see [[live-event/live-results-sidebar]]
- Admin Setup → Add Category round dropdown — see [[categories/categories-add]]

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

See [[global/errors]] for shared error codes handled by the axios interceptor.

| Status | Code | Message |
|--------|------|---------|
| `500` | `ROUND_PHASE_GET_LIST_ERROR` | Unable to get round phases. Please try again later. |
