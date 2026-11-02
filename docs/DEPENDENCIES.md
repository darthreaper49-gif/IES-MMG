# Dependencies and Versions

**Inventory date:** 2026-11-02. Exact direct pins and transitive integrity hashes are in [`services/api/pyproject.toml`](../services/api/pyproject.toml), [`uv.lock`](../services/api/uv.lock), [`apps/web/package.json`](../apps/web/package.json), and [`package-lock.json`](../apps/web/package-lock.json). Locks are authoritative; this page is a readable direct-dependency inventory, not a replacement.

## Validated runtime

| Component | Verified version | Qualification |
| --- | --- | --- |
| OS | Debian 12 bookworm, Linux x64 | This sandbox only; not an institutional hosting decision. |
| Python | 3.11.2 | Manifest permits >=3.11,<3.15; other versions untested. |
| Node / npm | 22.22.3 / 10.9.8 | Manifest permits Node 22/24; Node 24 untested here. |
| uv | 0.13.6 | Root tool environment; frozen API lock verified. |
| SQLite | Python's system SQLite driver | Local demo/migration validation, not production capacity evidence. |
| Test Chromium | 143.0.7499.0 | Bundled by `@sparticuz/chromium` 143.0.4; test-only, Linux/x64. |
| axe-core | 4.14.0 | Through `@axe-core/playwright` 4.14.0. |

No MediaMTX, FFmpeg, Docker, PostgreSQL server, ONNX runtime, GPU toolkit or model weights are installed. Registry/release observations about those technologies are candidates, not verified integrations.

## Backend direct dependencies

| Package | Pin | Purpose | Declared license |
| --- | --- | --- | --- |
| FastAPI | 0.162.0 | API, validation and OpenAPI | MIT |
| Uvicorn | 0.54.0 | ASGI server | BSD-3-Clause |
| Pydantic | 2.14.2 | Strict schemas/serialization | MIT |
| pydantic-settings | 2.14.2 | Environment configuration; advisory fix applied | MIT |
| SQLAlchemy | 2.1.6 | ORM/transactions | MIT |
| Alembic | 1.20.1 | Schema migrations | MIT |
| argon2-cffi | 25.1.0 | Password hashing | MIT |
| psycopg + binary extra | 3.3.6 | PostgreSQL adapter, not server-validated | LGPL-3.0-only |

Development/build: pytest 9.2.0 (MIT), httpx 0.28.1 (BSD-3-Clause), Ruff 0.17.3 (MIT), mypy 2.4.1 (MIT), pip-audit 2.10.1, Hatchling 1.29.0. The Python lock has **67 package entries**, including the local package and transitive dependencies.

## Frontend runtime dependencies

| Package | Pin | Purpose | Declared license |
| --- | --- | --- | --- |
| react / react-dom | 19.3.1 | Accessible component UI | MIT |
| @tanstack/react-query | 5.105.1 | Server cache, polling and cursor pages | MIT |
| lucide-react | 1.66.0 | Interface icons, not institutional branding | ISC |

Tailwind CSS 4.3.3 and its Vite plugin are pinned build-time dependencies; project CSS tokens/components provide the actual design. There is no remote font/CDN requirement, analytics SDK, map SDK or external inference client.

## Frontend development/test dependencies

- Build/types: Vite 8.3.5, TypeScript 5.9.3, `@vitejs/plugin-react` 6.2.1, React types 19.3.0, Node types 22.19.11, Tailwind/Vite 4.3.3.
- Quality: ESLint 10.14.0, `@eslint/js` **10.0.1**, typescript-eslint 8.72.1, react-hooks plugin 7.1.1, react-refresh plugin 0.4.24, globals 16.5.0, Prettier 3.6.2.
- Unit/component: Vitest 5.0.5, Testing Library React 16.3.3, user-event 14.6.8, jest-dom 6.9.1, jsdom 30.1.3.
- Browser/accessibility: Playwright 1.64.1, axe integration 4.14.0, serverless Chromium package 143.0.4.
- Contract: openapi-typescript 7.13.0.

Except where noted, these direct npm packages declare MIT; Playwright and TypeScript declare Apache-2.0, and axe integration declares MPL-2.0. The npm lock contains **342 package entries**, including optional/platform packages that may not be installed on this host. Transitive licenses remain in their package metadata; this is not a completed legal/license compatibility assessment.

## Deliberate resolution decisions

- React Testing Library hooks were aligned with the available compatible **7.1.1** release instead of forcing npm peer resolution.
- TypeScript remains **5.9.3** because the selected lint toolchain supports it; a newer registry `latest` label is not a compatibility test.
- `pydantic-settings` was upgraded from 2.13.1 to **2.14.2** after pip-audit reported CVE-2026-58203. This application did not configure the affected nested-secrets source, but the dependency was still remediated.
- A package override pins transitive `minimatch` to **11.0.1** after npm reported GHSA-g3hv-75wg-m249. ESLint, OpenAPI generation, build and browser tests passed with the override; npm's suggested major downgrades were not applied blindly.
- The browser setup extracts bundled NSS/NSPR support files on Debian. It does not use the package's convenience flags that disable web security/site isolation.

## Audit and update policy

On the verification date, full `npm audit --audit-level=moderate` reported **0 known vulnerabilities**, and `pip-audit --local --skip-editable` reported **0 known vulnerabilities** in installed third-party Python packages. The local IESMMG package is skipped by that tool; these results are not a code security audit. Advisory databases change over time.

Before release or dependency expansion: review the lock diff, package provenance/maintainers, transitive licenses, runtime support and advisories; run clean installation and all functional/accessibility/migration gates; record any remaining finding and owner decision. Do not use `--force`, suppress advisories without explanation, or track `latest` at deployment time. A future SBOM can be generated from the reviewed locks; no SBOM compliance claim is made here.