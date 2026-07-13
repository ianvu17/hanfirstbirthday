# Roadmap

This roadmap preserves the documentation-first workflow. Milestones should be completed in order unless Ian explicitly reprioritizes.

## Milestone 0: Foundation

Status: Completed after foundation alignment review.

Goals:

- Create repository documentation.
- Define AI agent context.
- Define placeholder content schemas.
- Capture product, UX, UI, architecture, and QA direction.
- Avoid application implementation.

Exit criteria:

- Requested foundation files exist.
- No app scaffold or implementation code has been added.
- Content schemas contain placeholders only.
- Documentation records per-question locked quiz responses and minimal admin scope.
- Foundation review record exists.

## Milestone 1: Project Scaffold

Status: Completed.

Goals:

- Initialize Next.js App Router with TypeScript and Tailwind CSS.
- Add shadcn/ui, Framer Motion, next-intl, and base project conventions.
- Establish route groups and folder structure from [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Wire placeholder locale files without building feature logic.
- Do not implement the full quiz, Supabase runtime, leaderboard, admin, or complete feature flows in this milestone.

Exit criteria:

- App runs locally.
- Locale routing works with placeholder content.
- No real Han content is invented.

Completion record:

- See [docs/MILESTONE_1_REVIEW.md](docs/MILESTONE_1_REVIEW.md).

## Milestone 2: Content And Design System Foundation

Status: Completed.

Goals:

- Implement theme tokens from [docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md).
- Add placeholder image and illustration handling from [docs/ASSETS.md](docs/ASSETS.md).
- Build base layout, typography, buttons, cards, and motion primitives.
- Confirm bilingual text expansion behavior.

Exit criteria:

- Core visual system works on mobile and desktop.
- Placeholder states are honest and polished.
- No feature flow is fully launched yet.

Completion record:

- See [docs/MILESTONE_2_REVIEW.md](docs/MILESTONE_2_REVIEW.md).

## Milestone 3: Guest Entry Experience

Status: Completed.

Goals:

- Build QR entry landing flow.
- Add language selection and guest identification.
- Explain the quiz rules before the timer starts.
- Show a celebratory ready screen.
- Stop at an honest quiz-coming-soon placeholder.
- Do not implement quiz engine, leaderboard runtime, Supabase persistence, admin behavior, or QA tools.

Exit criteria:

- Guest can open the app, choose language, enter a display name, understand the rules, and reach the ready screen in under 30 seconds.
- English and Vietnamese onboarding flows are complete.
- Onboarding state uses client/session storage only.
- No real Han facts, memories, quiz questions, answers, or photos are invented.
- The ready CTA stops at a placeholder for the next milestone.

Completion record:

- See [docs/MILESTONE_3_REVIEW.md](docs/MILESTONE_3_REVIEW.md).

## Milestone 3.5: Art Direction Polish

Status: Completed.

Goals:

- Elevate the existing Milestone 3 guest-entry flow without changing behavior.
- Strengthen Han-specific identity through a reusable future-photo frame and title lockup.
- Replace generic onboarding/card cues with warmer paper-party composition, party progress tags, and staged layouts.
- Preserve bilingual, mobile-first, accessible behavior and the quiz-coming-soon boundary.

Exit criteria:

- Welcome, language, name, how-to-play, and ready screens feel custom to Han's first birthday.
- No real Han photos, facts, memories, quiz questions, answer behavior, scoring, persistence, or leaderboard data are added.
- English and Vietnamese onboarding copy remains externalized.
- Milestone 3.5 visual screenshots cover mobile, desktop, small phone, focused input, reduced motion, and overflow checks.

Completion record:

- See [docs/MILESTONE_3_5_REVIEW.md](docs/MILESTONE_3_5_REVIEW.md).

## Milestone 3.6: Shared Party Screen Architecture Alignment

Status: Completed.

Goals:

- Align architecture and documentation around the laptop/TV as the main shared Party Screen.
- Clarify that phones are personal controllers, not duplicate presentation screens.
- Document the host-driven game model where Ian controls phase transitions.
- Introduce shared lifecycle terms: `LOBBY`, `QUESTION_ACTIVE`, `QUESTION_LOCKED`, `ANSWER_REVEAL`, `LEADERBOARD`, `NEXT_QUESTION`, and `FINISHED`.
- Redefine display route responsibility before quiz-engine implementation.
- Do not implement quiz engine, realtime, Supabase, networking, host controls, or new runtime behavior.

Exit criteria:

- Product, UX, architecture, QA, roadmap, and decision docs describe the Party Screen model.
- Desktop responsibilities include lobby, question, countdown, submitted-answer progress, reveal, Han fun fact, leaderboard, finished, celebration, and thank-you states.
- Phone responsibilities are limited to individual guest actions and personal progress.
- Future host controls are documented as lightweight and event-specific.

Completion record:

- See [docs/MILESTONE_3_6_REVIEW.md](docs/MILESTONE_3_6_REVIEW.md).

## Milestone 4: Party Engine

Status: Completed; awaiting Ian human approval gate.

Goals:

- Implement a React-independent local Party Engine.
- Add explicit host-driven phases for lobby, question ready/preview, question active, deadline-closed question, answer reveal, leaderboard, waiting for host, and finished.
- Add a timestamp-based 20-second question deadline through a clock abstraction.
- Enforce per-question immutable locked responses, timeout responses, idempotent retry, and conflicting retry rejection.
- Add local runtime, React provider/hooks, and distinct Party Screen, Guest Controller, and Host QA projections.
- Implement `/display/party`, `/{locale}/play`, and `/{locale}/qa/party`.
- Redirect `/display/leaderboard` to `/display/party`.
- Use clearly marked development-only bilingual fixtures without real Han facts.

Exit criteria:

- Domain, timer, runtime, projection, browser, visual, content, typecheck, lint, and build validation pass.
- Local-only limitations are documented.

Completion record:

- See [docs/MILESTONE_4_REVIEW.md](docs/MILESTONE_4_REVIEW.md).

## Milestone 5: Shared Session And Realtime Synchronization

Status: Implemented; hosted Supabase validation and Vercel preview deployment passed; awaiting Ian human approval gate, physical device rehearsal, real Host PIN rehearsal, final production activation review, and production QR verification.

Goals:

- Add Supabase schema and policies.
- Persist party sessions, participants, immutable question responses, and scores.
- Build server-authoritative shared snapshots and realtime or approved fallback updates.
- Add participant joining, command authority, reconnect/resume behavior, production leaderboard data, QA/test-data tagging, and host access strategy.

Exit criteria:

- Version-controlled Supabase migration defines sessions, participants, responses, host command log, constraints, indexes, RLS, and a response-touch function.
- `/{locale}/play`, `/display/party`, and `/{locale}/host` use the remote runtime when Supabase env is configured, with local fallback for env-less development.
- Host commands and guest responses are server-authoritative.
- Host flow uses Start Game, Reveal Answers, automatic deadline closure, Reveal Correct Answer, Show Leaderboard, and Continue/Next/Finish.
- Participant resume and Host PIN session cookies exist.
- Party Screen QR is generated from the runtime join URL.
- QA/test data is tagged through `is_test`.
- Hosted Supabase migrations, live anon RLS validation, Vercel preview deployment, and browser-context realtime rehearsal have passed.
- Remaining approval evidence requires real Host PIN entry rehearsal, final production activation review, production QR origin verification, and physical multi-device rehearsal.

## Milestone 6: Event Readiness And Content Lock

Status: Recommended next milestone from the July 13, 2026 repository audit.

Goals:

- Replace development quiz fixtures with Ian-approved bilingual quiz content or introduce an approved production content-loading path.
- Verify English and Vietnamese player, display, and host flows with approved content.
- Validate production or final-preview QR origin from real phones.
- Rehearse real Host PIN entry end to end.
- Run a physical laptop/TV plus two-phone rehearsal on the target network.
- Capture final readiness evidence in documentation.

Exit criteria:

- `npm run validate` passes locally and in CI.
- Hosted RLS and realtime validation pass against the release candidate.
- Party Screen QR resolves to a non-localhost approved origin.
- Host can unlock, create/start/advance/finish a session with the real event credential.
- Two real phones can join, answer, refresh/reconnect, reject duplicates/late submissions, and see final score behavior.
- Party Screen is legible on the target display.
- No invented Han content is introduced.
- Rehearsal/test data is tagged and separated from event rows.

## Milestone 7: Messages, Timeline Placeholder, Gallery Placeholder

Goals:

- Allow guests to leave birthday messages.
- Add timeline placeholder screen.
- Add gallery placeholder screen.
- Add lightweight admin message and score viewing if needed for event readiness.
- Ensure content remains externally managed.

Exit criteria:

- Messages persist and can be reviewed.
- Timeline and gallery do not imply fake content.
- Empty states feel intentional and warm.

## Milestone 8: Lightweight Admin And QA Mode

Goals:

- Build lightweight admin utility for scores, messages, current Party Screen or leaderboard state, Party Screen link, and necessary test resets.
- Build QA mode and test mode controls.
- Add content validation checks.
- Prepare pre-party test script.
- Keep content editing, media upload, advanced analytics, complex moderation, and user management out of MVP.

Exit criteria:

- Admin can verify readiness before party day.
- Test data does not pollute production event data.
- QA checklist passes on target devices.

## Milestone 9: Deployment Hardening And Post-Readiness

Goals:

- Harden the already configured GitHub/Vercel deployment path after Milestone 6 readiness evidence.
- Validate production deployment health after merge or release activation.
- Confirm Supabase production data safety after final rehearsal cleanup.
- Finalize any remaining real assets provided by Ian.

Exit criteria:

- Production URL remains stable after release activation.
- QR code continues to work from guest devices.
- Live Party Screen remains display-ready.
- No placeholder content remains in required guest-facing MVP paths unless intentionally approved.

## Post-Event Enhancements

Ideas for later:

- Curated memory archive.
- Exportable guest messages.
- Expanded photo gallery.
- Additional mini-games.
- Family-only private share page.
