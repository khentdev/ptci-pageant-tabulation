# Get Judges List

`GET /judges`

Admin only.

Returns all judge accounts. Used on the Admin Setup → Judges list page.

Only users with role `JUDGE` are included — admin accounts are never returned.

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
      "name": "Judge One",
      "username": "judge.one"
    },
    {
      "id": 2,
      "name": "Judge Two",
      "username": "judge.two"
    }
  ],
  "message": "Judge list fetched successfully."
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetJudgeListDTO[]` | Judge accounts only |
| `data[].id` | `number` | Judge ID |
| `data[].name` | `string` | Judge display name |
| `data[].username` | `string` | Login username |
| `message` | `string` | Success message |

Returns an empty array when no judges exist.

Password hash, role, and timestamps are never included in list entries.

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
| `500` | `JUDGE_GET_LIST_FAILED` | Unable to get judge list. |
