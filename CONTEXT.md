# CONTEXT.md

## Meta
- Last updated: 2026-04-23
- Owner: Codex
- Status: active

## 1. System Overview
- Product domain: AI-native product demo / dynamic UI runtime.
- High-level architecture: Node 24 HTTP server отдает две HTML entry pages и один mock JSON endpoint; клиентский runtime валидирует schema и рендерит только whitelisted components.
- Core modules:
  - `server.mjs`: routing и static file serving.
  - `app/client/pages/*`: page-level schemas и orchestration.
  - `app/client/lib/dui-*`: schema validation, registry, render runtime, intent requests.
  - `api/dui/intent.mjs`: mock intent response builder.
  - `tests/**`: unit и contract smoke coverage.

## 2. Tech Stack
- Frontend: vanilla ES modules, semantic HTML, CSS custom properties.
- Backend: Node.js 24 `http` server.
- Database: none.
- Infra/Hosting: local development only.
- CI/CD: not configured; local build/test scripts act as quality gate.

## 3. Repository Map
- `/`: product docs, server entry, package metadata.
- `/app/client`: browser runtime, pages, styles, components.
- `/api/dui`: mock DUI intent handlers.
- `/tests`: unit and contract smoke tests.
- `/scripts`: build-time checks and DX helpers.

## 4. Global Rules
- Coding standards: ES modules, ASCII by default, small pure helpers where possible.
- Branching strategy: N/A in current local workspace.
- Versioning policy: MVP snapshot, semver placeholder in `package.json`.
- Error handling policy: validate before render; reject invalid schemas; preserve last valid state when possible.
- Logging/observability policy: console logging only for local server lifecycle; no analytics.

## 5. Domain Model
- Entities:
  - `DuiSchema`: validated JSON document that describes layout tree and allowed actions.
  - `DuiNode`: single renderable component instance from whitelist.
  - `IntentRequest`: user action payload sent to `/api/dui/intent`.
  - `IntentResponse`: server-provided schema update or fallback metadata.
- Relationships:
  - Page orchestrators create or request `DuiSchema`.
  - Runtime validates schema and uses registry to render `DuiNode`s.
  - Dashboard sends `IntentRequest`; API returns `IntentResponse`.
- Invariants:
  - unknown component types are rejected.
  - render path never inserts raw HTML from schema.
  - every external schema update passes strict validation before DOM update.

## 6. API Contracts
- Public endpoints:
  - `GET /`: landing shell.
  - `GET /dashboard`: dashboard shell.
  - `POST /api/dui/intent`: mock intent endpoint.
- Internal endpoints/events:
  - client-side action dispatch from buttons/chips/cards.
- Request/response contracts:
  - request body contains page context, intent id, and optional payload.
  - success response returns valid DUI schema or deterministic patch payload.
  - error response returns machine-readable error plus fallback-safe message.
- Backward compatibility rules:
  - schema version field must be explicit.
  - additions to registry must be opt-in and tested.

## 7. Data & Storage
- Schemas: in-memory JSON only.
- Migration policy: N/A for MVP.
- Retention policy: none.
- Backup/recovery: none; runtime fallback preserves current in-memory view only.

## 8. Security & Compliance
- AuthN/AuthZ: none for MVP.
- Secrets handling: none.
- PII/data classification: synthetic mock data only.
- Compliance constraints: do not render arbitrary markup or execute schema-provided scripts.

## 9. Performance Constraints
- Latency SLO: local intent response should feel instant, target under 200 ms excluding deliberate mock delay.
- Throughput target: single-user demo.
- Cost constraints: zero paid services and zero external runtime dependencies.

## 10. Architecture Decision Log (ADR-lite)
1. Decision: использовать беззависимый Node stack вместо framework scaffolding.
   - Context: в среде нет `npm/pnpm/yarn`, но есть Node 24.
   - Choice: построить MVP на `http` server + vanilla ES modules + built-in test runner.
   - Consequences: выше контроль над runtime и гарантированный локальный запуск; ниже уровень framework ergonomics.
2. Decision: schema-first UI с whitelist-only registry.
   - Context: задача требует строгую валидацию и запрет произвольных компонентов.
   - Choice: рендерить только компоненты, зарегистрированные в registry и прошедшие validation.
   - Consequences: меньше гибкости, но существенно ниже риск unsafe render.

## 11. Dependencies
- External services: none.
- Third-party SDKs: none.
- Known limitations: нет SSR hydration framework, нет persistent state, нет real AI backend.

## 12. Operational Runbook
- Start: `node --run start`
- Build: `node --run build`
- Test: `node --run test`
- Deploy: not defined for MVP.
- Rollback: revert local file changes or restore previous workspace snapshot.
