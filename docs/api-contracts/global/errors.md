# Global Errors

Shared error codes returned across protected API endpoints. These are **not** feature-specific — handle them once in the **axios response interceptor**, not per page or per form.

Endpoint contracts (rounds, categories, auth, etc.) only list errors unique to that endpoint. Any protected route can also return the codes documented here.

---

## Error response shape

All API errors use the same JSON structure:

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

| Field | Type | Notes |
|-------|------|-------|
| `message` | `string` | Human-readable message — safe to show in a toast when no custom UI is needed |
| `code` | `string` | Machine-readable code — use in the interceptor to decide global behavior |
| `field` | `string` | Optional. Identifies which part of the request failed (e.g. missing cookie, CSRF mismatch). Not used by the interceptor for global codes |
| `data` | `object` | Optional. Extra context when the backend provides it |

---

## Global error codes

| Status | Code | Message | Description | Handled by |
|--------|------|---------|-------------|------------|
| `400` | `INVALID_DEVICE_ID` | Unable to verify your device. Please refresh the page and try again. | `X-Fingerprint` header is missing, empty, or not a valid JSON object. Returned by the authenticate middleware on protected routes, and by login when the fingerprint is invalid. | **Axios interceptor** — show error toast; prompt user to refresh the page so a new fingerprint can be sent |
| `401` | `SESSION_UNAUTHORIZED` | Your session is invalid or has expired. Please log in again. | Session validation failed: no session cookie, missing or mismatched CSRF token, device fingerprint mismatch, or user no longer exists. This is the general “you are not logged in” code for protected routes. | **Axios interceptor** — clear local session state and redirect to login |
| `401` | `TOKEN_EXPIRED` | Token has expired. | The JWT in the session cookie has passed its expiry time. | **Axios interceptor** — same as `SESSION_UNAUTHORIZED` (clear session, redirect to login) |
| `401` | `TOKEN_INVALID` | Invalid or malformed token. | The session JWT is missing, tampered with, signed incorrectly, or otherwise cannot be verified. | **Axios interceptor** — same as `SESSION_UNAUTHORIZED` (clear session, redirect to login) |
| `403` | `FORBIDDEN` | You do not have permission to perform this action. | The user is authenticated but their role is not allowed for this route (e.g. a judge calling an admin-only endpoint). | **Axios interceptor** — show error toast; optionally redirect away from the page |
| `500` | `SERVER_ERROR` | Something went wrong on our end. Please try again later. | Unhandled server exception. The global error handler returns this when the error is not a known `AppError`. Unlikely in normal operation but possible. | **Axios interceptor** — show generic error toast using `error.message` |

---

## Not an API error code: network / server unreachable

When the request never reaches the backend (network offline, DNS failure, connection refused, timeout), axios will **not** return a response body with `error.code`. There is no `SERVER_ERROR` in that case.

| Situation | Handled by |
|-----------|------------|
| No response (`error.response` is undefined) | **Axios interceptor** — show a “unable to reach server” (or similar) toast. Do not treat this as `SERVER_ERROR` |

---

## When global handling applies

| Request type | Global errors apply? |
|--------------|----------------------|
| Protected routes (`authenticate` + `requireRole`) | Yes — all codes in the table above |
| `POST /auth/login` | Partial — `INVALID_DEVICE_ID` only. Login-specific errors (`INVALID_CREDENTIALS`, etc.) are documented in [[auth-login]] and handled on the login page |
| `GET /session/me` | Partial — session errors are global; see [[auth-session]] |
| `DELETE /session/logout` | Partial — same as session |

---

## Endpoint contracts

Per-endpoint docs under `api-contracts/` list only **feature-specific** error codes. They do not repeat this table.

When implementing a feature page, the interceptor handles global codes first. Remaining errors in the contract are handled by that feature (inline form validation, feature-specific toasts, etc.).
