# Add Contestant

`POST /contestants`

Admin only.

Creates a contestant record with candidate number, name, gender, team name, and team color. Does not create `round_contestants` rows — phase 1 automatically includes all contestants.

**Frontend form rules**

| Field | Rule |
|-------|------|
| Candidate No. | Required — positive whole number |
| Name | Required — non-empty after trim |
| Gender | Required — `MALE` or `FEMALE` (backend normalizes case) |
| Team Name | Required — non-empty after trim |
| Team Color | Required — non-empty after trim |

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
  "candidateNumber": "1",
  "name": "Aniar, Andrea Mae",
  "gender": "FEMALE",
  "teamName": "Yellow Team",
  "teamColor": "Yellow"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `candidateNumber` | `string` | Yes | Non-empty string that parses to a positive whole number |
| `name` | `string` | Yes | Non-empty after trim |
| `gender` | `string` | Yes | `MALE` or `FEMALE` (case-insensitive; backend normalizes to uppercase) |
| `teamName` | `string` | Yes | Non-empty after trim |
| `teamColor` | `string` | Yes | Non-empty after trim |

## Response

**201**

```json
{
  "message": "Contestant added successfully"
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

See [[global/errors]] for shared error codes handled by the axios interceptor.

| Status | Code | Message | Notes |
|--------|------|---------|-------|
| `400` | `CONTESTANT_CANDIDATE_NUMBER_REQUIRED` | Candidate number is required. | |
| `400` | `CONTESTANT_CANDIDATE_NUMBER_INVALID` | Candidate number must be a positive whole number. | Backend API layer only. Do not handle in frontend. |
| `400` | `CONTESTANT_CANDIDATE_NUMBER_DUPLICATE` | Candidate number is already in use. | |
| `400` | `CONTESTANT_NAME_REQUIRED` | Contestant name is required. | |
| `400` | `CONTESTANT_GENDER_REQUIRED` | Gender is required. | |
| `400` | `CONTESTANT_GENDER_INVALID` | Gender must be Male or Female. | |
| `400` | `CONTESTANT_TEAM_NAME_REQUIRED` | Team name is required. | |
| `400` | `CONTESTANT_TEAM_COLOR_REQUIRED` | Team color is required. | |
| `500` | `CONTESTANT_ADD_ERROR` | Unable to add contestant. | |
