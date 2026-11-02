# IESMMG — Central Project Status

**Updated:** 2026-11-02
**Overall milestone:** UNDER REVIEW — approved synthetic foundation implemented and automatically verified; owner acceptance pending.
**Active branch:** `arena/93b885b1-ies-mmg`
**Approved scope:** synthetic-only foundation, English/Spanish UI. No institutional deployment, real-source access or release.

## Measurable current position

| Measure | Current evidence |
| --- | --- |
| API surface | 17 OpenAPI paths / 22 operations, exported from the actual app. |
| Persistence | 9 application entities + Alembic version table; initial revision `06ed0e8980ed`. |
| Demo fixtures | 3 public accounts, 3 groups, 8 cameras, 8 initial events; generator capped at 500 total events/database. |
| Backend verification | **22 passed**; Ruff/format, strict mypy (16 source/script files), contract and lock checks passed. |
| Frontend verification | **13 unit tests passed**; **12 browser scenarios passed**; build/ESLint/Prettier passed. |
| Accessibility | axe scans passed for documented EN/ES views and selected dialog/admin/mobile states; independent human review not completed. |
| Dependency audits | Full npm and installed Python audits: **0 known vulnerabilities** at the verification snapshot. |
| Lock inventory | 67 Python entries; 342 npm entries, including optional/transitive packages. |
| SQLite migrations | Upgrade → no drift → downgrade → upgrade passed, both CLI and automated test. |
| Real systems / footage | **0** school systems accessed, real credentials used, camera connections opened or real footage collected. |
| Releases / shared-branch merges | **0**; no tag or default/development-branch mutation. |

Counts describe this bounded slice, not percentage completion of a production CCTV product. Numerical coverage, capacity and model-accuracy claims are not made.

## Workstream status

| ID / deliverable | Responsibility | Status | Evidence / remaining action |
| --- | --- | --- | --- |
| SUP-01 inspection/proposal | Supervisor | COMPLETED | Initial 20-topic proposal delivered before implementation; repository facts recorded. |
| GOV-01 development target spelling | Owner + supervisor | APPROVED | Owner confirmed existing `Developement`; fixed session branch still enforced. |
| FND-01 synthetic vertical slice | All roles sequentially | UNDER REVIEW | Authenticated camera/event/review/incident/admin flows and tests exist; owner acceptance pending. |
| BE-01 API/domain/persistence | Back-end | UNDER REVIEW | 22 tests and SQLite migration evidence; PostgreSQL/deployment gates remain. |
| FE-01 bilingual operator workspace | Front-end | UNDER REVIEW | 13 unit + 12 browser tests; visual/keyboard agent review performed, independent human review pending. |
| DOC-01 technical record | Documentation | UNDER REVIEW | Actual versions, runbooks, API, security/privacy, limitations and evidence synchronized; final diff review pending. |
| BRAND-01 official emblem | Owner + front-end/docs | BLOCKED | Original asset/provenance unavailable; no substitute accepted. |
| DB-01 PostgreSQL validation | Back-end + supervisor | BLOCKED | No authorized/available PostgreSQL server; driver pin is not integration evidence. |
| VIDEO-01 real media adapter | Back-end + front-end | NOT STARTED | Requires separately approved scope and authorized test source; no gateway installed. |
| AI-01 model inference | Back-end | NOT STARTED | Simulation only; no model/weights or accuracy claim. |
| INF-01 institutional infrastructure | Owner/school IT | NOT STARTED | Questionnaire/decision gates exist; no probing or hardware assumption. |
| PRIV-01 real-processing assessment | School/DPO + owner | NOT STARTED | Required before real footage, transfers or deployment. |
| REL-01 release preparation | Owner + supervisor | NOT STARTED | Requires review, release report, tag proposal and explicit owner authorization. |

“UNDER REVIEW” deliberately avoids equating generated code or passing development checks with final owner acceptance. The four roles are sequential responsibilities of one assistant, not independent autonomous agents.

## Integration evidence

- React uses generated types from `contracts/openapi.json`; the exporter's check and frontend build pass.
- Main preview uses Vite port 3000 proxying to Uvicorn port 8000 and a local ignored SQLite demo database.
- Browser tests use their own port 3001/8001 servers and in-memory database, with simulation disabled and existing-server reuse refused.
- Human review, incident confirmation, camera configuration, filters, cursor pagination, role boundaries, session expiry, SSE fallback and audit are exercised through actual HTTP/browser flows. Explicitly mocked browser edge cases are identified in [TESTING.md](TESTING.md).
- Authenticated scenes/events and dashboard counts respect explicit grants, including for administrators. No camera URL/socket/model/recording path exists.
- Desktop and 320/390 px mobile screenshots were inspected; mobile document overflow and focus issues found during review were corrected.

## Security/dependency findings

| Finding | State | Response / residual risk |
| --- | --- | --- |
| Empty initial artifact/secret ignore rules | COMPLETED for foundation | `.gitignore` now excludes environments/keys, local databases/media/models, dependencies and test/build artifacts. Secret review remains part of release gate. |
| pydantic-settings CVE-2026-58203 | Remediated | Upgraded 2.13.1 → 2.14.2; locked and retested. Affected nested-secrets source was not configured. |
| Transitive minimatch GHSA-g3hv-75wg-m249 | Remediated | Override to 11.0.1; npm/build/lint/contract/browser checks rerun; audit clean. |
| Browser convenience flags disabled web security | Corrected | Test config uses only container/headless compatibility flags; no web-security/site-isolation disable flags. Sandboxed test browser still runs no-sandbox on this host. |
| Low contrast / small targets / mobile overflow | Corrected for tested states | Palette, target sizes and table clipping fixed; axe/reflow checks rerun. Full accessibility conformance not claimed. |
| Shared filters / truncated event history / admin count mismatch | Corrected | Independent filters, cursor load-more and explicit-grant counts implemented and tested. |
| Stale concurrent reviews/configuration | Corrected for SQLite slice | Version-conditioned updates and unique incident constraint; PostgreSQL concurrent behavior remains unvalidated. |
| Public demo identities / local abuse limiter | Open production limitation | Fixtures cannot start in production; real identity/MFA/distributed abuse controls require approved deployment design. |
| Audit/retention/backup guarantees | NOT IMPLEMENTED | No tamper-evident store, retention/deletion jobs or restore evidence. |
| School/minors privacy and legal basis | Institutional gate | DPO/controller/IT assessment required before any real processing. |
| Unknown hosting/topology/camera compatibility | Open uncertainty | No provider, GPU, VMS or manufacturer assumption; modular boundaries preserved. |

No penetration test, legal review, production security approval or compliance certification has occurred.

## Documentation and branding

The [documentation index](README.md) maps all 20 required topics to current artifacts. The historical proposal has been reconciled so “no application exists” is no longer presented as current truth. Exact runtime/pins, local procedures, API semantics, security/privacy gates, test warnings and limitations are recorded.

The official Logo MMG page was found, but the linked original binary could not be obtained/verified. Primary/login/compact/favicon/app-icon institutional variants remain blocked. The UI uses only the IESMMG product wordmark with an explicit pending-emblem notice.

## Roadmap / exit gates

| Phase | State | Exit condition |
| --- | --- | --- |
| 01 Initialization | COMPLETED | Proposal/roles/initial repository evidence delivered. |
| 02 Synthetic foundation | UNDER REVIEW | Automated gates passed; final owner review and authentic branding decision remain. |
| 03 Production-quality dashboard foundation | IN PROGRESS / bounded by approvals | PostgreSQL, identity, deployment, recovery, independent accessibility and operational evidence needed; no real media implied. |
| 04 Authorized video integration | NOT STARTED | Explicit scope/source permission, gateway/security/codec/resource evidence. |
| 05 Intelligent analysis | NOT STARTED | Authorized/synthetic evaluation, provenance, human oversight, CPU/resource/accuracy report. |
| 06 Institutional validation | NOT STARTED | School/IT/DPO approvals, privacy/retention/access policies, deployment/recovery/security review. |
| 07 Release | NOT STARTED | Owner-approved target, complete review/report and tag proposal, explicit release authorization. |

## Immediate next actions

1. Preserve and review the implementation handoff on the fixed working branch; documentation links, artifact exclusions and whitespace checks are complete.
2. Review the synthetic demo and evidence with the owner for acceptance/changes; do not infer release permission.
3. Request the authentic original emblem and usage provenance; do not fabricate variants.
4. Plan PostgreSQL/CI/identity/deployment validation only within separately approved infrastructure scope.
5. Keep all school access, real footage, inference, recording, biometric work and shared-branch integration stopped until their gates are satisfied.

## Verification history

- **2026-11-01:** empty repository/remote inspection and documentation-only proposal; no application behavior claimed.
- **2026-11-02:** owner-approved foundation implemented. Browser launch, contrast, mobile overflow, filter/pagination, access-count and test-isolation failures were found and corrected rather than omitted.
- **2026-11-02 final development gates:** 22 backend, 13 frontend unit and 12 browser tests passed; static/contract/migration/audit checks passed. One upstream Starlette TestClient/httpx deprecation warning remains documented. No PostgreSQL/real-media/load/recovery/production-security claim.