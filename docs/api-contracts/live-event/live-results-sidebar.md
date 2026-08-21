# Admin Live Results Sidebar

Admin only.

Used on Admin Live Event → Round Results sidebar. Populates one navigation item per round, ordered by `phaseOrder`. Navigation only — does not fetch rankings, scores, or advancement data.

**Data source:** `GET /rounds` — see [[rounds/rounds-list]] for request headers, response shape, and errors. This doc covers sidebar consumption only.

## When to fetch

| Trigger | Fetch? |
|---------|--------|
| Admin shell `onMounted` | Yes — once |
| Full page refresh | Yes |
| Round click / route change | No — use cached sidebar list |
| Auto-polling | No |

## Fields used

| Field | Sidebar use |
|-------|-------------|
| `data[].id` | Route param for `/admin/live/results/:roundId` |
| `data[].name` | Navigation item label |
| `data[].phaseOrder` | Display order (API already returns ascending) |

`data[].contestantLimit` is not shown in the sidebar.

## Default round on login

After admin login, redirect to `/admin/live/results/:roundId` where `roundId` is the round with `phaseOrder === 1` (Preliminary).

| Case | Behavior |
|------|----------|
| Round with `phaseOrder === 1` exists | Redirect to that round's `id` |
| No round with `phaseOrder === 1` | Redirect to `/admin/live/results` with no `roundId`; sidebar still renders from `GET /rounds` |
| Empty `data` | Stay on admin shell; Live Event section shows no round links |

## Default round on mount

After `GET /rounds` returns on admin shell mount, resolve the route param. This covers direct visits and bookmarks (e.g. `/admin/live/results` with no `:roundId`), not only login.

| Case                                                    | Behavior                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `route.params.roundId` already set                      | Keep it — do not overwrite                                                                  |
| No `roundId` and a round with `phaseOrder === 1` exists | `router.replace` to `/admin/live/results/{preliminaryId}`                                   |
| No `roundId` and no round with `phaseOrder === 1`       | Stay on `/admin/live/results`; main content empty until admin clicks a round in the sidebar |
| Empty `data`                                            | Stay on admin shell; Live Event section shows no round links; main content empty            |

Login redirect and mount guard both target Preliminary (`phaseOrder === 1`). If login already navigated to a `roundId`, the mount guard is a no-op.

## Frontend UI rules

| Signal          | Rule                                                                                   |
| --------------- | -------------------------------------------------------------------------------------- |
| Nav label       | `data[].name`                                                                          |
| Route           | `/admin/live/results/{data[].id}`                                                      |
| Order           | Render `data` as returned (already `phaseOrder` ascending)                             |
| Active state    | Highlight item where `id === route.params.roundId`                                     |
| Empty list      | Render Live Event section with no round links                                          |
| Refetch         | Page mount / browser refresh only — no auto-polling                                    |
| Loading / error | Follow global loading and error patterns; errors use codes from [[rounds/rounds-list]] |

## Round selection → main content

Clicking a sidebar item navigates to that round's results page. The main content area fetches data separately (page mount / manual refresh only).

| Section | Endpoint | Contract |
|---------|----------|----------|
| Judge Submissions | `GET /live-event/round-results/:id` | [[live-event/live-judge-submissions]] |
| Rankings, Advance, tie resolution | *(planned — not implemented yet)* | See [[Wireframe & Flows]] §6 and Implementation Tracker |
