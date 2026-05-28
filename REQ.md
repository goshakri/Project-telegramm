# REQ.md

## Meta
- Last updated: 2026-04-23
- Owner: Codex
- Status: active

## 1. Product Brief
- Product/Feature: Dynamic User Interface MVP
- One-line value proposition: показать, как интерфейс может перестраиваться по schema-first JSON без чат-UI и без ручной перекомпоновки страницы.
- Why now: команде нужен наглядный локальный прототип DUI-подхода для обсуждения UX и runtime-архитектуры.

## 2. Target Audience (ICP)
- Primary segment: product designers, frontend engineers, AI product teams.
- Secondary segment: founders и demo-oriented stakeholders, которым нужно быстро показать adaptive UI.
- Context of use: локальный запуск демо, walkthrough продукта, техническая оценка schema-driven UI.
- Pain points: обычный AI UX скатывается в чат; динамические интерфейсы тяжело прототипировать и безопасно рендерить; непонятно, как ограничивать runtime whitelist-ом.

## 3. Business Goals
- Goal 1: показать landing narrative про DUI и объяснить ценность подхода.
- Goal 2: продемонстрировать mock dashboard, где AI скрыт внутри действий и автоматизаций.
- Goal 3: зафиксировать безопасный JSON-render pipeline с валидацией, fallback и smoke coverage.

## 4. Jobs To Be Done
- When a team evaluates adaptive interfaces, I want to click through a working DUI prototype so I can judge the product and engineering tradeoffs.
- Core functional job: отрендерить whitelisted UI из JSON schema и уметь менять blocks по intent-driven API.
- Emotional/social job: показать современный AI UX без ощущения "ещё одного чата".

## 5. Scope
### In scope
- Лендинг на `/` про Dynamic User Interface.
- Mock dashboard на `/dashboard`.
- Mock API `/api/dui/intent`.
- Schema validator, whitelist registry, runtime renderer, fallback behavior.
- Локальный запуск, unit tests, contract smoke tests.

### Out of scope
- Реальная LLM-интеграция.
- Персистентность, auth, multi-user state.
- Production deploy, analytics, admin tooling.

## 6. Functional Requirements
1. FR-001: `/` должен показывать editorial-style landing, объясняющий DUI и ведущий в `/dashboard`.
2. FR-002: `/dashboard` должен демонстрировать hidden-AI UX через кнопки, chips и action-triggered transformations вместо chat panel.
3. FR-003: UI должен собираться через schema-first JSON pipeline с whitelist-only registry и строгой валидацией перед рендером.
4. FR-004: `/api/dui/intent` должен возвращать допустимые schema updates для mock-сценариев.
5. FR-005: при невалидном payload или runtime failure интерфейс должен уходить в безопасный fallback без падения страницы.

## 7. Non-Functional Requirements
- Performance: локальный first render должен происходить без внешних зависимостей и без network waterfalls, кроме intent calls.
- Reliability: invalid JSON не должен приводить к небезопасному DOM insertion или полной поломке страницы.
- Security: только whitelisted components; произвольный HTML и неизвестные component types запрещены.
- Accessibility: видимые focus states, семантические кнопки/ссылки, читаемый контраст.
- Localization: MVP на английском UI copy, документация допускается на русском.

## 8. User Scenarios
1. Happy path: пользователь открывает landing, понимает DUI value prop, переходит в dashboard и запускает несколько action-driven transforms.
2. Edge case: API возвращает unsupported component type или broken schema; runtime отклоняет payload и показывает fallback message.
3. Failure/recovery: intent request падает по сети; dashboard сохраняет последний валидный layout и сообщает о graceful fallback.

## 9. Acceptance Criteria
1. Given пользователь открывает `/`, when страница загружается, then он видит narrative landing про DUI и CTA в `/dashboard`.
2. Given пользователь открывает `/dashboard`, when он нажимает one-click actions, then блоки интерфейса перестраиваются через JSON pipeline без chat window.
3. Given runtime получает invalid schema, when validation fails, then неизвестные компоненты не рендерятся и показывается безопасный fallback state.
4. Given разработчик запускает проект локально, when он выполняет build/test, then обязательные smoke checks проходят без внешнего package manager.

## 10. Success Metrics
- North star metric: количество успешно продемонстрированных DUI transitions в локальном demo flow.
- Leading indicators: время до первого meaningful render; число action-based transforms; доля валидных schemas.
- Guardrail metrics: zero unsafe component renders; zero page crashes on invalid intent payload.

## 11. Risks and Assumptions
- Assumption 1: для MVP достаточно mock API и deterministic transforms без real AI backend.
- Assumption 2: беззависимый Node stack приемлем для локального demo.
- Risk 1 + mitigation: слишком сложный schema format усложнит UX runtime; mitigation: ограничить небольшой whitelist и строгий контракт.
- Risk 2 + mitigation: без React/Next может быть меньше developer ergonomics; mitigation: компенсировать простым runtime API и тестами.

## 12. Open Questions
1. Какие блоки и intent-типологии должны войти в следующую версию после MVP?
2. Нужен ли отдельный schema diff protocol вместо полной замены sections/tree?
