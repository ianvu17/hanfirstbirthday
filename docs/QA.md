# QA Strategy

## QA Goal

Protect the birthday-day experience. Testing should prove that guests can scan, play, submit once, see results, view the leaderboard, and leave messages without confusion.

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
- Simulate duplicate submission.
- Simulate network failure or retry.
- Simulate empty leaderboard.
- Simulate missing optional assets.

Test mode must not invent real Han content. Use neutral placeholder content only.

## Testing Strategy

### Unit And Logic Tests

Cover:

- Quiz scoring.
- Timer behavior.
- Submit-once guard logic.
- Content schema validation.
- Locale key parity.
- Leaderboard ranking and tie-break rules.

### Component Tests

Cover:

- Language selector.
- Guest name form validation.
- Quiz question state.
- Answer selection.
- Result summary.
- Message form.
- Empty states.

### Integration Tests

Cover:

- Guest starts and completes quiz.
- Attempt submission persists once.
- Duplicate submission recovers gracefully.
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

## Functional Acceptance Checklist

- Guest can enter through QR code.
- Guest can choose English or Vietnamese.
- Guest can enter display name.
- Guest can answer quiz questions with 20-second timer.
- Guest can submit once.
- Guest sees a result screen.
- Leaderboard updates after submission.
- Guest can leave a message.
- Admin can see submissions and messages.
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
