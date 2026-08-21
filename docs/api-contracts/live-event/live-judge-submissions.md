# Get Judge Submissions

`GET /live-event/round-results/:id`

Admin only.

Returns the **Judge Submissions** matrix for one round: per-judge, per-category submitted flags, aggregate counts, and whether all judges have finished scoring. Used for the top section of the Admin Live Event → Round Results page.

**Related docs:** [[live-event/live-results-sidebar]] (sidebar navigation) · [[Wireframe & Flows]] §6 (Judge Submissions UI) · [[System Documentation]] §3 (business rules)

**Scope note:** This endpoint currently returns judge-submission data only. Rankings, `canAdvance`, `advancement`, and `nextRound` are planned for a future round-results fetch — not included here.

## Consumers

- Admin Live Event → Round Results page — **Judge Submissions** section (✓ / ✗ matrix and "X of Y judges fully submitted")

## When to fetch

| Trigger | Fetch? |
|---------|--------|
| Round Results page mount (`route.params.roundId` set) | Yes |
| Full page refresh on Round Results page | Yes |
| Sidebar round click (same page, new `roundId`) | Yes — refetch for the new round |
| Auto-polling | No |

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

**Path params**

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `number` | Yes | Round ID — positive whole number (same as sidebar `data[].id` / `route.params.roundId`) |

## Response

**200**

```json
{
  "data": {
    "judgeSubmissions": [
      {
        "judge": {
          "id": 1,
          "name": "Judge 1"
        },
        "categories": [
          {
            "id": 10,
            "name": "Formal Wear",
            "submitted": true
          },
          {
            "id": 11,
            "name": "Production",
            "submitted": false
          },
          {
            "id": 12,
            "name": "Swimwear",
            "submitted": true
          },
          {
            "id": 13,
            "name": "Talent",
            "submitted": true
          }
        ],
        "fullySubmitted": false
      },
      {
        "judge": {
          "id": 2,
          "name": "Judge 2"
        },
        "categories": [
          {
            "id": 10,
            "name": "Formal Wear",
            "submitted": true
          },
          {
            "id": 11,
            "name": "Production",
            "submitted": false
          },
          {
            "id": 12,
            "name": "Swimwear",
            "submitted": true
          },
          {
            "id": 13,
            "name": "Talent",
            "submitted": true
          }
        ],
        "fullySubmitted": false
      },
      {
        "judge": {
          "id": 3,
          "name": "Judge 3"
        },
        "categories": [
          {
            "id": 10,
            "name": "Formal Wear",
            "submitted": false
          },
          {
            "id": 11,
            "name": "Production",
            "submitted": false
          },
          {
            "id": 12,
            "name": "Swimwear",
            "submitted": false
          },
          {
            "id": 13,
            "name": "Talent",
            "submitted": false
          }
        ],
        "fullySubmitted": false
      }
    ],
    "fullySubmittedCount": 0,
    "totalJudges": 3,
    "allJudgesSubmitted": false
  },
  "message": "Judge submissions fetched successfully"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `data` | `GetJudgeSubmissionsDTO` | Judge submission matrix for the requested round |
| `data.judgeSubmissions` | `JudgeSubmission[]` | One row per judge (`role === JUDGE`). Ordered by judge `name` ascending |
| `data.judgeSubmissions[].judge` | `{ id, name }` | Judge identity for the row label |
| `data.judgeSubmissions[].judge.id` | `number` | Judge user ID |
| `data.judgeSubmissions[].judge.name` | `string` | Judge display name |
| `data.judgeSubmissions[].categories` | `CategorySubmission[]` | One column per category in this round. Ordered by category `name` ascending |
| `data.judgeSubmissions[].categories[].id` | `number` | Category ID |
| `data.judgeSubmissions[].categories[].name` | `string` | Category name (column header) |
| `data.judgeSubmissions[].categories[].submitted` | `boolean` | `true` when any score exists for this judge + category in this round. Frontend renders ✓ / ✗ from this only — do not infer submission state client-side |
| `data.judgeSubmissions[].fullySubmitted` | `boolean` | `true` when every category in this row has `submitted: true` (Done? column). If the round has zero categories, this is `true` for every judge row |
| `data.fullySubmittedCount` | `number` | Count of judge rows where `fullySubmitted === true`. Use with `totalJudges` for "X of Y judges fully submitted" |
| `data.totalJudges` | `number` | Total judges in the system (`role === JUDGE`) |
| `data.allJudgesSubmitted` | `boolean` | `true` only when every judge has submitted every category in this round. `false` when there are zero judges |
| `message` | `string` | Success message |

### Empty / edge cases

| Case | Response shape |
|------|----------------|
| Round exists, no judges | `judgeSubmissions: []`, `totalJudges: 0`, `fullySubmittedCount: 0`, `allJudgesSubmitted: false` |
| Round exists, judges but no categories | One row per judge with `categories: []`, each `fullySubmitted: true`, `allJudgesSubmitted: true` if at least one judge exists |
| Round exists, judges and categories, no scores | All `submitted: false`, all `fullySubmitted: false`, `allJudgesSubmitted: false` |

Admin users are never included in `judgeSubmissions`. Only accounts with role `JUDGE` appear.

## Frontend UI rules

| Signal | Rule |
|--------|------|
| Matrix columns | `data.judgeSubmissions[].categories[].name` — same order in every row (category `name` ascending) |
| Matrix rows | `data.judgeSubmissions[].judge.name` — judge `name` ascending |
| Cell ✓ / ✗ | `categories[].submitted` — `true` → ✓, `false` → ✗ |
| Done? column | `fullySubmitted` — `true` → ✓, `false` → ✗ |
| Summary line | `` `${fullySubmittedCount} of ${totalJudges} judges fully submitted` `` |
| All submitted badge | Show when `allJudgesSubmitted === true` (Wireframe State 2+) |
| Refetch | Page mount and manual browser refresh only — no auto-polling |

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
| `400` | `ROUND_ID_INVALID` | Round ID must be a valid number. | `field`: `get_judge_submissions_input_id`. Backend API layer only — do not handle in frontend |
| `404` | `ROUND_PHASE_NOT_FOUND` | Round phase not found. | Round `id` does not exist |
| `500` | `JUDGE_SUBMISSIONS_GET_ERROR` | Unable to get judge submissions. | Unexpected failure while loading submission data |
