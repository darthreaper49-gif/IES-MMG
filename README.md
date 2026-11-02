# IESMMG

**Intelligent CCTV Security Dashboard — authenticated, bilingual, synthetic-data foundation.**

IESMMG is an independent prototype for potential future discussion with IES Manuel Martín González, Guía de Isora, Tenerife. The owner approved this bounded simulation slice, **not** school deployment or access to real surveillance systems.

> No real cameras, footage, credentials, camera discovery, model inference, recording, or biometric identification are connected. All camera scenes, health states, detections, accounts, and incidents in the demo are synthetic. An incident requires explicit human confirmation.

## Explore the application

The React workspace includes English/Spanish navigation, camera search/groups/layouts, synthetic camera details and configuration, event filters and cursor pagination, human review, explicit incident confirmation, notifications, and administrator access/audit views.

Start the API and web application using the [tested local runbook](docs/OPERATIONS.md), then open **http://localhost:3000**. The login screen offers three public **demo-only** roles:

| Role | Demonstration scope |
| --- | --- |
| Security operator | Six camera grants; inspect synthetic scenes, review events, explicitly confirm incidents. |
| Viewer | Four camera grants; read-only monitoring. |
| Administrator | All camera metadata/configuration and audit; only explicitly granted camera scenes/events. |

Demo passwords are deliberately public fixtures in `services/api/src/iesmmg/seed.py` and prefilled by the login controls. They are not institutional credentials and must never be reused for a real system.

## Verified foundation checks

Validated on Debian 12 with Python 3.11.2 and Node 22.22.3:

- **22 backend tests passed**, including authorization, CSRF/session lifecycle, review/incident concurrency guards, SSE revocation, cursor pagination, and SQLite migration reversibility.
- **13 frontend unit tests passed**.
- **12 Chromium end-to-end tests passed**, including automated axe checks of the implemented English/Spanish operator views and selected dialogs/admin/mobile states.
- TypeScript production build, ESLint, Ruff, mypy, formatting, and OpenAPI contract checks passed.
- npm and installed Python dependency audits reported no known vulnerabilities at the verification date.

These are development checks, **not** a production security assessment, full WCAG conformance certificate, PostgreSQL validation, or performance/load test. See the [evidence and limitations](docs/TESTING.md).

## Repository

```text
apps/web/          React + TypeScript workspace and tests
services/api/      FastAPI modular monolith, SQLite demo persistence, Alembic
contracts/         Checked-in OpenAPI exported from the actual application
docs/              Architecture, operations, API, security, testing, status
```

## Documentation and governance

- [Documentation index / required 20-topic map](docs/README.md)
- [Architecture and scope decisions](docs/ARCHITECTURE_PROPOSAL.md)
- [Installation, configuration, execution, migrations, troubleshooting](docs/OPERATIONS.md)
- [API contract and authorization semantics](docs/API.md)
- [Security, privacy, institutional gates](docs/SECURITY_AND_PRIVACY.md)
- [Dependencies and versions](docs/DEPENDENCIES.md)
- [Testing evidence](docs/TESTING.md)
- [Central status and blockers](docs/PROJECT_STATUS.md)
- [Changelog](docs/CHANGELOG.md)

Work remains on `arena/93b885b1-ies-mmg`. The owner confirmed the existing, intentionally spelled `Developement` branch as the eventual normal-development integration target. No merge, release tag, or default-branch change is authorized by this README.

**Branding is incomplete:** the authentic original institutional emblem has not been obtained and verified. The interface uses the IESMMG product wordmark and explicitly discloses the pending emblem. Do not substitute generated or generic school branding.