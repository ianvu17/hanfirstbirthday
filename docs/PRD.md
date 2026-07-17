# Product Requirements Document

## Product Name

Han Birthday Experience

## Public Title

WHO IS TURNING ONE?!

## Vision

Create a premium interactive birthday experience that feels like part of Han's first birthday party. Guests should scan a QR code, use their phones as personal controllers for a short playful quiz, watch the laptop or TV as the shared Party Screen for the room, and leave a message that can become part of the family's memory archive.

The product should make guests smile and help them feel connected to Han's celebration. It should not feel like a generic quiz platform.

## Goals

- Provide a fast, mobile-first guest experience.
- Support English and Vietnamese from the beginning.
- Make the quiz short, playful, and reliable during the party.
- Preserve memories through messages and future gallery/timeline content.
- Turn the laptop or TV into the main shared Party Screen for lobby, questions, answer reveals, Han fun facts, leaderboard, and finished moments.
- Keep phones focused on each guest's personal flow rather than duplicating the shared presentation.
- Support a host-driven game pace controlled by Ian.
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

### Host

Ian or another trusted person pacing the birthday game for the room. The host decides when to start the game, reveal answer choices, reveal the correct answer, show the leaderboard, and move to the next question. Host controls should be lightweight and event-focused, not a SaaS admin dashboard.

### Host/Admin

Ian or another trusted person preparing the experience. They need confidence that content is correct, submissions work, the Party Screen displays properly, and test data can be separated from real event data.

### Party Screen Viewer

Someone watching the shared display during the party. They may not interact directly but should understand the room's progress, enjoy the question and reveal moments, learn Han fun facts, and feel the energy of the experience.

### Future Family Viewer

Someone revisiting messages, gallery, or timeline content after the event. Future memory features should preserve warmth and accuracy.

## Success Metrics

Quantitative:

- At least 80% of participating guests complete the quiz once they start.
- Median quiz completion time stays under 4 minutes.
- Party Screen state updates within a few seconds under expected party load once realtime or fallback networking is implemented.
- No duplicate accepted question responses from the same quiz attempt and question.
- Zero guest-facing missing translation keys in production.

Qualitative:

- Guests understand the phone flow quickly while the host can guide the shared room experience from the Party Screen.
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
  - Question preview appears without answer choices.
  - Host reveals answer choices.
  - 20-second timer starts as choices are revealed.
  - Guest selects an answer.
  - Answer is submitted.
  - Server accepts and locks the response.
  - Answering closes automatically at the deadline.
  - Correct, incorrect, or timeout reveal appears.
  - Han fun fact appears when provided in approved content.
  - App proceeds to the next question.
  - Final score is derived from all locked responses.
- Correct answers earn 1,000 base points plus a server-authoritative response-time bonus up to 1,000 points. Incorrect and timed-out responses earn zero. Awarded integer points are persisted per response and summed for leaderboard and winner state.
- Host-created sessions default to 10 questions and may select a shorter valid count. A session uses the first selected number of enabled approved questions in existing order, and its count cannot change after creation.
- A submitted answer is immutable once accepted.
- A timed-out question is immutable once locked.
- Previous questions must not reopen for editing.
- Retried requests for the same question response must be idempotent and must not create duplicate responses.
- There is no end-of-quiz page where all answers remain editable before completing the quiz.
- Result scoring must be deterministic and reviewable from locked question responses.

### Shared Game Lifecycle

The shared game should be planned around explicit phases before quiz implementation:

- `LOBBY`: Party Screen shows hero artwork, QR code, join instructions, guest count, and future countdown-until-start support. Phones handle personal join, language, and display name.
- `QUESTION_PREVIEW`: Party Screen and phones show the question text while answer choices remain hidden and the timer has not started.
- `QUESTION_ACTIVE`: Party Screen shows the large question, automatic 20-second countdown, progress, and number of answers submitted. Phones show answer controls only for the current guest.
- `QUESTION_LOCKED`: Party Screen communicates that answering is closed and waits for the host-driven reveal. Phones show the guest's locked or timed-out state.
- `ANSWER_REVEAL`: Party Screen reveals the correct answer and celebration. Phones show only personal feedback needed by the guest.
- `LEADERBOARD`: Party Screen shows a horizontal bar chart race from previous scores to updated persisted points, then reorders rows. Phones show simplified personal score and current-round gain.
- `NEXT_QUESTION`: Party Screen prepares the room for the next question under host control. Phones prepare the next personal answer state.
- `FINISHED`: Party Screen shows final leaderboard, celebration, and thank-you. Phones show personal result and next actions.

These lifecycle terms are planning requirements only in Milestone 3.6. They do not implement quiz state, realtime, Supabase, networking, or host controls.

### Result Screen

- Guests must see a result summary after completion.
- The result should feel celebratory regardless of score.
- The screen should offer next actions such as viewing leaderboard or leaving a message.

### Shared Party Screen

- A dedicated display route must become the shared Party Screen, not only a leaderboard.
- The Party Screen must be legible on a laptop or TV from across the room.
- Before the game, it should support hero artwork, QR code, join instructions, guest count, and future countdown-until-start behavior.
- During questions, it should support large question text, automatic countdown, progress, and number of answers submitted.
- During reveal, it should support correct answer, Han fun fact, and celebration.
- During leaderboard phases, it should support animated ranking and current positions.
- At finish, it should support final leaderboard, celebration, and thank-you.
- Once realtime or fallback networking is implemented, it should update without manual refresh when shared game state changes.
- It should handle empty, waiting, and low-participation states gracefully.

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
- Admin should be able to view current Party Screen or leaderboard state.
- Admin should distinguish QA/test data from real event data.
- Admin should allow removal or reset of an incorrect test record or quiz attempt when necessary.
- Admin should open or link to the Party Screen.
- Admin may show a small readiness summary if it remains simple.
- Admin access must be separated from guest access.
- Admin MVP must not include content editing, translation editing, media upload, advanced analytics, complex moderation, role management, or a reusable CMS.

### Lightweight Host Controls

- Milestone 5 implements production host controls at `/{locale}/host`.
- The host is Ian, so controls stay minimal and direct.
- Host controls include the next valid phase action such as start game, reveal answers, reveal correct answer, show leaderboard, continue, next question, or finish.
- Host access uses a PIN verified on the server and a signed HttpOnly host session cookie.
- Host controls must not turn into a complex admin dashboard.

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
- The Party Screen should remain responsive for the expected party size.

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
- Milestone 5 makes host commands and response submissions server-authoritative through route handlers and Supabase constraints.
- Browser realtime is a sync signal; authoritative state comes from server snapshots with monotonic revisions.

### Privacy And Data Care

- Collect only data needed for the birthday experience.
- Do not expose admin data publicly.
- Avoid sensitive personal data unless explicitly required later.

## Acceptance Criteria

MVP acceptance:

- Guest can scan QR code, choose language, enter display name, complete the quiz, see result, view leaderboard, and leave a message.
- Party Screen can guide the room through lobby, question, reveal, leaderboard, and finished phases once the shared game runtime is implemented.
- Quiz enforces 20-second question timing.
- A quiz attempt can have at most one accepted response per question.
- A submitted response is immutable.
- A timed-out question is immutable.
- Previous questions cannot be reopened for editing.
- Retried question-response requests are idempotent.
- Final scoring uses accepted locked responses.
- No editable end-of-quiz answer review exists.
- Party Screen updates live for expected party load once realtime or fallback networking is implemented.
- Admin can verify quiz attempts, Party Screen or leaderboard state, messages, and QA/test separation through a lightweight utility page.
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
- Party Screen excitement could make the experience feel too competitive or distracting if reveals and rankings are not paced carefully.
- Admin/test data could pollute event data without clear separation.
- Placeholder timeline/gallery could feel empty if not visually handled with care.

## Future Enhancements

- Curated memory gallery after the party.
- Export birthday messages as a keepsake.
- Additional quiz rounds or family mini-games.
- Private post-event page for family.
- Richer timeline once real events and photos are provided.
- Optional media upload workflow if privacy and review requirements are defined after MVP.
