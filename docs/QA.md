# QA Strategy

## QA Goal

Protect the birthday-day experience. Testing should prove that guests can scan, play from phones as personal controllers, answer timed questions with immutable locked responses, watch the shared Party Screen move through the room experience, see results, view the leaderboard, and leave messages without confusion.

## Test Environments

### Local Development

Purpose:

- Validate implementation during feature development.
- Test content schemas and UI states.
- Use seeded placeholder or approved test content only.

Expectations:

- Local data must be clearly separate from production data.
- Developers should be able to run guest, Party Screen/display, admin, and QA flows.

### Preview Deployment

Purpose:

- Test Vercel-hosted behavior before production.
- Share a realistic URL for device testing.
- Validate Supabase configuration and real-time updates.

Expectations:

- Preview should use test data or `is_test` flags.
- QR code behavior should be tested using preview URL before production QR generation.

### Production Deployment

Purpose:

- Event-day experience.

Expectations:

- Production content must be approved.
- Required translations must be complete.
- Test data must not appear on the production Party Screen or leaderboard.
- Admin access must be controlled.

## QA Mode

QA mode should allow repeated testing without polluting event data.

Requirements:

- Clearly mark QA/test mode in the UI for testers.
- Tag all QA-generated records with `is_test`.
- Exclude test data from normal guest leaderboard, production Party Screen, and production display views.
- Provide a reset path for test data if approved.
- Keep QA routes out of public guest navigation.

## Test Mode

Test mode is for controlled validation of specific flows.

Use cases:

- Simulate a guest completing quiz.
- Simulate timer expiration.
- Simulate duplicate question-response retry.
- Simulate network failure or retry.
- Simulate empty leaderboard.
- Simulate Party Screen lobby, active question, locked question, reveal, leaderboard, and finished phases once runtime exists.
- Simulate host-driven phase advancement once host controls exist.
- Simulate question preview, reveal-answer-choices, automatic deadline closure, and correct-answer reveal without a required manual lock step.
- Simulate missing optional assets.

Test mode must not invent real Han content. Use neutral placeholder content only.

## Testing Strategy

### Unit And Logic Tests

Cover:

- Quiz scoring.
- Timer behavior.
- Question response locking and idempotent retry logic.
- Content schema validation.
- Locale key parity.
- Leaderboard ranking and tie-break rules.

### Component Tests

Cover:

- Language selector.
- Guest name form validation.
- Quiz question state.
- Answer selection.
- Accepted and locked answer reveal.
- Timeout and locked reveal.
- Result summary.
- Message form.
- Empty states.

### Integration Tests

Cover:

- Guest starts and completes quiz.
- Each accepted question response persists once.
- Duplicate question-response requests recover gracefully.
- Party Screen and leaderboard state update after relevant game events.
- Message submission persists.
- QA/test data is filtered from production views.

### End-To-End Tests

Cover:

- QR entry to result path.
- English and Vietnamese flows.
- Mobile viewport guest path.
- Party Screen route.
- Host-driven phase progression once implemented.
- Admin review path.
- Offline or poor-network recovery if feasible.

### Manual Device Tests

Required before production:

- iPhone Safari.
- Android Chrome if available.
- Laptop Chrome/Safari.
- Target TV or Party Screen display setup.
- QR code scan from printed or displayed code.

## Content QA

Checklist:

- No invented Han facts or stories.
- Real content has been provided and approved.
- English and Vietnamese content match in meaning.
- Quiz correct answers are verified.
- Question ids and answer-option ids are stable before rehearsal approval.
- Final content is validated through `getApprovedPartyConfig()` and tested in a fresh session after deployment.
- Timeline and gallery do not contain fake entries.
- Asset alt text is present for meaningful images.

## Visual QA

Checklist:

- Design feels connected to the birthday backdrop's language.
- Mobile layout has no overlapping text.
- Vietnamese text wraps cleanly.
- Timer and answer choices remain stable.
- Party Screen questions, countdowns, reveals, fun facts, and leaderboard states are legible from display distance.
- Placeholder assets are clearly placeholders.

Milestone 2 visual checks:

- Use `npm run check:visual:milestone2` against a running production or dev server. Set `MILESTONE2_BASE_URL` when the server is not on `http://localhost:3002`.
- Review `/en` and `/vi` at mobile widths for title wrapping, language controls, placeholder stability, and Vietnamese text expansion.
- Review `/vi/design-system` at mobile width with long Vietnamese copy.
- Review `/en/design-system` on desktop for token, typography, control, panel, placeholder, motif, loading, and motion examples.
- Review `/display/leaderboard` at 16:9 desktop size for distance-readable type and stable placeholder rows. After the Party Screen route is introduced, review that route for lobby, question, reveal, leaderboard, and finished compositions.
- Review `/{locale}/admin` for restrained utility styling.
- Review `/{locale}/qa` for clear QA/test marking.
- Review with reduced motion enabled where practical; global CSS and Framer Motion primitives should suppress nonessential movement.

Milestone 3 visual checks:

- Use `npm run check:visual:milestone3` against a running server. Set `MILESTONE3_BASE_URL` when the server is not on `http://localhost:3000`.
- The script captures mobile screenshots for Welcome, Language, Name, How to play, Ready, and Quiz Coming Soon in both English and Vietnamese.
- The script checks horizontal overflow on the ready screen at iPhone SE, modern iPhone, Pixel width, iPad, desktop, and large-TV viewports.
- The script captures a reduced-motion Vietnamese welcome screenshot.
- Review screenshots in `.next/milestone-3-screenshots/after/` before considering the milestone ready for approval.
- Before/after comparison screenshots for this milestone are stored under `.next/milestone-3-screenshots/before/` and `.next/milestone-3-screenshots/after/`.

Milestone 3.5 visual checks:

- Use `npm run check:visual:milestone3.5` against a running server. Set `MILESTONE35_BASE_URL` when the server is not on `http://localhost:3000`.
- The script captures mobile English and Vietnamese onboarding screenshots for Welcome, Language, Display Name empty, How to Play, and Ready.
- It captures English focused name input, small-phone welcome/name-focused/how-to-play, desktop welcome/language/name/how-to-play/ready, tablet Vietnamese ready, and reduced-motion Vietnamese welcome.
- Screenshots are stored in `.next/milestone-3-5-screenshots/`.
- The script checks horizontal overflow for every captured state, but screenshots must still be visually inspected before milestone acceptance.

Milestone 4 visual checks:

- Use `npm run check:visual:milestone4` against a running server. Set `MILESTONE4_BASE_URL` when the server is not on `http://localhost:3000`.
- The script captures `/display/party`, `/{locale}/play`, and `/{locale}/qa/party` states.
- Screenshots are stored in `.next/milestone-4-screenshots/`.
- Captured states include lobby, question ready, active, locked, reveal, leaderboard, direct next-question transition, finished, guest join-required, Vietnamese active question, mobile active harness, and reduced-motion Vietnamese active harness.
- The script checks horizontal overflow, but screenshots must still be visually inspected before Milestone 4 approval.

Milestone 4 logic checks:

- Use `npm run test:party-engine`.
- The suite covers lifecycle transitions, invalid transitions, immutable response locking, exact duplicate retry idempotency, conflicting retry rejection, deadline boundary behavior, timeout materialization, projection secrecy before reveal, host capabilities, scoring, and manual-clock runtime scheduling.

Milestone 5 checks:

- Use `npm run test:party-runtime` for Host PIN/session and participant resume token logic.
- Use `npm run test:supabase` or `npm run test:rls` for static migration assertions covering tables, constraints, indexes, RLS policies, and the response revision touch function.
- Use `npm run test:rls:live` only after hosted Supabase env values are configured. It creates `codex-m5-validation-*` test rows, validates anon RLS behavior with browser-equivalent credentials, verifies direct REST tampering is denied, reports cleanup counts, and deletes only its own validation sessions.
- Use `npm run test:realtime:live` against an isolated local server and `LIVE_REALTIME_JOIN_CODE=codex-m5-*` to rehearse hosted Supabase realtime with independent display, host, English guest, and Vietnamese guest browser contexts.
- Current realtime rehearsal expects `REVEAL_CHOICES` as the host action that opens answering. It should not rely on a production host `LOCK_QUESTION` command.
- Set `LIVE_REALTIME_HOST_PIN` through a silent shell prompt for final rehearsal when the real Host PIN route must be validated end to end.
- Use `npm run vercel:push-env -- --target=preview --dry-run` after Vercel linking to verify required preview env values without printing secrets, then rerun without `--dry-run` to push them.
- Use native Vercel Git integration for normal preview deployments from GitHub commits. `npx vercel deploy --yes` is now a legacy/manual preview fallback only; do not pass `--target=preview`.
- Use `PREVIEW_PARTY_BASE_URL=<preview-url> PREVIEW_PARTY_EVIDENCE_DIR=<evidence-dir> npx tsx scripts/validate-preview-party-flow.ts` for deployed Preview host/guest/Party Screen validation when checking mobile no-scroll, connection status stability, and host-driven question flow. The script creates only Preview test sessions and writes screenshots plus `results.json`.
- Use `npm run test:countdown` for deadline math, device-clock offset, 20-through-0 sequencing, clamp, and cleanup coverage. Remote browser rehearsal must confirm all surfaces advance locally between snapshot refreshes.
- Use `npm run test:certificate` and `npm run render:certificate-samples` for English/Vietnamese, long-name, preset, initials, single-page A4, and route-security coverage. Render the PDFs through Poppler plus a platform viewer, and test the deployed endpoint as winner and non-winner before release.
- Use `npm run check:visual:milestone5` against a running server to capture `/display/party`, English/Vietnamese guest controller, production Host PIN screen, and QA harness screenshots.
- Hosted Supabase RLS, Vercel preview deployment, and browser-context realtime validation have passed; physical multi-device rehearsal remains required before event approval.
- Physical rehearsal should use laptop `/display/party`, Ian phone `/{locale}/host`, one English guest phone, and one Vietnamese guest phone. Test one guest on mobile data if possible.

Production-polish remote rehearsal must additionally verify Back edits preserve one participant, Ready-to-Back decrements host readiness, gallery selection does not carry a `capture` attribute, avatar upload exposes real byte progress plus indeterminate persistence and cancellation reconciliation, Vietnamese remains active through final state, and a correct submission exposes neither points nor correctness in the pre-reveal JSON snapshot. Record whether the picker was exercised on physical iOS Safari; viewport emulation is not equivalent.

Time-scoring and configurable-session checks:

- Use `npm run test:scoring` for worked 20-second examples, integer bounds, incorrect answers, defensive negative elapsed time, and malformed duration.
- Use `npm run test:session-config` for default 10, 3/5/7/10 first-N selection, ordering, and invalid count rejection.
- Use `npm run test:leaderboard-race` for previous/final scores and ranks, deterministic ties, and nice scale ceilings.
- Use `npm run check:visual:leaderboard-race` against a running app for 10-row 1366x768, 1920x1080, and reduced-motion captures.
- Deployed rehearsal must create a fresh three-question Preview test session, use at least three participants covering fast correct, slow correct, and incorrect/timeout, finish after question 3, and verify winner-only certificate output says the winner's correct count out of 3.
- Also create a fresh session without changing the control and confirm the first projection is `/10`.
- Reports must include exact Vercel URL, deployment type, branch or commit, timestamp, tested viewports, locales, and whether testing was automated browser emulation or a physical device.

## Functional Acceptance Checklist

- Guest can enter through QR code.
- Guest can choose English or Vietnamese.
- Guest can enter display name.
- Guest can create or skip a party avatar after name entry using selfie, photo upload, or built-in preset.
- Camera permission is requested only after tapping selfie, and the camera stops after capture, cancel, step navigation, or unmount.
- Uploaded avatar images reject unsupported MIME types, oversized files, invalid images, and non-512 prepared server payloads.
- Guest can answer quiz questions with 20-second timer.
- Host reveals answer choices to start the 20-second timer.
- Accepted answers lock and cannot be edited.
- Timed-out questions lock and cannot be edited.
- Answering closes automatically when the deadline expires.
- Guest reveal explicitly identifies the correct answer, the guest's different selected answer, or timeout without exposing correctness before reveal.
- Leaderboard advances directly to the next question or final winner without returning to reveal.
- Safe retries do not create duplicate question responses.
- Guest sees a result screen.
- Correct guest reveal shows the authoritative awarded points; score labels use points while question progress keeps the `question/total` form.
- Host can select a valid session question count before creation, reconnect restores it, and the final transition occurs after question N without preparing N+1.
- Party Screen leaderboard grows bars from previous persisted totals, shows this-round gain, reorders stable participant rows, and settles without replaying on unrelated snapshot refreshes.
- Party Screen and leaderboard update after submission or host-driven phase changes once runtime exists.
- Guest, Party Screen leaderboard, reveal leaderboard, and final result identity surfaces show photo, preset, or initials fallback avatars.
- Stored photo avatars contain sticker artwork but no selection ring or editor control.
- Only deterministic rank 1 can download a localized, one-page A4 certificate; non-winners are denied.
- Guest can leave a message.
- Admin can see final quiz scores, messages, Party Screen or leaderboard state, and QA/test separation through a lightweight utility area.
- QA/test data is separate from production data.
- Timeline and gallery placeholders do not invent content.

## Release Readiness Checklist

- Foundation docs reviewed.
- Content approved.
- Assets approved.
- Translations complete.
- Supabase production data separation verified.
- Vercel production deployment verified.
- QR code points to production URL.
- Critical path tested on target devices.
- Admin access confirmed.
- Party Screen display and host-paced run-of-show checked on the target display once implemented.
- Rollback or disable plan defined.
