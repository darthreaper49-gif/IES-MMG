# Security, Privacy, and Authorization Gates

**Status:** synthetic foundation controls implemented and development-tested; production/security/legal approval **NOT GRANTED**. This document is an engineering record, not legal advice or a compliance certification.

## Enforced boundaries

- Only `demo` and `test` environments validate. A production environment cannot start this foundation.
- All camera inputs accept only `source_type=simulation`; extra URL/credential fields are rejected. The adapter opens no camera socket and performs no discovery.
- Viewer, security operator, and administrator permissions are enforced server-side. UI hiding is not the security boundary.
- Camera metadata administration and camera scene/event access are separate. Administrators do not inherit all stream/event grants. Dashboard counts use the same explicit grants as their destination views.
- Session tokens are random and stored hashed; passwords use Argon2id. Session/CSRF cookies are HttpOnly and SameSite=Lax, with configurable Secure behavior.
- Mutations require CSRF tokens; authenticated tokens are session-bound. Origin checks compare host/port and reject malformed origins, with one exact configurable additional origin.
- Session expiry and account activity are checked on protected requests and during SSE. Logout revokes the server session. The frontend clears protected query data on a 401.
- Reviews and incidents require explicit human actions and rationale. Detection scores, automated notifications, reviews, and confirmed incidents remain distinct.
- Camera grants, optimistic versions, unique incident constraints, and audit records are persisted. No real footage or biometric data is collected.

## Verified negative cases

The backend suite tests unauthenticated access, wrong passwords/throttling, CSRF absence and cross-session reuse, untrusted/malformed origins and ports, cross-camera event/camera denial, administrator stream denial without a grant, viewer review denial, stale versions, duplicate/downgrade confirmation attempts, expired sessions, and SSE termination after revocation. Browser tests verify viewer restrictions and protected-data cleanup on a simulated 401. See [TESTING.md](TESTING.md).

## Remaining design risks and limitations

| Area | Current limitation | Required before real deployment |
| --- | --- | --- |
| Public demo accounts | Passwords are intentionally public synthetic fixtures. | Disable fixtures; approved identity lifecycle, credential policy, privileged MFA, recovery and revocation drills. |
| Hosting/TLS | Vite accepts preview hosts; local HTTP cookies are allowed; no production reverse proxy/CSP policy is deployed. | Exact trusted hosts/origins, HTTPS, hardened headers/CSP, non-root service identities, network/egress policy. |
| Abuse resistance | Login limiter is process-local; no global request/body/rate limits or distributed abuse service. | Edge/application limits, proxy-aware client identity, resource quotas and monitored lockout policy. |
| Database | SQLite demo bootstrap; no PostgreSQL operational validation, backup/restore, retention job or hardened DB roles. | Reviewed migrations, least-privilege accounts, encrypted backups, restore evidence, retention/deletion verification. |
| Audit | Application append-only workflow, but no tamper-evident external store or DB-admin immutability. | Audit access review, integrity monitoring, export/retention rules and incident response. |
| Updates | SSE polls bounded database state; no durable outbox or measured fan-out/backpressure behavior. | Load/failure testing, reconnect/replay design, operational metrics and alerting. |
| Media/AI | No gateway, detector, worker, model weights or real stream authorization exists. | Separate authorized design, source allowlists, write-only credentials, SSRF/redirect/DNS controls, scoped expiring media tokens, worker isolation and model provenance. |
| Dependencies | Audit snapshot is clean, not a guarantee against future advisories. | Scheduled advisory/license review, lockfile update gates, SBOM/release composition and secret scanning in CI. |
| Assessment | No penetration test, threat-model sign-off, legal review or institutional security approval. | Independent review appropriate to the actual deployment and data sensitivity. |

The source implementation does not log passwords, cookies, or CSRF tokens. Uvicorn's default access logs contain request paths; future camera identifiers or query parameters must be reviewed for privacy before real use. Never put secrets in URLs. Do not paste session material or real footage into diagnostics.

## Privacy and Spanish/EU institutional gate

Before any real school processing, the controller/school leadership, IT and authorized data-protection personnel must determine the lawful framework under GDPR, LOPDGDD, applicable video-surveillance rules, and the actual relevance of EU AI Act obligations. Technical feasibility is not lawful authorization.

Required decisions include:

- Controller/processor roles, purpose, lawful basis, necessity and proportionality; do not assume consent is appropriate in a school.
- DPIA and existing surveillance policy, especially risks to minors and other vulnerable people.
- Camera coverage/avoided areas, masking, audio exclusion, access grants, signage/information, and data-subject request handling.
- Live-only versus recording, snapshots, event metadata, review notes, audit history, backups, retention and verified deletion. No universal retention period is assumed.
- Hosting location, subprocessors, remote support, international transfers and external inference. No such transfer is authorized here.
- Human oversight, false-positive correction, incident escalation and prohibition of automated adverse decisions.
- Breach response, accountability, approval records and periodic reassessment.

Even without images, camera locations, timestamps, detections and audit trails can be personal data. The current synthetic names/scenes are fixtures, not records about actual students or staff.

**Biometric/facial identification remains out of scope.** It requires separate owner authorization and legal/technical assessment; nothing in this foundation silently enables it.

## Branding provenance

The official public “Logo MMG” page was located, but its original emblem binary could not be obtained and verified. No generated, approximate, or generic school emblem is used. Obtain an original SVG/PDF/high-resolution PNG with provenance and permission, then preserve proportions and identifying elements across primary, login, compact, favicon and app-icon variants. The current product wordmark is not a replacement for that emblem.

## Stop conditions

Stop and escalate before school network access/discovery, real credentials/feeds, footage collection, network changes, recording, external personal-data transfer, biometric processing, production deployment, shared-branch integration or release without the corresponding explicit approvals. Continue only independent synthetic/documentation work within the owner-approved scope.