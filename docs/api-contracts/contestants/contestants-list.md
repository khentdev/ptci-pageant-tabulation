# Get Contestants List

`GET /contestants`

Admin only.

Returns all contestants, optionally filtered by gender. Used on the Admin Setup → Contestants list page.

**Frontend filter rules**

| Filter | Request |
|--------|---------|
| All | Omit `filter` query param (or send empty) |
| Male | `?filter=MALE` |
| Female | `?filter=FEMALE` |

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

**Query params**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `filter` | `string` | No | `MALE` or `FEMALE` (case-insensitive). Omit for all contestants. |

## Response

**200**

```json
{
  "data": [
    {
      "id": 1,
      "candidateNumber": 1,
      "name": "Aniar, Andrea Mae",
      "gender": "FEMALE",
      "teamName": "Yellow Team",
      "teamColor": "Yellow"
    },
    {
      "id": 2,
      "candidateNumber": 2,
      "name": "Santos, Juan",
      "gender": "MALE",
      "teamName": "Blue Team",
      "teamColor": "Blue"
    },
    {
      "id": 3,
      "candidateNumber": 3,
      "name": "Dela Cruz, Christine",
      "gender": "FEMALE",
      "teamName": "Purple Team",
      "teamColor": "Purple"
    }
  ],
  "message": "Contestants fetched successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetAllContestantsDTO[]` | Ordered by `candidateNumber` ascending |
| `data[].id` | `number` | Internal database ID |
| `data[].candidateNumber` | `number` | Unique contestant number |
| `data[].name` | `string` | Contestant name |
| `data[].gender` | `"MALE" \| "FEMALE"` | Contestant gender |
| `data[].teamName` | `string` | Team name |
| `data[].teamColor` | `string` | Team color |
| `message` | `string` | Success message |

Returns an empty array when no contestants exist. Returns an empty array when the filter matches no contestants.

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
| `400` | `CONTESTANT_FILTER_INVALID` | Filter must be Male or Female. | |
| `500` | `CONTESTANT_GET_ALL_ERROR` | Unable to fetch contestants. | |
