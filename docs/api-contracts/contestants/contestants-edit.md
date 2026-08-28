# Edit Contestant

Admin only.

The edit contestant flow uses two endpoints on the same resource:

1. `GET /contestants/:id` — fetch current values and lock state when opening the edit form
2. `PATCH /contestants/:id` — save changes

**Frontend form rules**

| Field | Rule |
|-------|------|
| Candidate No. | Required — positive whole number; editable when `isLocked = false`; read-only when `isLocked = true` |
| Name | Required — non-empty after trim; editable when `isLocked = false`; read-only when `isLocked = true` |
| Gender | Required — `MALE` or `FEMALE`; editable when `isLocked = false`; read-only when `isLocked = true` |
| Team Name | Required — non-empty after trim; editable when `isLocked = false`; read-only when `isLocked = true` |
| Team Color | Required — non-empty after trim; editable when `isLocked = false`; read-only when `isLocked = true` |

---

## Get Contestant By Id

`GET /contestants/:id`

Used when the admin clicks **Edit** on a contestant row.

### Request

**Headers** *(frontend sets explicitly)*

| Header          | Required | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `X-CSRF-Token`  | Yes      | Value from `csrfToken` cookie                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `X-Fingerprint` | Yes      | JSON string, non-empty object e.g. `{"X-Fingerprint":"{\"userAgent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36\",\"language\":\"en-US\",\"platform\":\"Win32\",\"screen\":{\"width\":1920,\"height\":1080,\"colorDepth\":24},\"timezone\":\"Asia/Manila\",\"hardwareConcurrency\":8,\"deviceMemory\":16,\"touchSupport\":false,\"canvas\":\"7f3c8d2a91b4e6ff\",\"webgl\":\"Intel Iris Xe Graphics\"}"}` |

**Cookies** *(auto-sent by browser with `credentials: 'include'`)*

| Cookie      | Required | Notes                                                                       |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `sid`       | Yes      | Session cookie — browser sends automatically                                |
| `csrfToken` | Yes      | Browser sends automatically; frontend reads value for `X-CSRF-Token` header |

**Path params**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | Yes | Contestant ID — positive whole number |

### Response

**200**

```json
{
  "data": {
    "id": 1,
    "candidateNumber": 1,
    "name": "Aniar, Andrea Mae",
    "gender": "FEMALE",
    "teamName": "Yellow Team",
    "teamColor": "Yellow",
    "isLocked": false
  },
  "message": "Contestant retrieved successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetContestantByIdDTO` | Contestant details for the edit form |
| `data.id` | `number` | Contestant ID |
| `data.candidateNumber` | `number` | Candidate number |
| `data.name` | `string` | Contestant name |
| `data.gender` | `string` | `MALE` or `FEMALE` |
| `data.teamName` | `string` | Team name |
| `data.teamColor` | `string` | Team color |
| `data.isLocked` | `boolean` | `true` when scores already exist for this contestant |
| `message` | `string` | Success message |

### Errors

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
| `400` | `CONTESTANT_ID_INVALID` | Contestant ID must be a positive whole number. | Backend API layer only. Do not handle in frontend. |
| `404` | `CONTESTANT_NOT_FOUND` | Contestant not found. | |
| `500` | `CONTESTANT_GET_BY_ID_ERROR` | Unable to get contestant by id. | |

---

## Save Contestant

`PATCH /contestants/:id`

Used when the admin submits the edit form.

### Request

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

**Path params**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | Yes | Contestant ID — positive whole number |

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
| `candidateNumber` | `string` | Yes | Non-empty string that parses to a positive whole number — editable only when `isLocked = false` |
| `name` | `string` | Yes | Non-empty after trim — editable only when `isLocked = false` |
| `gender` | `string` | Yes | `MALE` or `FEMALE` (case-insensitive; backend normalizes to uppercase) — editable only when `isLocked = false` |
| `teamName` | `string` | Yes | Non-empty after trim — editable only when `isLocked = false` |
| `teamColor` | `string` | Yes | Non-empty after trim — editable only when `isLocked = false` |

### Response

**200**

```json
{
  "message": "Contestant updated successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `message` | `string` | Success message |

### Errors

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
| `400` | `CONTESTANT_ID_INVALID` | Contestant ID must be a positive whole number. | Backend API layer only. Do not handle in frontend. |
| `400` | `CONTESTANT_CANDIDATE_NUMBER_REQUIRED` | Candidate number is required. | |
| `400` | `CONTESTANT_CANDIDATE_NUMBER_INVALID` | Candidate number must be a positive whole number. | Backend API layer only. Do not handle in frontend. |
| `400` | `CONTESTANT_CANDIDATE_NUMBER_DUPLICATE` | Candidate number is already in use. | |
| `400` | `CONTESTANT_NAME_REQUIRED` | Contestant name is required. | |
| `400` | `CONTESTANT_GENDER_REQUIRED` | Gender is required. | |
| `400` | `CONTESTANT_GENDER_INVALID` | Gender must be Male or Female. | |
| `400` | `CONTESTANT_TEAM_NAME_REQUIRED` | Team name is required. | |
| `400` | `CONTESTANT_TEAM_COLOR_REQUIRED` | Team color is required. | |
| `400` | `CONTESTANT_LOCKED` | Contestant cannot be edited because it has scores already. | |
| `404` | `CONTESTANT_NOT_FOUND` | Contestant not found. | |
| `500` | `CONTESTANT_EDIT_ERROR` | Unable to edit contestant. | |
