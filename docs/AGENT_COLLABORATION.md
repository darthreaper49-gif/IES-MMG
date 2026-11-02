# IESMMG — Responsibility Charters and Handoffs

**Updated:** 2026-11-02. **Mode:** sequential responsibility roles coordinated by one assistant, not four autonomous processes.

The owner retains authority over scope expansion, institutional consultation/deployment and release. The lead role cannot grant itself school access or release authorization. File ownership and review gates remain useful even when the same assistant performs several roles.

## Responsibility roles

| Role | Owned paths / mission | Must not do |
| --- | --- | --- |
| Front-End Engineer | `apps/web/**`; accessible bilingual operator UI, generated contract consumption, client state/tests. | Invent backend behavior, rely on hidden buttons for authorization, embed secrets/real URLs, claim live media or substitute official branding. |
| Back-End Engineer | `services/api/**`; domain correctness, identity/grants, persistence, simulation, migrations, OpenAPI provider/tests. | Connect to school systems, accept real credentials before approval, expose secrets, let a detector confirm incidents, change contracts without consumer review. |
| Technical Documentation Engineer | `docs/**`, coordinated root README; accurate 20-topic record, versions, runbooks, evidence, limitations and changelog. | Present proposals as implementation, infer successful tests, publish secrets/footage or erase unresolved failures. |
| Lead Architect / Supervisor | Root governance, `contracts/**` integration review, decision/status records; sequencing, security/privacy gates and final diff review. | Bypass owner authority, modify/merge the default branch during development, force-push shared history or assume hardware/legal approval. |

Cross-boundary fixes require an explicit handoff below. Generated OpenAPI is backend-owned and frontend-reviewed. No separate shared-types package, worker service or deployment tree is created without a demonstrated need.

## Actual repository ownership

```text
README.md, .gitignore                  Supervisor + documentation
apps/web/src/components/**            Front-end
apps/web/src/api/schema.d.ts           Generated consumer; do not hand-edit
apps/web/tests/**, *.test.ts           Front-end
services/api/src/iesmmg/**             Back-end
services/api/migrations/**, tests/**   Back-end
services/api/scripts/export_openapi.py Back-end provider; documentation checks commands
contracts/openapi.json                Exported provider artifact; supervisor checks integration
docs/**                               Documentation; supervisor approves decisions/status
```

`services/worker`, `deploy`, real media adapters and official brand-source assets do not exist yet. Their future creation needs an approved task; empty boilerplate is intentionally absent.

## Foundation handoff — 2026-11-02

```text
Task: FND-01 — bounded synthetic-only vertical slice
Roles: Back-end → Front-end → Documentation → Supervisor, executed sequentially
Status: UNDER REVIEW (implementation and automated gates complete; owner acceptance pending)
Changed paths: apps/web, services/api, contracts, docs, README.md, .gitignore
Contract impact: initial implemented OpenAPI 0.1.0; generated frontend types checked
Security/privacy impact: synthetic-only; sessions/CSRF/grants/audit/human confirmation enforced
Evidence: 22 API/migration tests; 13 frontend units; 12 browser scenarios; static/audit gates
Blockers: authentic emblem; PostgreSQL/server/deployment validation; institutional/legal approvals
Next reviewer/action: owner reviews the bounded demo; no merge/release or real-source work implied
```

### Back-end → front-end

- Actual API and semantics: [API.md](API.md), [`openapi.json`](../contracts/openapi.json).
- Administrators have all metadata access but only explicit scene/event grants; summaries follow grants.
- Events use opaque cursors; incident details can be fetched independently of the loaded event filter.
- Human review is not incident confirmation. Expected versions protect reviews, confirmation and configuration.
- Stream sessions return synthetic authorization only, never a real URL. SSE carries invalidation signals, not sensitive payloads.

### Front-end → documentation/testing

- Implemented English/Spanish shell, camera/event/incident/admin flows and honest simulation labels.
- Cursor loading deduplicates overlapping IDs; camera-group and event-camera filters are independent.
- Protected 401 clears cached account data. Locale/layout are the only persisted browser preferences.
- Browser tests isolate their database. Mocked pagination/failure scenarios are explicitly distinguished from real backend integration tests.
- Official emblem remains unavailable; the wordmark is not presented as an institutional emblem.

### Documentation → supervisor

- The initial proposal is reconciled with actual implementation in [ARCHITECTURE_PROPOSAL.md](ARCHITECTURE_PROPOSAL.md).
- [OPERATIONS.md](OPERATIONS.md), [DEPENDENCIES.md](DEPENDENCIES.md), [TESTING.md](TESTING.md), and [SECURITY_AND_PRIVACY.md](SECURITY_AND_PRIVACY.md) contain commands, versions, evidence and gates.
- Remaining limitations and the upstream TestClient warning are visible, not hidden behind aggregate “passed” labels.

## Shared semantic contracts

- UTC timestamps; observation and receipt times remain distinct.
- Registration does not imply online health; unknown/offline/disabled are honest states.
- Simulation is visibly distinct from any future authorized test/live source.
- Detection → rule-generated notification → human review → explicit authorized incident confirmation.
- Grants apply to summaries, camera scenes, events, SSE and synthetic stream authorization; administrator metadata access is separate.
- Secrets/tokens never belong in frontend payloads, URLs, logs, screenshots or documentation.
- Errors and request correlation use the checked API vocabulary.
- Contract changes identify old/new schemas, migration/compatibility impact, consumer regeneration and negative tests.

## Change-control / review gate

Before work: record objective, owner, scope, prerequisites, paths, contract/security impact, acceptance evidence and rollback. During work: preserve unrelated changes and update the central status. After work:

1. Implementer runs relevant tests and discloses failures.
2. Peer responsibility reviews contract/UX/security implications.
3. Documentation verifies paths, commands, versions and actual behavior.
4. Supervisor reviews the diff, dependency findings, negative tests and remaining limitations.
5. Owner accepts the deliverable or requests changes; release is a separate decision.

Use only NOT STARTED, IN PROGRESS, BLOCKED, UNDER REVIEW, APPROVED, COMPLETED, with the scope and evidence named. “Tests passed” can be COMPLETED while the overall milestone remains UNDER REVIEW.

## Git and release protocol

- All session work/commits/pushes stay on `arena/93b885b1-ies-mmg`; never create, rename or switch branches here.
- Owner confirmed existing `Developement` as the eventual normal-development target. Its spelling is intentional; do not silently correct it.
- `main` is the observed remote default, not an ordinary development target. No default-branch change, merge or force-push is authorized.
- A working-branch commit/push is a durable handoff, not integration or release approval. Any later PR must come from the fixed session branch and name its reviewed target.
- Release preparation requires functional/security/dependency/documentation/diff review, a release report and proposed tag; only the owner can authorize release integration.

## Standing stop conditions

Stop before school network access/discovery, real camera credentials/feeds, footage collection, network changes, recording/retention activation, external personal-data transfer, biometric work, production deployment or release integration without the corresponding explicit approvals. Independent synthetic/documentation work may continue within the approved scope.