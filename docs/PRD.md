# Product Requirements Document

## Product Name

Han Birthday Experience

## Public Title

WHO IS TURNING ONE?!

## Vision

Create a premium interactive birthday experience that feels like part of Han's first birthday party. Guests should scan a QR code, participate in a short playful quiz, see the room's leaderboard, and leave a message that can become part of the family's memory archive.

The product should make guests smile and help them feel connected to Han's celebration. It should not feel like a generic quiz platform.

## Goals

- Provide a fast, mobile-first guest experience.
- Support English and Vietnamese from the beginning.
- Make the quiz short, playful, and reliable during the party.
- Preserve memories through messages and future gallery/timeline content.
- Display a live leaderboard on a laptop or TV.
- Give Ian/admin tools to test and manage the experience before and during the event.
- Keep content externalized and reviewable.

## Non-Goals

- Build a reusable quiz SaaS product.
- Require guest accounts.
- Add social login.
- Generate or invent Han-related memories.
- Launch untested experimental features on party day.
- Implement a complex content management system before the MVP needs it.

## Personas

### Guest

A family member or friend at the party. They scan the QR code on a personal phone, choose a language, play the quiz, view results, and optionally leave a message. They may be distracted, holding food, or helping children, so the flow must be quick and forgiving.

### Host/Admin

Ian or another trusted person preparing the experience. They need confidence that content is correct, submissions work, the leaderboard displays properly, and test data can be separated from real event data.

### Leaderboard Viewer

Someone watching the shared display during the party. They may not interact directly but should understand the room's progress and feel the energy of the experience.

### Future Family Viewer

Someone revisiting messages, gallery, or timeline content after the event. Future memory features should preserve warmth and accuracy.

## Success Metrics

Quantitative:

- At least 80% of participating guests complete the quiz once they start.
- Median quiz completion time stays under 4 minutes.
- Leaderboard updates within a few seconds of completed quiz attempts under expected party load.
- No duplicate accepted question responses from the same quiz attempt and question.
- Zero guest-facing missing translation keys in production.

Qualitative:

- Guests understand the flow without instructions from the host.
- The visual style feels connected to the birthday setup.
- The quiz feels playful and personal once real content is provided.
- Messages feel easy and meaningful to leave.
- Admin can confidently run a pre-party QA pass.

## Functional Requirements

### Language Selection

- The experience must support English and Vietnamese.
- Guests should be able to select or switch language early in the flow.
- All guest-facing copy must be translated before production release.

### QR Code Entry

- The production URL must be suitable for QR code access.
- Entry should land guests in the correct guest flow.
- The first screen should load quickly on mobile.

### Guest Identification

- Guests should provide a lightweight display name or equivalent identifier before submitting scored quiz results.
- The identifier should be suitable for the leaderboard.
- The flow should avoid account creation.

### Quiz

- Quiz content must come from external content files or approved data records.
- Each question must support localized prompt and answer text.
- Questions must support one correct answer unless a future ADR adds other question types.
- The quiz must include a 20-second timer per question.
- Each question must follow this lifecycle:
  - Question loads.
  - Question becomes ready.
  - 20-second timer starts.
  - Guest selects an answer.
  - Answer is submitted.
  - Server accepts and locks the response.
  - Correct, incorrect, or timeout reveal appears.
  - Han fun fact appears when provided in approved content.
  - App proceeds to the next question.
  - Final score is derived from all locked responses.
- A submitted answer is immutable once accepted.
- A timed-out question is immutable once locked.
- Previous questions must not reopen for editing.
- Retried requests for the same question response must be idempotent and must not create duplicate responses.
- There is no end-of-quiz page where all answers remain editable before completing the quiz.
- Result scoring must be deterministic and reviewable from locked question responses.

### Result Screen

- Guests must see a result summary after completion.
- The result should feel celebratory regardless of score.
- The screen should offer next actions such as viewing leaderboard or leaving a message.

### Leaderboard

- A dedicated display route must show live ranked results.
- The display must be legible on a laptop or TV.
- It should update without manual refresh when new submissions arrive.
- It should handle empty and low-participation states gracefully.

### Messages

- Guests should be able to leave a birthday message.
- Message content must be persisted for admin review or later export.
- Empty, successful, and error states must be clear and warm.

### Timeline Placeholder

- Timeline support should exist as a placeholder or future-ready content model.
- No timeline event should be invented.
- Empty state copy must make it clear that memories will be added when provided.

### Gallery Placeholder

- Gallery support should exist as a placeholder or future-ready content model.
- No fake photos or fake captions should be generated.
- Missing assets should use approved placeholders.

### Lightweight Admin

- Admin should be a small utility area for essential event-day and testing operations.
- Admin should be able to view guest names and final quiz scores.
- Admin should be able to view submitted birthday messages.
- Admin should be able to view the current leaderboard.
- Admin should distinguish QA/test data from real event data.
- Admin should allow removal or reset of an incorrect test record or quiz attempt when necessary.
- Admin should open or link to the TV leaderboard.
- Admin may show a small readiness summary if it remains simple.
- Admin access must be separated from guest access.
- Admin MVP must not include content editing, translation editing, media upload, advanced analytics, complex moderation, role management, or a reusable CMS.

### QA Mode And Test Mode

- QA mode should allow testing guest flows without contaminating event data.
- Test data should be clearly identifiable and resettable.
- QA affordances must not appear in normal guest flow.

### Sound Effects

- Sound effects may enhance celebrations and interactions.
- Sound should respect browser autoplay limitations.
- Guests should not be surprised by loud or intrusive audio.

## Non-Functional Requirements

### Performance

- First mobile load should be lightweight.
- Animations should remain smooth on common phones.
- The leaderboard should remain responsive for the expected party size.

### Accessibility

- Touch targets must be comfortable on mobile.
- Text must have sufficient contrast.
- Quiz interactions must be understandable without sound.
- Motion should be restrained enough to avoid discomfort.

### Localization

- English and Vietnamese should have equivalent content coverage.
- UI layouts must tolerate Vietnamese text length.
- Missing translation keys should be caught before production.

### Reliability

- Submissions should avoid accidental duplicates.
- Network errors should be recoverable or clearly explained.
- Production data should be protected from QA/test data.
- Question response retries should preserve locked answers and timed-out responses.

### Privacy And Data Care

- Collect only data needed for the birthday experience.
- Do not expose admin data publicly.
- Avoid sensitive personal data unless explicitly required later.

## Acceptance Criteria

MVP acceptance:

- Guest can scan QR code, choose language, enter display name, complete the quiz, see result, view leaderboard, and leave a message.
- Quiz enforces 20-second question timing.
- A quiz attempt can have at most one accepted response per question.
- A submitted response is immutable.
- A timed-out question is immutable.
- Previous questions cannot be reopened for editing.
- Retried question-response requests are idempotent.
- Final scoring uses accepted locked responses.
- No editable end-of-quiz answer review exists.
- Leaderboard updates live for expected party load.
- Admin can verify quiz attempts, leaderboard state, messages, and QA/test separation through a lightweight utility page.
- QA mode can test flows without polluting production event data.
- English and Vietnamese guest flows are complete.
- No real content is present unless Ian provided it.

Foundation acceptance:

- Documentation clearly explains product, UX, UI, architecture, content, assets, QA, roadmap, and agent expectations.
- Placeholder content files contain schemas only.
- No implementation code has been generated.

## Risks

- Real content may arrive late, increasing translation and QA pressure.
- Mobile network conditions at the venue may be weaker than expected.
- Browser autoplay rules may limit sound effects.
- Leaderboard excitement could make the experience feel too competitive if not designed carefully.
- Admin/test data could pollute event data without clear separation.
- Placeholder timeline/gallery could feel empty if not visually handled with care.

## Future Enhancements

- Curated memory gallery after the party.
- Export birthday messages as a keepsake.
- Additional quiz rounds or family mini-games.
- Private post-event page for family.
- Richer timeline once real events and photos are provided.
- Optional media upload workflow if privacy and review requirements are defined after MVP.
