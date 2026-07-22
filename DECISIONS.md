# Architecture Decision Records

This document records accepted decisions only. Proposed ideas should be captured in the relevant planning document until accepted.

## ADR-001: Documentation-First Foundation

**Decision**

Begin with project documentation, AI context, placeholder content schemas, and planning documents before creating application code.

**Status**

Accepted.

**Reason**

The project will be built over many iterations and must remain emotionally specific, content-safe, and consistent across future AI-assisted work.

**Consequence**

Implementation is intentionally delayed until the foundation is reviewed. Future contributors should start with [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) and the docs folder.

## ADR-002: Next.js App Router Target Stack

**Decision**

Use Next.js App Router with TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Supabase, next-intl, and Vercel.

**Status**

Accepted.

**Reason**

This stack supports mobile-first web delivery, localization, server-rendered routes, reusable UI primitives, tasteful animation, real-time data, and Vercel deployment.

**Consequence**

Architecture and future implementation should align with this stack. Alternative frameworks or hosting targets require a new ADR.

## ADR-003: Externalized Content Only

**Decision**

All content-related data must live in external content files or Supabase records. Components must not hardcode Han facts, copy, timeline entries, photo metadata, quiz questions, or message content.

**Status**

Accepted.

**Reason**

The project must never invent or accidentally bake in family memories. Externalized content keeps localization, review, and updates safer.

**Consequence**

Future implementation must load copy and structured content from content files or Supabase. Placeholder schemas are allowed until Ian provides real content.

## ADR-004: Bilingual Experience As Core Scope

**Decision**

Support English and Vietnamese as first-class locales from the beginning.

**Status**

Accepted.

**Reason**

The birthday audience includes guests who may prefer either language. Language support is part of the hospitality of the experience.

**Consequence**

Routes, content models, QA, and UI layouts must account for both languages. Missing translations should be treated as release blockers for guest-facing flows.

## ADR-005: Supabase For Runtime Event Data

**Decision**

Use Supabase for participant records, quiz attempts, immutable question responses, messages, minimal admin data, QA/test separation, and leaderboard updates.

**Status**

Accepted.

**Reason**

The project needs lightweight persistence, real-time updates, and a deployable backend compatible with Vercel.

**Consequence**

The architecture should define Supabase tables, constraints, policies, and real-time subscriptions before implementation.

## ADR-006: Mobile-First Guest Flow With TV Leaderboard

**Decision**

Optimize guest interaction for mobile phones and provide a separate display route for the live leaderboard.

**Status**

Superseded by ADR-010 where it describes the desktop display as primarily a leaderboard.

**Reason**

Guests will access the experience through QR code on personal phones while a laptop or TV displays shared party progress.

**Consequence**

Responsive design and QA must cover phone screens and large display screens as distinct experiences.

## ADR-010: Phone Controller And Shared Party Screen

**Context**

The product direction was clarified after Milestone 3.5. The laptop or TV is not merely a leaderboard display; it is the main shared Party Screen for the birthday game. Phones remain personal controller surfaces for individual guests.

**Decision**

Model the experience as two simultaneous surfaces:

- Phone: personal guest controller for QR entry, language choice, display name, answering questions, submitting answers, and viewing personal progress.
- Desktop/laptop/TV: shared Party Screen for the room, including lobby/join, question, countdown, answer progress, answer reveal, Han fun fact, leaderboard, finished, celebration, and thank-you moments.

The birthday game is host-driven. Ian controls phase transitions such as Start Game, Open Question, Reveal Answer, Show Fun Fact, Show Leaderboard, and Next Question. Once a question is opened, its 20-second countdown remains automatic. ADR-019 later supersedes the production host wording here by replacing Open Question with Reveal Answers and removing required manual lock behavior.

**Status**

Accepted.

**Reason**

The shared display should entertain the entire room, including guests who never use a phone. This better matches the birthday-party setting and prevents future implementation from treating the desktop as a narrow results table.

**Consequence**

Future architecture, UX, QA, and route responsibilities must distinguish phone controller behavior from Party Screen behavior. The quiz engine, realtime state, Supabase schema, networking, and host controls remain deferred until their approved implementation milestones.

**Recommended Lifecycle Terms**

- `LOBBY`
- `QUESTION_ACTIVE`
- `QUESTION_LOCKED`
- `ANSWER_REVEAL`
- `LEADERBOARD`
- `NEXT_QUESTION`
- `FINISHED`

## ADR-007: Per-Question Immutable Responses

**Context**

The quiz has a 20-second timer per question and guests answer one question at a time. Earlier wording could be interpreted as keeping all answers editable until the whole quiz is completed.

**Decision**

Each question has its own question response. Once the server accepts a submitted answer, that response is permanently locked. If the timer expires before a valid answer is submitted, the question response is locked as timed out. The final score is calculated from all locked question responses in the completed quiz attempt.

**Status**

Accepted.

**Reason**

Per-question locking matches the live party quiz experience, makes timer behavior clear, supports reveal states and fun facts after each question, and keeps retry handling small enough for a family birthday game.

**Consequence**

Future implementation must enforce one accepted question response per quiz attempt per question. Retried requests must be idempotent and must not create duplicate responses or reopen locked answers. There is no editable end-of-quiz review of all answers.

**Rejected Alternatives**

- Keep all answers editable and submit the complete quiz at the end.
- Add examination-level identity verification or anti-cheating systems.

## ADR-008: Minimal Admin MVP

**Context**

Ian is not expected to use admin tools frequently. Admin functionality exists to support event-day confidence and QA, not to become a content platform.

**Decision**

Admin MVP is a small utility area. It may view guest names and final quiz scores, view submitted birthday messages, view the current Party Screen or leaderboard state, distinguish QA/test data from real event data, remove or reset incorrect test records or quiz attempts when necessary, open or link to the Party Screen, and optionally show a simple readiness summary.

**Status**

Accepted.

**Reason**

Minimal admin scope protects the guest MVP, reduces party-day risk, and keeps content ownership file-driven for the first release.

**Consequence**

Admin implementation should be clear and visually consistent, but it does not require the same decorative intensity as guest-facing screens. It must not block guest MVP work.

**Deferred Capabilities**

- CMS or content editor.
- Visual quiz editor.
- Translation editor.
- Media upload manager.
- Advanced analytics dashboard.
- Complex moderation workflow.
- Role-management system.
- Reusable admin platform.

## ADR-009: Bilingual Typography Pairing For Visual Foundation

**Decision**

Use Baloo 2 as the expressive display font and Be Vietnam Pro as the primary body/UI font, loaded through `next/font/google` with Latin and Vietnamese subsets.

**Status**

Accepted.

**Reason**

Milestone 2 requires a playful title treatment and a highly legible body font that both support Vietnamese diacritics. Baloo 2 provides rounded, party-appropriate display shapes without requiring local font assets. Be Vietnam Pro keeps body copy, buttons, admin labels, and longer Vietnamese strings readable on phones.

**Consequence**

Future UI work should use the display font for celebratory headings and title moments only, and use Be Vietnam Pro for body, forms, controls, admin, QA, and leaderboard supporting text. Any future font change must preserve Vietnamese rendering, mobile readability, and build reliability.

## ADR-011: React-Independent Local Party Engine

**Context**

Milestone 4 introduces the core party runtime before Supabase synchronization. The runtime must coordinate the shared Party Screen, guest phones, host pacing, the 20-second question timer, immutable responses, reveal phases, and local leaderboard projection without becoming a React page state machine.

**Decision**

Implement a React-independent Party Engine under `lib/party-engine/` with explicit typed phases, typed commands, structured domain errors, pure selectors, a clock abstraction, and deterministic fixture content. React consumes the engine through a local runtime contract in `lib/party-runtime/`, with surface-specific projections for Party Screen, Guest Controller, and Host QA controls.

Milestone 4 uses a local in-memory runtime only. It does not implement Supabase, realtime synchronization, server authority, production QR generation, host authentication, or cross-device state sharing.

**Status**

Accepted.

**Reason**

This keeps the highest-risk product behavior testable without a browser, avoids contradictory UI-owned lifecycle state, and leaves a clean adapter boundary for a future Supabase-backed runtime.

**Consequence**

Future remote synchronization should replace the runtime adapter rather than rewriting the Party Screen or Guest Controller. Local simulation is useful for QA, but it must not be described as production realtime behavior.

## ADR-012: Select-Then-Confirm Answer Submission

**Decision**

Milestone 4 guest answering uses select-then-confirm: tapping an option only selects it, and pressing Submit Answer dispatches the authoritative response command. Accepted responses become immutable. Exact duplicate retries are idempotent, conflicting retries are rejected, and submissions are accepted only when received by the runtime before `deadlineAt`.

**Status**

Accepted.

**Reason**

Separate confirmation reduces accidental taps in a live party setting and makes locking behavior obvious to guests.

**Consequence**

Guest draft selection remains local UI state. Authoritative Party State stores only accepted locked answers and timeout responses.

## ADR-013: Supabase-Backed Remote Party Runtime

**Decision**

Milestone 5 adds a Supabase-backed remote runtime path while preserving the dependency direction established in Milestone 4: Party Engine -> runtime/mapping boundary -> React surfaces. Supabase rows are mapped to `PartyState`, processed through the existing Party Engine reducer, and projected back to display, guest, and host-safe views.

**Status**

Accepted.

**Reason**

The party needs real multi-device synchronization without replacing the tested engine with page-owned database conditionals.

**Consequence**

Remote code lives behind server routes and mapping helpers. The Party Engine does not import Supabase, React, Next.js routes, browser APIs, or authentication code.

## ADR-014: Server-Authoritative Host Commands And Responses

**Decision**

Production host commands and guest responses go through trusted Next.js route handlers. Host commands require a verified host session cookie and expected revision. Guest responses require a participant resume cookie and are accepted only while the authoritative snapshot permits the active question and deadline.

**Status**

Accepted.

**Reason**

Guest phones and browser countdowns cannot be trusted to decide phase, deadline, correctness, duplicate response handling, score, or host permissions.

**Consequence**

Browser clients do not write authoritative rows directly. Service-role Supabase access remains server-only. Database constraints enforce one response per participant/session/question.

## ADR-015: Minimal Host PIN Session

**Decision**

The production Host Controller at `/{locale}/host` uses a short PIN form. The server verifies `HOST_PIN_HASH` or `HOST_PIN` and sets a signed HttpOnly `han_host_session` cookie. Host commands require that cookie.

**Status**

Accepted.

**Reason**

Ian needs a simple event-day protection mechanism without accounts, OAuth, roles, or a large admin product.

**Consequence**

The host PIN is not included in the client bundle. This is event-level access control, not a general identity system. Repeated PIN protection remains modest and should be revisited before public launch if abuse risk changes.

## ADR-016: Revision Plus Snapshot Resync Model

**Decision**

`party_sessions.revision` is the monotonic reconciliation value. Host commands compare expected revision before persisting transitions. Accepted guest responses touch the session revision so displays and hosts refetch authoritative projections. Clients ignore older revisions and periodically resync.

**Status**

Accepted.

**Reason**

Supabase realtime delivery is not guaranteed to be exactly once or perfectly ordered, and multiple host tabs or response bursts must not regress UI state.

**Consequence**

Host Controller disables actions while pending and reconciles to server snapshots. Realtime is used as a wake-up signal; server snapshots remain authoritative.

## ADR-017: QA And Production Data Isolation

**Decision**

Party sessions, participants, responses, and host command logs include `is_test`. `PARTY_SESSION_IS_TEST` controls the default created session mode. The QA route remains a local developer harness; production routes filter and label session mode.

**Status**

Accepted.

**Reason**

Ian must be able to test repeatedly without polluting event data or the production leaderboard.

**Consequence**

Reset/destructive tools stay out of the production Host Controller. Live preview/local environments should set `PARTY_SESSION_IS_TEST=true`; the final event environment should explicitly set it to `false`.

## ADR-018: GitHub-Driven Vercel Deployment

**Decision**

Use GitHub as the source of truth for release commits and use native Vercel Git integration for Preview and Production deployments. GitHub Actions runs quality gates and optional protected live validation only; it does not deploy through `vercel deploy` in the normal path.

**Status**

Accepted.

**Reason**

The project needs repeatable CI, visible commit status, Vercel preview URLs tied to GitHub commits and pull requests, and safer production activation than local CLI-driven deployments.

**Consequence**

`origin/main` becomes the production branch once production environment setup is approved. Local Vercel CLI deployments are reserved for diagnostics or explicitly approved emergency/manual work. Live hosted validation remains manually triggered and test-mode only.

## ADR-019: Reveal Choices Opens Answering

**Context**

Pre-rehearsal UX review found that the host flow exposed too many technical steps: a question preview, a separate Open Question control, a manual Lock Answers control, and then reveal. Guests also saw answer options before the host had intentionally revealed choices, and transient realtime lifecycle events made the connection badge flicker.

**Decision**

Keep the persisted Milestone 5 phase strings for compatibility, but reinterpret them with clearer product semantics:

- `question_ready` is the question preview state.
- `REVEAL_CHOICES` moves from preview to `question_active`, reveals choices, and starts the authoritative 20-second deadline.
- `question_active` has no required host action; the runtime/server closes it automatically at the deadline.
- `LOCK_QUESTION` is retained only for deadline-driven runtime closure and is rejected when requested as a host action.
- `question_locked` means answers are closed and the host may reveal the correct answer.

Realtime UI exposes stabilized user-facing states: connecting, Live, reconnecting/resyncing, offline, and needs attention. Short subscription transitions use a grace period before becoming visible.

**Status**

Accepted as a July 13, 2026 pre-approval refinement. This does not mark Milestone 5 or Milestone 6 complete.

**Reason**

Ian should have one obvious action at each stage during the party, guests should not see answer controls until choices are revealed, and connection feedback should be calm and truthful rather than reflecting low-level transport noise.

**Consequence**

Production host controls must not show Open Question or required Lock Answers controls. Documentation and tests should describe `REVEAL_CHOICES` as the host-facing command while allowing existing `question_ready`, `question_active`, and `question_locked` rows to remain database-compatible.

## ADR-020: Approved Static Bilingual Quiz Content Loader

**Context**

Milestone 4 and the first Milestone 5 implementation used development-only fixture questions for both local and remote runtime validation. The app now needs a production-safe content boundary for Ian-approved birthday questions without moving question definitions into Supabase.

**Decision**

Normal local application runtime, Vercel Preview, and Production load quiz questions from the approved bilingual locale content files, `content/en.json` and `content/vi.json`, through `getApprovedPartyConfig()`. The adapter validates both locale files, pairs questions by stable id, maps authoring `answers` to runtime `options`, maps `correctAnswerId` to `correctOptionId`, preserves optional `assetId`, and returns the existing `PartyConfig` shape.

Development fixtures remain available only through explicit fixture use: the QA party harness and fixture-specific automated tests. Fixture selection must not be based only on `NODE_ENV`.

Question definitions remain static content. Supabase remains responsible only for runtime state: party sessions, participants, immutable question responses, and host command logs.

The canonical authoring schema uses quiz-level `questionDurationSeconds`; per-question durations are not supported. A question participates through one field, `enabled`.

**Status**

Accepted.

**Reason**

This preserves the tested Party Engine, reducer, projections, scoring, server-authoritative API routes, and Supabase runtime model while removing normal runtime dependency on development fixture questions.

**Consequence**

Question ids and option ids are content contracts. After rehearsal approval, they must not change for an active session because existing `question_responses` rows store those ids. A new content deployment should be tested with a new party session.

## ADR-021: Authoritative Countdown, Direct Progression, And Winner Certificate

**Decision**

All host, guest, and Party Screen countdowns derive their visible time from the persisted question deadline plus the server-snapshot clock offset. Clients may animate locally at a short interval, but they must not write timer ticks or allow a clock correction to increase the displayed countdown. The remote deadline includes a small delivery allowance that clients cap at the configured 20 seconds, allowing each room surface to receive and visibly render 20 before decreasing.

The production leaderboard has one action: advance directly to the next question preview, or finish and show the winner after the final question. The older `waiting_for_host` phase and split `COMPLETE_PRESENTATION` path remain readable for recovery compatibility but are not part of the normal production flow.

The just-finished session remains current until the host archives it or replaces it. This preserves a refresh-safe final celebration and permits a server-only certificate endpoint to verify the participant resume cookie, derive the deterministic first-place row, download any photo avatar from private Storage, and generate the localized one-page A4 certificate. The browser supplies no winner name, score, rank, or avatar authority.

**Status**

Accepted as final gameplay polish on July 16, 2026.

**Reason**

The party needs smooth second-by-second feedback without high-frequency database traffic, an unambiguous answer reveal, one obvious host action, a durable winner moment, and a certificate that cannot be claimed or altered by another guest.

**Consequence**

Projections never expose `correctOptionId` before reveal. Winner ties remain deterministic through the existing leaderboard ordering; only rank 1 receives the certificate action. `CERTIFICATE_EVENT_DATE` is optional and must contain an Ian-approved localized date before it is shown; otherwise the certificate uses approved generic event wording.

## ADR-022: Persisted Time Scoring, Session Question Count, And Leaderboard Race

**Decision**

Correct answers use `time-v1`: 1,000 base points plus a rounded bonus of up to 1,000 points based on authoritative server receipt time, persisted question-open time, and the configured question duration. Incorrect answers and timeouts earn zero. Every response persists `points_awarded` and `scoring_version`; the existing `response_duration_ms` is the clamped response-time evidence. Historical responses retain their original 0/1 value as `correct-count-v1` and are never rescored.

Every party session persists an immutable `question_count`, defaulting to 10. Creation validates the count against the enabled approved question set, and the runtime uses the first N questions in existing deterministic order. The approved question definitions remain unchanged.

Shared projections include previous score, current-question gain, previous rank, and final rank. The Party Screen renders these as a browser-only horizontal bar chart race. Animation progress is not persisted, and the race identity is session id plus question id. Reduced-motion clients render the settled result immediately.

**Status**

Accepted for the gameplay enhancement milestone on July 17, 2026.

**Reason**

The party benefits from rewarding both knowledge and speed, avoiding frequent ties, allowing shorter rehearsals, and making leaderboard reveals more exciting without weakening server authority.

**Consequence**

Leaderboard order is total points descending, then participant creation order, display name, and participant id. Winner and certificate authorization sum persisted awarded points. Host creation owns the session length; it cannot change during the session. The host advance action waits for the essential leaderboard animation unless reduced motion is requested.

## ADR-023: Authenticated Onboarding Edits, Readiness, And Reveal-Safe Scores

**Decision**

Remote onboarding may move backward from every step after Welcome. Once a resume cookie identifies a participant, language, display-name, avatar, and readiness mutations update that participant only; they never call participant creation. Profile and avatar changes reset readiness. Repeating the same profile or readiness value is an idempotent no-op. The persisted participant locale is the source of truth for guest gameplay and resume routing.

Participants persist `is_ready` and `ready_at`. The host lobby receives joined and ready counts plus display-safe participant summaries. Starting is disabled when nobody is ready, requires confirmation when some joined participants are not ready, and proceeds directly when all are ready.

Correctness and awarded points may be computed and persisted when an answer is accepted, but guest and shared public projections mask the current question until `answer_reveal`. Before reveal they expose the previous revealed total and a public locked-response shape with no correctness, points, response-duration, scoring-version, or correct-option fields. At reveal the existing awarded points become visible and remain the source for the leaderboard race and certificate.

Avatar upload progress uses browser preparation, observable multipart upload bytes, an indeterminate server-persistence phase, and 100% only after the authenticated avatar route returns success. Cancellation aborts the client request; because server commit may win the race, the client reconciles from the next authoritative participant snapshot. The gallery input has no `capture` attribute; the selfie path remains a separate `getUserMedia` flow.

**Status**

Accepted for the production-polish milestone on July 18, 2026.

**Reason**

Guests must be able to correct onboarding information without duplicate identities, hosts need trustworthy lobby readiness, and the quiz must preserve reveal suspense while keeping server-authoritative scoring intact.

**Consequence**

Editable onboarding is available only while the current session is in the lobby. Host start routes resumed guests to gameplay. Remote session storage is a draft/navigation bridge only; participant identity and confirmed profile state remain server-authoritative. A mobile browser or operating system may still offer camera as one chooser option, but the web app must not force camera capture from Choose a photo.

## ADR-024: Host Winner Certificate Export

**Decision**

Keep the guest certificate route winner-only, and add a separate host-authenticated certificate export for the current finished session. The host route verifies the signed host cookie, derives the deterministic first-place participant server-side from persisted responses, downloads any private avatar server-side, and returns the same localized Han Mastermind PDF.

**Status**

Accepted for event operations on July 22, 2026.

**Reason**

Ian may need to print or save the winner certificate from the Host Controller even if the winning guest's phone is unavailable. This keeps event-day control practical without letting browsers supply winner name, score, rank, avatar, or session data.

**Consequence**

`GET /api/party/certificate` remains participant-authenticated and winner-only. `GET /api/party/host/certificate` is host-authenticated and limited to the current finished session. Archived or arbitrary session exports are out of scope.
