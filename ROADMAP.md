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

## Milestone 4: Quiz Engine

Status: Recommended next milestone after Milestone 3.5.

Goals:

- Implement quiz flow with the approved content model.
- Add the 20-second timer per question.
- Enforce per-question locked responses in local/runtime architecture appropriate for this milestone.
- Show correct/incorrect/timeout reveal states and approved fun facts when provided.
- Show result screen.
- Preserve the Milestone 3 onboarding handoff.

Exit criteria:

- Guest can complete a quiz once using approved or neutral test content.
- Timer and scoring are tested.
- Each question can have at most one accepted locked response per attempt.
- Timed-out questions lock and cannot be edited.
- Duplicate response requests recover gracefully.

## Milestone 5: Supabase And Leaderboard

Goals:

- Add Supabase schema and policies.
- Persist participants, quiz attempts, immutable question responses, and scores.
- Build live leaderboard display route.
- Add QA/test-data tagging and filtering.

Exit criteria:

- Around 10 guests can submit and appear on the leaderboard.
- Leaderboard updates without manual refresh.
- QA data can be isolated from event data.

## Milestone 6: Messages, Timeline Placeholder, Gallery Placeholder

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

## Milestone 7: Lightweight Admin And QA Mode

Goals:

- Build lightweight admin utility for scores, messages, current leaderboard, TV leaderboard link, and necessary test resets.
- Build QA mode and test mode controls.
- Add content validation checks.
- Prepare pre-party test script.
- Keep content editing, media upload, advanced analytics, complex moderation, and user management out of MVP.

Exit criteria:

- Admin can verify readiness before party day.
- Test data does not pollute production event data.
- QA checklist passes on target devices.

## Milestone 8: Event Readiness And Deployment

Goals:

- Deploy preview and production to Vercel.
- Validate QR code entry.
- Run full mobile and TV tests.
- Confirm Supabase production data safety.
- Finalize real content and assets provided by Ian.

Exit criteria:

- Production URL is stable.
- QR code works from guest devices.
- Live leaderboard is display-ready.
- No placeholder content remains in required guest-facing MVP paths unless intentionally approved.

## Post-Event Enhancements

Ideas for later:

- Curated memory archive.
- Exportable guest messages.
- Expanded photo gallery.
- Additional mini-games.
- Family-only private share page.
