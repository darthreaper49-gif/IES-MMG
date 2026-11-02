# Foundation Verification Record

**Verification date:** 2026-11-02 (Atlantic/Canary; command timestamps may be UTC).
**Environment:** Debian 12 x64, Python 3.11.2, Node 22.22.3, npm 10.9.8, Chromium 143.0.7499.0 from `@sparticuz/chromium` 143.0.4, SQLite. No real camera, GPU, PostgreSQL server or school network was used.

## Result summary

| Gate | Result | Evidence / qualification |
| --- | --- | --- |
| Backend tests | **COMPLETED for slice — 22 passed** | `services/api/tests/test_api.py`, `test_migrations.py`; one upstream TestClient deprecation warning, below. |
| Backend lint/format/types | **COMPLETED** | Ruff check, Ruff format check, mypy strict across 16 source/script files. |
| Frontend unit tests | **COMPLETED — 13 passed** | 3 Vitest files: API transport, localization, reusable UI/media states. |
| Browser integration | **COMPLETED for slice — 12 passed** | `apps/web/tests/e2e/workspace.spec.ts`; isolated in-memory API, real HTTP/browser interactions except explicitly mocked pagination/failure cases. |
| Automated accessibility | **COMPLETED for tested states** | axe-core 4.14, WCAG A/AA + 2.1/2.2 AA tags; no violations in the tested states. Not full conformance or assistive-technology certification. |
| Production build | **COMPLETED** | TypeScript check + Vite build; approximately 328 kB JS / 100 kB gzip, 43 kB CSS / 10 kB gzip. Development artifact, not a deployment approval. |
| Frontend lint/format | **COMPLETED** | ESLint and Prettier check. |
| API contract | **COMPLETED** | Exporter `--check`; generated TypeScript types compile against the checked OpenAPI. |
| SQLite migrations | **COMPLETED** | Upgrade, no schema drift, downgrade to base, upgrade again; automated test and separate CLI check. |
| Dependency audits | **COMPLETED snapshot** | Full npm audit: 0 known vulnerabilities; installed Python environment audit: 0 known vulnerabilities. Local package skipped by pip-audit. |
| PostgreSQL / containers / real media / inference | **BLOCKED / NOT VALIDATED** | Required server/runtime/integration and authorization absent. No compatibility or performance claim. |
| Load, soak, recovery, penetration test | **NOT STARTED** | No production capacity, availability, security or recovery guarantee. |
| Manual visual/keyboard review | **UNDER REVIEW** | Agent inspected desktop/mobile screenshots and exercised keyboard focus/Escape through Chromium. No independent human UX/accessibility review yet. |

## Clean-install verification

A fresh `npm ci` from the checked lock installed 300 host-applicable packages (301 audited including the local project), followed by the production build and lint gates. The frozen Python environment was synchronized and the local package rebuilt/reinstalled before the final backend gates. This verifies lockfile installation on the documented Linux host; it is not a cross-platform or production deployment test. The first parallel clean-install check found one newly edited frontend file needed formatting; it was formatted and the check rerun rather than reported as a clean first attempt.

## Executed commands

From `services/api`:

```bash
.venv/bin/pytest
.venv/bin/ruff check .
.venv/bin/ruff format --check .
.venv/bin/mypy
.venv/bin/pip-audit --local --skip-editable
PYTHONPATH=src .venv/bin/python scripts/export_openapi.py --check
../../.venv/bin/uv lock --check
```

From `apps/web`:

```bash
npm run build
npm run lint
npm run format:check
npm run test
npm run test:e2e
npm audit --audit-level=moderate
```

The browser command owns temporary servers on 8001/3001, uses `IESMMG_ENV=test`, `IESMMG_DATABASE_URL=sqlite:///:memory:`, disables simulation, and refuses existing-server reuse. The interactive port-3000 demo is not its database. HTML reports/traces/screenshots are generated under ignored `apps/web/playwright-report/` and `apps/web/test-results/`; they are local evidence, not committed footage or durable CI artifacts.

## Behavioral coverage

Backend:

- Session bootstrap/login/rotation/logout, password non-disclosure, failed-login throttle and successful reset.
- HttpOnly/Secure/SameSite cookie policy and HSTS under the HTTPS test client.
- CSRF requirement, session binding, malformed origin and wrong-port rejection.
- Viewer/operator/administrator separation, camera grants and administrator metadata-versus-scene boundary.
- Grant-scoped summary counts, cross-camera event denial and SSE authorization/revocation.
- Simulation-only registration, configuration version conflicts and honest unavailable media states.
- Human review versus explicit incident confirmation, stale/duplicate/downgrade rejection and dismissed-event guard.
- Filters, invalid cursors, traversal of more than 50 persisted events without duplicates, UTC timestamp serialization.
- SQLite migration upgrade/downgrade/upgrade and model/schema comparison.

Browser:

- Login/logout, synthetic camera inspection, review and explicit incident confirmation.
- English/Spanish switching and persisted locale; camera layout/search/empty states.
- Independent camera-group and event-camera filters; incident detail fetch outside the current event filter.
- Viewer review restriction; administrator synthetic registration, configuration/disable and audit inspection.
- Cursor load-more and overlap removal using an **explicit mocked two-page response**; real persisted pagination is separately covered by the backend.
- SSE failure fallback and protected-data cleanup using an **explicit mocked 401**; real expiry/revocation is separately covered by the backend.
- Desktop 1440 px and mobile 390/320 px reflow, mobile navigation focus restoration and Escape.
- axe scans of login, operator overview/cameras/events/incidents in both languages, review/camera dialogs, administrator tables/registration, and Spanish mobile login/overview/navigation.

## Findings corrected during verification

1. Chromium initially could not launch because NSS/NSPR libraries were missing. The test setup now extracts the package's bundled support archive; no system installation was needed.
2. Serverless Chromium's convenience arguments disable web security. The test configuration deliberately does **not** use them; only headless/container compatibility flags are applied, with sandbox disabled for the unprivileged sandbox host. A normal browser override is available.
3. Automated checks found insufficient text contrast and small mobile targets. Palette/target sizes were corrected and scans rerun.
4. A screen-reader-only table header escaped its scroll container and caused mobile document overflow. The scroll container now positions/clips it correctly.
5. Camera-group and event-camera filters shared state; they are now independent. Incident detail fetches by ID rather than depending on loaded/filtered rows.
6. Event history now loads cursor pages and deduplicates overlaps. Administrator summary counts match explicit grants.
7. Review/configuration updates became version-conditioned; incident confirmation cannot double-increment the event version or create duplicate incidents.
8. SSE now revalidates the session/account and includes camera revisions. Protected frontend 401s clear cached data.
9. Test scenarios initially shared mutable assumptions and exhausted the login failure budget. Scenarios use independent fixtures, and successful login correctly clears failed-attempt history without weakening the eight-failure limit.
10. Dependency review found a Pydantic Settings advisory and a transitive minimatch advisory. Versions were updated/overridden, locks refreshed, audits and functional gates rerun to zero known findings.

## Warnings and unverified claims

- Starlette's TestClient emits a deprecation warning recommending `httpx2` instead of the current `httpx`. The 22 tests still pass. This is recorded for a reviewed tooling upgrade, not silently suppressed or described as warning-free.
- `pip-audit --local --skip-editable` audits installed third-party packages; it does not assess the security of local IESMMG code. npm's clean result is also time-bound.
- No numerical code-coverage percentage, model accuracy, throughput, latency SLO, concurrent-user capacity or production uptime is claimed.
- axe cannot establish full WCAG conformance. Independent keyboard/screen-reader, zoom, cognitive-load and operational usability review remains required.
- The synthetic SVG scenes are illustrations. No codec, WebRTC, RTSP, ONVIF, camera authentication, inference, recording or school-system interoperability has been tested.
- PostgreSQL driver locking is not PostgreSQL integration evidence. Container, backup/restore, TLS-proxy, multi-process limiter and deployment recovery checks remain open.

## Next acceptance gates

Before expanding beyond this slice: owner review of the foundation; authentic emblem; independent UI/accessibility review if required; PostgreSQL migration/concurrency/recovery validation; CI execution and artifact retention; production threat model and identity/hosting decisions. Real-source work additionally requires the institutional gates in [SECURITY_AND_PRIVACY.md](SECURITY_AND_PRIVACY.md). Release requires a separate owner authorization and tag proposal.