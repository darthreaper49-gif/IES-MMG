# Simulation API Contract

**Implemented and tested:** OpenAPI **0.1.0**, base path `/api/v1`. The machine-readable source is [`contracts/openapi.json`](../contracts/openapi.json), exported from the actual FastAPI application. The running reference is `/api/docs`. This is not a real-camera or production API.

## Authentication and errors

1. `GET /auth/csrf` obtains a bootstrap CSRF cookie/token pair.
2. `POST /auth/session` submits a public demo username/password plus `X-CSRF-Token`.
3. The response establishes an HttpOnly, SameSite=Lax session cookie and returns the user, permissions, environment, and a session-bound CSRF token.
4. Mutations send that token in `X-CSRF-Token`. Cookies are never placed in query strings. The browser keeps the CSRF token in memory, not local storage.
5. `DELETE /auth/session` revokes the session and clears cookies. `GET /auth/session` restores a valid session after reload; `GET /auth/me` returns the current access profile.

Passwords use Argon2id. Only SHA-256 hashes of random opaque session tokens are stored. Sessions have an absolute expiry. Eight failed logins per client IP/username enter a five-minute process-local throttle; successful authentication clears that key's failure history. This is not a distributed production rate limiter.

Expected errors use `application/problem+json` with `type`, `title`, `status`, and `detail`; validation errors also contain a bounded `fields` list. Authorization failures do not expose hidden resource contents. Important statuses: 401 unauthenticated/expired, 403 permission/CSRF/origin, 404 hidden or missing resource, 409 stale version/duplicate incident, 422 invalid input, 429 login throttle. Responses carry a generated `X-Request-ID`, `Cache-Control: no-store`, `nosniff`, and `Referrer-Policy: no-referrer`.

## Implemented operations

| Method | Path | Semantics |
| --- | --- | --- |
| GET | `/auth/csrf` | Bootstrap CSRF pair. |
| POST | `/auth/session` | Authenticate a demo account and rotate any supplied previous session. |
| GET | `/auth/session` | Restore session/access profile. |
| DELETE | `/auth/session` | Revoke session; 204 response. |
| GET | `/auth/me` | Current user and effective permissions. |
| GET | `/cameras` | Granted cameras; administrators can read all metadata. |
| POST | `/cameras` | Administrator registers a **simulation-only** camera; creator receives an explicit grant. |
| GET | `/camera-groups` | Group metadata for configuration/filtering. |
| GET | `/cameras/{id}` | Granted camera detail, or administrator metadata access. |
| PATCH | `/cameras/{id}` | Administrator changes name/location/enabled using an expected version. |
| POST | `/cameras/{id}/connection-tests` | Inspect a synthetic health fixture and audit the action; **no network probe**. |
| POST | `/cameras/{id}/stream-sessions` | Check separate `stream:view` permission and return a five-minute synthetic viewport authorization; never a media URL. |
| GET | `/events` | Granted, filtered, cursor-paginated synthetic detections/diagnostics. |
| GET | `/events/{id}` | Granted event detail, even when outside the currently loaded UI page/filter. |
| POST | `/events/{id}/reviews` | Authorized security operator with a camera grant: false positive or investigation, rationale, expected version. Cannot confirm an incident here. |
| POST | `/incidents` | Explicit human confirmation with event ID/version, title, severity, and rationale. |
| GET | `/incidents` | Most recent 100 explicitly confirmed incidents for granted cameras. |
| GET | `/admin/users` | Administrator reads account/access metadata; no password hashes. |
| GET | `/admin/audit-events` | Administrator reads most recent 100 audit records. |
| GET | `/system/health` | Public synthetic-demo health; database availability and explicit disconnected/disabled integrations. |
| GET | `/system/summary` | Counts scoped to explicit camera grants for **all** roles, including administrators. |
| GET | `/system/event-updates` | Cookie-authenticated SSE invalidation signal, not event payloads or media. |

There is no endpoint for camera URLs, network discovery, real stream ingest, model execution, recording, footage export, biometric identification, or automatic incident creation. Unknown fields are rejected. User/role/grant administration is read-only in this slice; fixture grants are seeded, and camera creation adds the creator's grant.

## Pagination and filters

`GET /events` accepts `limit` (1–100, default 50), opaque `cursor` (maximum 512 characters), `camera_id`, `severity`, `review_status`, and `category`. Ordering is UTC observation time descending, then UUID descending. The response contains `items` and `next_cursor`; a null cursor means exhausted. Cursor decoding validates its shape and UUID. It is not an authorization token: camera grants are reapplied on every request.

The UI loads 50 at a time, offers **Load more**, and deduplicates stable event IDs if refreshed cursor pages overlap. The backend test traverses more than 50 persisted events. A separate browser test explicitly mocks a two-page response to verify overlap removal; it is not represented as a real 500-event load test. Incident and audit lists are bounded to 100 and labeled accordingly in the UI.

## Evidence lifecycle and concurrency

- A synthetic detection starts `pending`; its score is fixture metadata, not a calibrated probability or proof.
- A review records an authenticated human decision and rationale. `false_positive` and `needs_investigation` do **not** create incidents.
- Incident confirmation is a separate authorized action. A dismissed event must first be reopened for investigation; a confirmed event cannot be downgraded by a detection review.
- Review, confirmation, and camera configuration use version-conditioned database updates. Stale versions return 409. A unique event-to-incident constraint prevents duplicate confirmation records.
- Confirmation, event-state change, review record, and audit entry commit together. PostgreSQL concurrent-transaction behavior still needs validation on that engine.
- Audit records identify actor/action/resource/time and avoid review narratives or source secrets. Review rationale is stored separately. Audit immutability against a database administrator is not claimed.

## SSE and fallback

The SSE payload is only `{"source":"simulation"}`. The server rechecks the session/account and grants, examines a bounded recent event/camera/review revision, emits an invalidation on change, sends heartbeats, and closes after approximately five minutes. EventSource reconnects. The UI invalidates relevant queries and also polls every 30 seconds; session state is checked every 60 seconds. A protected 401 clears cached account data and returns to login.

This simple database-polling signal is suitable for the bounded demo, not a measured production fan-out design. A future durable outbox/message mechanism requires separate load/recovery evidence.

## Contract change procedure

Run the exporter and `--check` from `services/api`, then `npm run generate:api` and the frontend build from `apps/web`. Review the OpenAPI and generated-type diffs together. See [OPERATIONS.md](OPERATIONS.md) for exact commands. Never hand-maintain a competing frontend schema.