# QA Strategy

## QA Goal

Protect the birthday-day experience. Testing should prove that guests can scan, play, answer timed questions with immutable locked responses, see results, view the leaderboard, and leave messages without confusion.

## Test Environments

### Local Development

Purpose:

- Validate implementation during feature development.
- Test content schemas and UI states.
- Use seeded placeholder or approved test content only.

Expectations:

- Local data must be clearly separate from production data.
- Developers should be able to run guest, display, admin, and QA flows.

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
- Test data must not appear on production leaderboard.
- Admin access must be controlled.

## QA Mode

QA mode should allow repeated testing without polluting event data.

Requirements:

- Clearly mark QA/test mode in the UI for testers.
- Tag all QA-generated records with `is_test`.
- Exclude test data from normal guest leaderboard and production display.
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
- Leaderboard updates after submission.
- Message submission persists.
- QA/test data is filtered from production views.

### End-To-End Tests

Cover:

- QR entry to result path.
- English and Vietnamese flows.
- Mobile viewport guest path.
- TV leaderboard route.
- Admin review path.
- Offline or poor-network recovery if feasible.

### Manual Device Tests

Required before production:

- iPhone Safari.
- Android Chrome if available.
- Laptop Chrome/Safari.
- Target TV or display setup.
- QR code scan from printed or displayed code.

## Content QA

Checklist:

- No invented Han facts or stories.
- Real content has been provided and approved.
- English and Vietnamese content match in meaning.
- Quiz correct answers are verified.
- Timeline and gallery do not contain fake entries.
- Asset alt text is present for meaningful images.

## Visual QA

Checklist:

- Design feels connected to the birthday backdrop's language.
- Mobile layout has no overlapping text.
- Vietnamese text wraps cleanly.
- Timer and answer choices remain stable.
- Leaderboard is legible from display distance.
- Placeholder assets are clearly placeholders.

Milestone 2 visual checks:

- Use `npm run check:visual:milestone2` against a running production or dev server. Set `MILESTONE2_BASE_URL` when the server is not on `http://localhost:3002`.
- Review `/en` and `/vi` at mobile widths for title wrapping, language controls, placeholder stability, and Vietnamese text expansion.
- Review `/vi/design-system` at mobile width with long Vietnamese copy.
- Review `/en/design-system` on desktop for token, typography, control, panel, placeholder, motif, loading, and motion examples.
- Review `/display/leaderboard` at 16:9 desktop size for distance-readable type and stable placeholder rows.
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

## Functional Acceptance Checklist

- Guest can enter through QR code.
- Guest can choose English or Vietnamese.
- Guest can enter display name.
- Guest can answer quiz questions with 20-second timer.
- Accepted answers lock and cannot be edited.
- Timed-out questions lock and cannot be edited.
- Safe retries do not create duplicate question responses.
- Guest sees a result screen.
- Leaderboard updates after submission.
- Guest can leave a message.
- Admin can see final quiz scores, messages, leaderboard state, and QA/test separation through a lightweight utility area.
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
- Rollback or disable plan defined.
