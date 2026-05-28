# TDD.md

## Meta
- Last updated: 2026-04-23
- Owner: Codex
- Status: active

## 1. Testing Strategy
- Primary approach: `node:test` with red -> green -> refactor loops for each MVP behavior slice.
- Test pyramid ratio: mostly unit coverage, with one low-cost HTTP contract smoke for the live server boundary.
- Coverage target: lock the current MVP server, validated schema runtime contract, and `/api/dui/intent` mock behavior without introducing flaky setup.

## 2. Test Environments
- Local: Node.js 24+, no external services, no external test dependencies.
- CI: same commands as local; tests should be runnable in a clean checkout with only Node installed.
- Staging: not required for current MVP smoke coverage.

## 3. Test Types
- Unit: direct tests for `api/dui/intent.mjs` and schema validity using lightweight request/response doubles.
- Integration: deferred until the intent handler is wired to richer persisted runtime state.
- Contract: smoke-run the real `server.mjs` in a child process and verify routing plus `/api/dui/intent` responses over HTTP.
- E2E: not in scope for the current MVP.
- Visual regression: not in scope for the current MVP.
- Performance smoke: keep the contract suite small and deterministic; no benchmark gate yet.

## 4. Red-Green-Refactor Workflow
1. Write a failing test for the observable contract.
2. Make the smallest change set needed to turn the suite green.
3. Refactor only when the behavior remains locked by tests.
4. Update test docs when the workflow or commands change.

## 5. Feature Test Template
### MVP server routing and mock intent endpoint
- Requirement link: `REQ.md#6-functional-requirements`
- Context link: `CONTEXT.md#6-api-contracts`

### Cases
1. Happy path: `GET /` and `GET /dashboard` return HTML shells; `GET /main.js` returns the client entry script; `POST /api/dui/intent` returns a valid dashboard schema for a known intent.
2. Validation: `GET /api/dui/intent` rejects unsupported methods with `405`.
3. Error handling: malformed or incomplete POST payloads return structured `400`, service-offline simulation returns `503`, and unknown routes return `404` JSON.
4. Edge conditions: `mock.behavior = "invalid"` returns an intentionally broken schema so the client fallback path can be verified separately.

### Test Data
- Fixtures: none.
- Factories: lightweight in-memory HTTP doubles for handler unit tests.
- Mocks/stubs: child-process server harness with free-port allocation and readiness polling.

### Exit Criteria
- Unit and contract smoke tests pass locally with `node:test`.
- No sleeps-only synchronization or fixed-port assumptions.
- Failure output includes enough detail to diagnose routing regressions quickly.

## 6. Regression Checklist
- `/api/dui/intent` method contract, validation errors, and success payload stay explicit.
- Server HTML shell routes stay reachable.
- Static asset serving for the client entry point stays reachable.
- Unknown routes continue returning structured JSON `404`.

## 7. Quality Gates in CI
- Lint/type checks: none defined yet.
- Unit tests: required.
- Integration tests: optional until real intent wiring exists.
- E2E smoke: not required for current MVP.
- Coverage threshold: qualitative only for now; protect the live HTTP boundary and current placeholder API contract.

## 8. Defect Log Template
| Bug ID | Found in | Test added? | Root cause | Preventive action |
|---|---|---|---|---|
| BUG-001 |  | yes/no |  |  |

## 9. Flakiness Protocol
- How to quarantine: prefer fixing the harness immediately; quarantine only if an environment-specific issue is proven.
- Max quarantine period: one working day.
- Owner to fix: the contributor who introduced or last modified the flaky test path.
