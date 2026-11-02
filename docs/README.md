# IESMMG Technical Documentation

**Current stage:** owner-approved synthetic foundation implemented; final owner acceptance UNDER REVIEW. No real surveillance integration or institutional deployment is authorized.

## Start here

1. [Root overview](../README.md) — product scope and demo entry point.
2. [Architecture / decision record](ARCHITECTURE_PROPOSAL.md) — approved slice, proposals, assumptions and institutional gates.
3. [Operations runbook](OPERATIONS.md) — installation, configuration, running, contracts, migrations and troubleshooting.
4. [API semantics](API.md) and [actual OpenAPI](../contracts/openapi.json).
5. [Security and privacy](SECURITY_AND_PRIVACY.md), [testing evidence](TESTING.md), [central status](PROJECT_STATUS.md).
6. [Responsibility handoffs](AGENT_COLLABORATION.md), [dependencies](DEPENDENCIES.md), [changelog](CHANGELOG.md).

## Required 20-topic map

The initial record was consolidated in the proposal. Implemented content is now split only where actual operational evidence justifies it. The proposal retains all 20 sections and links the authoritative current documents.

| # | Topic | Authoritative location | State |
| --- | --- | --- | --- |
| 1 | Project overview | [Root](../README.md), [proposal §1](ARCHITECTURE_PROPOSAL.md#1-project-overview) | Synthetic scope implemented; institutional use gated. |
| 2 | System architecture | [Proposal §2](ARCHITECTURE_PROPOSAL.md#2-system-architecture) | Modular monolith implemented; workers/gateway proposed. |
| 3 | Technology stack | [Proposal §3](ARCHITECTURE_PROPOSAL.md#3-technology-stack), [dependencies](DEPENDENCIES.md) | Actual validated runtime distinguished from candidates. |
| 4 | Front-End architecture | [Proposal §4](ARCHITECTURE_PROPOSAL.md#4-front-end-architecture) | Bilingual workspace implemented; emblem/independent review open. |
| 5 | Back-End architecture | [Proposal §5](ARCHITECTURE_PROPOSAL.md#5-back-end-architecture), [API](API.md) | Synthetic domain/API implemented. |
| 6 | Dependencies and versions | [DEPENDENCIES.md](DEPENDENCIES.md) | Exact locks, direct inventory, advisory remediation. |
| 7 | Database architecture | [Proposal §7](ARCHITECTURE_PROPOSAL.md#7-database-architecture), [operations](OPERATIONS.md#5-database-and-migrations) | SQLite/migration cycle verified; PostgreSQL unvalidated. |
| 8 | API documentation | [API.md](API.md), [OpenAPI](../contracts/openapi.json) | Actual exported contract and generated consumer. |
| 9 | CCTV integration | [Proposal §9](ARCHITECTURE_PROPOSAL.md#9-cctv-integration) | Simulation only; real integration not started. |
| 10 | AI processing | [Proposal §10](ARCHITECTURE_PROPOSAL.md#10-ai-processing-architecture) | Fixture/human-confirm lifecycle; no model inference. |
| 11 | Infrastructure | [Proposal §11](ARCHITECTURE_PROPOSAL.md#11-infrastructure-requirements) | Hosting/hardware undecided; no school probing. |
| 12 | Environment configuration | [Operations §3](OPERATIONS.md#3-configuration) | Safe demo settings documented. |
| 13 | Installation | [Operations §2](OPERATIONS.md#2-reproducible-installation) | Frozen local procedure; platform qualifications disclosed. |
| 14 | Execution | [Operations §4](OPERATIONS.md#4-run-locally) | API/frontend/test server procedures. |
| 15 | Security | [SECURITY_AND_PRIVACY.md](SECURITY_AND_PRIVACY.md) | Implemented controls and open production risks. |
| 16 | Privacy | [SECURITY_AND_PRIVACY.md](SECURITY_AND_PRIVACY.md#privacy-and-spanisheu-institutional-gate) | Synthetic only; legal/institutional assessment gated. |
| 17 | Testing | [TESTING.md](TESTING.md) | Dated results, warnings, mocked cases and exclusions. |
| 18 | Troubleshooting | [Operations §8](OPERATIONS.md#8-troubleshooting) | Observed local fixes; no invented media recovery. |
| 19 | Limitations | [Proposal §19](ARCHITECTURE_PROPOSAL.md#19-known-limitations), [status](PROJECT_STATUS.md) | Explicit unresolved scope/gates. |
| 20 | Changelog | [CHANGELOG.md](CHANGELOG.md) | Unreleased foundation; no tag/release claim. |

## Documentation integrity rules

- Label proposed, implemented, tested, approved and institutionally authorized capabilities separately.
- Link operational claims to code, schemas, commands and dated results; disclose failed/unavailable checks.
- Use exact lockfile/runtime versions; a candidate or registry `latest` is not compatibility evidence.
- Never publish credentials, tokens, secrets or real footage. Public demo passwords are explicitly synthetic fixtures.
- Preserve the authentic institutional emblem; no generated approximation or generic school substitute.
- Update setup, contract, security, limitations and status alongside behavior.
- A working-branch handoff is not a merge, release or deployment approval.