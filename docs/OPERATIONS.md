# IESMMG Foundation Runbook

**Scope:** local synthetic demo and development tests only. Production startup is intentionally rejected. No procedure here authorizes connecting school cameras or deploying to a school network.

## 1. Prerequisites

Validated host: Debian 12, Linux x64, Python **3.11.2**, Node **22.22.3**, npm **10.9.8**. The manifests allow Python 3.11–3.14 and Node 22/24, but those other combinations have not been validated here. PostgreSQL, Docker, FFmpeg, real media gateways, and model runtimes are not required or installed for this slice.

Install Python and Node through your approved mechanism. Commands below use POSIX shells from the repository root. On Windows, use WSL or adapt executable paths; Windows was not tested.

## 2. Reproducible installation

The root `.venv` holds the pinned `uv` tool; the API has a separate `services/api/.venv`.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install uv==0.13.6
cd services/api
../../.venv/bin/uv sync --frozen
cd ../../apps/web
npm ci
```

Do not substitute `latest`, force peer dependencies, or edit lockfiles without rerunning the quality gates. The checked-in locks contain **67 Python package entries** and **342 npm package entries** (including optional/platform entries). See [DEPENDENCIES.md](DEPENDENCIES.md).

The browser test dependency contains a Linux/x64 Chromium binary and support libraries. Tests extract them to the OS temporary directory; no browser download or system package installation occurs during the test run. On another platform, set `E2E_CHROMIUM_PATH` to an approved locally installed Chromium executable.

## 3. Configuration

From `services/api`, optionally copy `.env.example` to `.env`. Defaults work without a file. Never commit `.env` or put secrets in frontend variables.

| Variable | Default | Meaning |
| --- | --- | --- |
| `IESMMG_ENV` | `demo` | Only `demo` or `test`; other values fail validation. `test` disables automatic simulation. |
| `IESMMG_DATABASE_URL` | `sqlite:///./data/iesmmg-demo.db` | SQLAlchemy URL, relative to the API process working directory. SQLite is the validated demo database. |
| `IESMMG_SIMULATE` | `true` | Generate synthetic events in demo mode; ignored in test mode. |
| `IESMMG_SIMULATION_INTERVAL_SECONDS` | `45` | Generation interval, bounded to 10–3600 seconds. |
| `IESMMG_SESSION_HOURS` | `8` | Absolute session lifetime, bounded to 1–24 hours. |
| `IESMMG_SECURE_COOKIES` | `false` | Set true only behind a correctly configured HTTPS boundary; also enables HSTS. |
| `IESMMG_EXTRA_ORIGIN` | empty | One exact additional trusted origin for a separate frontend/proxy. No wildcard. |

Frontend development variables, set in the shell rather than browser-exposed `VITE_*` secrets:

- `API_PROXY_TARGET`: Vite's internal API target, default `http://127.0.0.1:8000`.
- `E2E_CHROMIUM_PATH`: optional browser override; browser tests otherwise use the pinned bundled binary.

Browser requests use relative `/api/v1` URLs. Vite proxies them to the API. The demo binds to `0.0.0.0` for the Arena preview and accepts preview hostnames. **These permissive development-server settings are not a production hosting configuration.**

## 4. Run locally

Terminal 1, from `services/api`:

```bash
.venv/bin/python -m uvicorn iesmmg.main:app --host 0.0.0.0 --port 8000
```

Terminal 2, from `apps/web`:

```bash
npm run dev
```

Open **http://localhost:3000**. API reference: **http://localhost:8000/api/docs**. Health: **http://localhost:8000/api/v1/system/health**. In the Arena live preview, use the port-3000 preview rather than a browser-local localhost address.

Demo startup creates missing SQLite tables and seeds three public fixture accounts, three groups, eight cameras, and eight events. It does not erase existing data. The generator adds at most one event per interval and stops at 500 total events per database. New registered cameras start `unknown`, not online.

For a fresh demo, stop the API, move the demo database aside as a local backup, and restart. Do not delete a database that may contain wanted review/audit history. Database files and media directories are ignored by Git.

### Installed-package caveat

`uv sync` installs the local Python package into its environment. After changing backend source, either reinstall it with:

```bash
../../.venv/bin/uv sync --frozen --reinstall-package iesmmg-api
```

or run the server/tests with `PYTHONPATH=src` as the test harness does. Restart Uvicorn after backend changes; there is no production hot-reload assumption. Vite updates frontend source during development.

## 5. Database and migrations

The validated schema has users, camera groups, cameras, explicit camera grants, hashed sessions, events, reviews, incidents, and audit events. SQLite foreign-key enforcement is enabled. Demo bootstrap uses `create_all`; this convenience is not a migration strategy.

For a separate migration-validation database, from `services/api`:

```bash
IESMMG_DATABASE_URL=sqlite:///./data/migration-check.db .venv/bin/alembic upgrade head
IESMMG_DATABASE_URL=sqlite:///./data/migration-check.db .venv/bin/alembic check
IESMMG_DATABASE_URL=sqlite:///./data/migration-check.db .venv/bin/alembic downgrade base
IESMMG_DATABASE_URL=sqlite:///./data/migration-check.db .venv/bin/alembic upgrade head
```

**Downgrade removes all application tables and their data.** Run it only on a disposable validation database. The initial revision `06ed0e8980ed` passed upgrade/check/downgrade/upgrade on SQLite, also covered by `tests/test_migrations.py`.

PostgreSQL with Psycopg 3 remains the proposed production direction. The driver is locked, but no PostgreSQL server was available: migration execution, transaction isolation, concurrency, backup/restore, and performance on PostgreSQL are **BLOCKED / NOT VALIDATED**. Do not point the demo bootstrap at an institution's database.

## 6. Contract generation

From `services/api`:

```bash
PYTHONPATH=src .venv/bin/python scripts/export_openapi.py
PYTHONPATH=src .venv/bin/python scripts/export_openapi.py --check
```

Then from `apps/web`:

```bash
npm run generate:api
npm run build
```

The checked contract is `contracts/openapi.json`; generated consumer types are `apps/web/src/api/schema.d.ts`. Review both diffs. The exporter does not start the server, seed a database, or connect to a camera.

## 7. Verification commands

From `services/api`:

```bash
.venv/bin/pytest
.venv/bin/ruff check .
.venv/bin/ruff format --check .
.venv/bin/mypy
.venv/bin/pip-audit --local --skip-editable
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

Playwright starts its own API on port 8001 with an **in-memory database** and frontend on port 3001. It refuses to reuse existing servers and stops them afterward. Ports must be free. It never changes the interactive demo database. See [TESTING.md](TESTING.md) for scope and warnings.

## 8. Troubleshooting

| Symptom | Safe diagnosis / resolution |
| --- | --- |
| `ModuleNotFoundError: iesmmg` | Run from `services/api`, sync the frozen environment, reinstall the local package as above, or use `PYTHONPATH=src`. |
| Frontend loads but API fails | Check port 8000 health and `API_PROXY_TARGET`; inspect the Vite terminal. Browser code must use relative API paths. |
| Login rejected after repeated wrong passwords | Eight failures for the same client IP/username start a five-minute window. Successful login clears that account's failure budget. The limiter is process-local, not a production abuse service. |
| CSRF or origin rejection | Reload to restore the session token. Check the exact proxy origin and host/port. Configure `IESMMG_EXTRA_ORIGIN` only for a trusted frontend; never disable CSRF checks. |
| Secure cookies fail locally | `IESMMG_SECURE_COOKIES=true` requires HTTPS. Use the default false only for the local HTTP synthetic demo. |
| Camera/events missing | Check the account's explicit grants. Administrator metadata access does not grant every camera scene/event. |
| Camera says unknown/offline/disabled | This is a synthetic state, not a network diagnosis. No socket or camera URL is used. Enable/configure the fixture if intended. |
| Updates say periodic refresh | SSE may be unavailable; the UI polls. Check the event-updates endpoint and proxy buffering. SSE lasts five minutes and reconnects. |
| Browser cannot load `libnspr4.so` / `libnss3.so` | Use the checked-in Playwright setup, which extracts bundled libraries. Do not manually scan archives or disable browser security. On unsupported platforms use `E2E_CHROMIUM_PATH`. |
| E2E port already occupied | Stop the unrelated process on 3001/8001. Tests intentionally do not reuse a potentially stateful demo server. |
| Contract check fails | Export OpenAPI, regenerate frontend types, review changes, and rerun tests. Do not hand-edit generated types. |
| Migration check reports changes | Review model/migration differences and create a reviewed migration. Never use downgrade on valuable data as a first diagnostic. |

Do not paste cookies, authorization headers, passwords, database URLs containing secrets, or real footage into issue reports. The public demo passwords are fixtures, not production secrets.

## 9. Shutdown and recovery boundaries

Stop the frontend and API with Ctrl+C. Browser-test servers are managed by Playwright. SQLite data remains local. There is no implemented backup scheduler, retention/deletion service, high-availability configuration, gateway recovery, or model-worker recovery. Those require a separately approved deployment design and tested operational procedures.