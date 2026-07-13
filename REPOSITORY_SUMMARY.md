# Repository Summary

Last audited: July 13, 2026.

This is the authoritative current-stage summary for the repository. Historical milestone review files remain useful as records, but this file should reflect the codebase as it exists now.

## Executive Status

Han Birthday Experience is a runnable Next.js App Router application with the birthday visual foundation, localized guest onboarding, a React-independent party game engine, local QA simulation, Supabase-backed shared sessions, server-authoritative host and guest API routes, a production Host Controller, generated QR lobby, realtime wake-up plus snapshot resync, and GitHub/Vercel CI/CD documentation.

The project is now in a remote-runtime complete, event-readiness pending stage. It has real gameplay/session infrastructure, but it does not yet have approved Han quiz content, guest messages, gallery/timeline screens, a complete admin utility, final production QR approval, or physical laptop/two-phone rehearsal evidence.

Current capability flags:

| Capability | Current state |
| --- | --- |
| Real gameplay engine | Implemented through `lib/party-engine/*`, with typed phases, reducer, selectors, clock abstraction, timer locking, response locking, scoring, and tests. |
| Real question engine | Implemented for enabled fixture questions in `content/party-fixtures.json`; real approved Han content is missing. |
| Server-authoritative sessions | Implemented through `app/api/party/*`, `lib/party-remote/repository.ts`, and Supabase migrations. |
| Realtime device synchronization | Implemented as Supabase realtime wake-up plus periodic snapshot refetch in `lib/party-remote/use-remote-party.ts`; physical-device rehearsal remains unverified. |
| Scoring | Implemented as one point per correct locked response in `selectLeaderboardRows`. |
| Leaderboards | Implemented in shared projections and Party Screen display; mobile standalone leaderboard route is not implemented. |
| Host controls | Implemented at `/{locale}/host` with PIN auth and one dominant next action. |
| Recovery and reconnection | Implemented through participant resume cookies, host session cookies, snapshot polling, revision checks, stabilized reconnecting/offline UI, and refresh recovery tests. |
| Production-ready CI/CD | CI and GitHub/Vercel release docs exist; production activation still needs final readiness and physical rehearsal. |

## Capability Matrix

| Capability | Status | Evidence | Important limitations | Validation |
| --- | --- | --- | --- | --- |
| Party/session lifecycle | Implemented and integrated | `party_sessions` migrations; `createPartySession`, `archivePartySession`, `loadCurrentPartySession`; `/{locale}/host` | Finishing clears current session, so a new session must be created for replay | Static migration tests; remote session architecture tests |
| Public join flow | Implemented and integrated | `POST /api/party/join`; `RemoteGuestController`; QR in `PartyScreenView` | Requires onboarding `sessionStorage` display name; join-code query is decorative today | Unit/runtime tests; live realtime harness documents join path |
| Host session control | Implemented and integrated | `POST /api/party/host/login`; signed `han_host_session`; `POST /api/party/host/command` | No advanced rate limiting for PIN attempts | `host-auth.test.ts`; live realtime harness |
| Desktop shared display | Implemented and integrated | `/display/party`; `RemotePartyScreenClient`; `PartyScreenView` | Display locale is currently English at route level; final TV rehearsal missing | Milestone visual scripts; live realtime harness |
| Mobile player flow | Implemented and integrated | `/{locale}/play`; `GuestPlayClient`; `RemoteGuestController` | No message, gallery, timeline, or standalone mobile leaderboard | Engine tests; visual scripts; live realtime harness |
| Gameplay state machine | Implemented and integrated | `processPartyCommand`; phases `lobby` through `finished` | Phase names differ slightly from early uppercase planning terms | `party-engine.test.ts` |
| Question engine/content | Implemented but placeholder-only | `getDevelopmentPartyConfig`; `content/party-fixtures.json` | Fixture questions and fun facts are not approved Han content | Fixture validation in engine tests |
| Answer lifecycle | Implemented and integrated | `SUBMIT_RESPONSE`; `question_responses` unique constraints; `submitRemoteResponse` | Exact retry idempotency is checked from loaded bundle; conflicting duplicate returns 409 | Engine tests; live realtime harness |
| Timer synchronization | Implemented and integrated | Authoritative `question_deadline_at`; server `receivedAt`; `autoLockExpiredQuestion` | Browser countdown is display-only; no one-second server broadcast | Engine deadline tests; live realtime harness |
| Realtime propagation | Implemented and integrated | Supabase subscriptions to `party_sessions` and `participants`; polling refresh | Raw response rows are not subscribed directly; response accepted touches session revision | Static migration checks; live realtime harness documented |
| Scoring engine | Implemented and integrated | `selectLeaderboardRows`; `is_correct` stored in `question_responses` | Tie-break is deterministic by join order/name, not final product-approved | Engine tests |
| Leaderboard | Implemented and integrated | `SharedPartyProjection.leaderboard`; `PartyScreenView` | No separate `/{locale}/leaderboard` phone route | Engine tests; display visual checks |
| Reconnection and refresh recovery | Implemented and integrated | Participant resume token cookie; snapshot refresh; revision filtering; stabilized connection badge | Cross-device physical rehearsal still pending | `host-auth.test.ts`; live realtime harness |
| Duplicate-answer prevention | Implemented and integrated | Reducer immutable response logic; DB unique `(party_session_id, participant_id, question_id)` | No direct database immutability trigger beyond insert-only server route and no anon writes | Engine tests; static migration/live validation |
| Session isolation | Implemented and integrated | `party_key + deployment_environment + is_current`; `PARTY_SESSION_IS_TEST` metadata | Preview and production can share Supabase only with disciplined env setup | `session-architecture.test.ts`; `PARTY_SESSION_ARCHITECTURE.md` |
| Host authorization | Implemented and integrated | Host PIN hash/session secret; HttpOnly host cookie; command route auth | Event-level PIN, not full account system | `host-auth.test.ts`; live realtime harness |
| RLS/server boundaries | Implemented and integrated | Migrations enable RLS, deny anon writes, narrow anon selects, service-role server routes | Static checks do not prove hosted RLS unless live env is configured | `test:supabase`; `test:rls:live` when configured |
| End-of-game flow | Implemented | `FINISH_PARTY`; `finished` phase; `partyStateToSessionPatch` clears current | After finish, public snapshots return no current session until host creates one | Engine tests; remote architecture tests |
| Reset/replay flow | Partially implemented | Local QA reset; production create/archive sessions | No production destructive reset; intentional for safety | Local QA harness; session architecture tests |
| Content management | Partially implemented | `content/en.json`, `content/vi.json`, validation scripts, fixture file | No approved real quiz/messages/gallery/timeline content | `validate:content` |
| CI/CD | Implemented | `.github/workflows/ci.yml`; `.github/workflows/live-validation.yml`; `docs/DEPLOYMENT.md` | Final production activation still requires readiness checks and rehearsal | CI-equivalent local validation |
| Monitoring/operations | Partially implemented | Release readiness script; deployment docs; host session history | No runtime monitoring dashboard, logging pipeline, or rate-limit telemetry | Static/script review |

## End-To-End Runtime Trace

1. Host opens `/{locale}/host`; `ProductionHostController` checks `/api/party/host/status`.
2. Host submits PIN to `/api/party/host/login`; server verifies `HOST_PIN_HASH` or `HOST_PIN` and sets `han_host_session`.
3. Host creates a session through `POST /api/party/sessions`; repository calls Supabase `create_party_session`, scoped by `party_key + deployment_environment`.
4. Desktop opens `/display/party`; with Supabase env configured it renders `RemotePartyScreenClient`, fetches `/api/party/session`, and shows a QR generated from `joinUrl`.
5. Guest completes `/{locale}` onboarding; `GuestPlayClient` reads `sessionStorage` and renders `RemoteGuestController` on `/{locale}/play`.
6. Guest joins through `POST /api/party/join`; server creates `participants` row, stores hashed resume token, and sets `han_participant_session`.
7. Host advances phases through `POST /api/party/host/command`; server verifies host cookie, compares expected revision, runs `processPartyCommand`, persists session timestamps/phase, and records `host_command_log`. `REVEAL_CHOICES` is the production command that reveals answer choices and starts the deadline.
8. When a question is active, guest submits to `POST /api/party/response`; server validates participant cookie, active question, deadline, option id, and immutable response rules before inserting `question_responses`.
9. Accepted responses call `touch_party_session_response`, bumping `party_sessions.revision`.
10. Desktop, host, and phones receive realtime wake-ups from `party_sessions`/`participants` or periodic polling, then refetch `/api/party/session`.
11. Server builds safe projections using `buildSharedPartyProjection` and `buildGuestProjection`; clients ignore older revisions.
12. Deadline expiry closes answering automatically, then the host reveals the correct answer, shows leaderboard, completes presentation, prepares the next question, and eventually finishes the party. Finished sessions are no longer current.

Browser clients do not write authoritative Supabase rows directly. The only client-side authority left is draft UI selection before Submit Answer.

## Current Gaps

Critical before event use:

- Approved real Han quiz content and Vietnamese parity.
- Physical laptop/TV plus at least two-phone rehearsal on the target network.
- Real Host PIN entry rehearsal using `LIVE_REALTIME_HOST_PIN` or manual host login.
- Production origin and QR verification from real phones.

High:

- Messages are not implemented.
- Timeline and gallery are placeholders/content models only.
- `/{locale}/admin` remains a placeholder; production host controls exist separately.
- Final product decision for leaderboard tie-break is still pending.

Medium:

- No advanced PIN rate limiting.
- No standalone mobile leaderboard route.
- No production monitoring or alerting beyond host visibility and manual checks.
- Development fixture questions currently drive the remote runtime.

## Validation Status

Latest audit validation on July 13, 2026:

- `npm run validate`: passed.
- `npm run test:rls:live`: passed against hosted Supabase with validation-owned cleanup.
- `npm run test:realtime:live`: first attempt was blocked by no active validation session; rerun passed after creating an isolated `PARTY_KEY=codex-m5-audit` current session. Cleanup removed 2 responses, 3 participants, and 1 session.

Repository scripts:

- `npm run validate:content`: validates localized content shape and parity.
- `npm run typecheck`: TypeScript check.
- `npm run lint`: ESLint.
- `npm run test`: party engine plus remote host/session tests.
- `npm run test:supabase`: static migration/RLS fragment assertions.
- `npm run build`: Next production build.
- `npm run validate`: CI-equivalent aggregate of content, typecheck, lint, tests, static Supabase checks, and build.

Live checks requiring configured external services:

- `npm run test:rls:live`: hosted Supabase anon/RLS/tampering validation.
- `npm run test:realtime:live`: hosted Supabase plus browser-context display/host/guest rehearsal.
- `npm run check:release-readiness`: GitHub/Vercel readiness inspection.
- Physical device rehearsal: manual, not automated.

## Stale Material Resolved

This file previously claimed that the repository had no Supabase schema, no APIs, no runtime implementation, no deployment documentation, and that Milestone 4 was next. Those claims are obsolete. The current repository contains the Milestone 4 local engine, Milestone 5 remote runtime, migrations, API routes, host controller, realtime snapshot hook, CI, and deployment docs.

## Recommended Next Milestone

Recommended next milestone: Event Readiness And Content Lock.

Why this is highest value now: the largest remaining risk is no longer core gameplay infrastructure. It is whether the real party can be run reliably with approved content, real devices, correct production origin/QR behavior, and Ian's actual host controls.

Included:

- Replace development quiz fixtures with Ian-approved bilingual quiz content or introduce an approved content-loading path for production questions.
- Validate English and Vietnamese guest/player/display/host flows with that content.
- Run production-origin QR verification.
- Run physical laptop/TV plus two-phone rehearsal.
- Rehearse real Host PIN entry.
- Capture final release/readiness evidence and update docs.

Excluded:

- Message submission, gallery, and timeline unless Ian explicitly prioritizes them above event readiness.
- Advanced admin dashboard or CMS.
- New game mechanics.
- Complex account/auth system.

Dependencies:

- Approved quiz questions, answers, and fun facts from Ian.
- Final production app origin.
- Final Host PIN hash/session secret in production.
- Target devices/network availability for rehearsal.

Acceptance criteria:

- `npm run validate` passes locally and in CI.
- Production or final preview `/display/party` shows a non-localhost QR URL.
- A host can unlock with the real Host PIN and create/start/advance/finish a session.
- Two real phones can join, answer, refresh, recover, and see final score behavior.
- Duplicate answer retry and late/locked response rejection are tested.
- English and Vietnamese guest flows are verified on phones.
- Party Screen is legible on the target display.
- Test/rehearsal rows are clearly tagged and do not pollute event data.

Suggested implementation sequence:

1. Confirm approved quiz content and content ownership.
2. Wire production question content without inventing Han facts.
3. Run local validation and visual checks.
4. Deploy preview/production candidate through GitHub/Vercel.
5. Run hosted RLS and realtime validation.
6. Run physical rehearsal with the final origin/QR and real Host PIN.
7. Update `PROJECT_CONTEXT.md`, `ROADMAP.md`, and readiness docs with final evidence.

## Final Repository State

The repository is buildable and testable through local scripts. Documentation is now broadly consistent about the true stage: remote runtime infrastructure exists, but event readiness and real content remain pending. The working tree may contain audit documentation changes after this file is updated; check `git status --short` before committing.
