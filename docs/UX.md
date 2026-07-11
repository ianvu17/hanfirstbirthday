# UX Specification

## UX Goal

The experience should feel instantly understandable, warm, and festive. Guests should be able to complete the core flow while standing at a party, using one hand, with minimal instruction.

## Primary Guest Flow

1. Scan QR code.
2. Land on welcome/language screen.
3. Choose English or Vietnamese.
4. Enter display name.
5. Start quiz.
6. Answer timed questions.
7. Lock each question response as it is accepted or timed out.
8. View result.
9. View leaderboard.
10. Leave a birthday message.
11. Optionally browse placeholder timeline/gallery areas if enabled.

## Screen Specifications

### QR Entry / Welcome

Purpose: Welcome guests into the birthday experience and orient them quickly.

Content:

- Public title.
- Short localized welcome copy from content files.
- Language selection.
- Primary action to continue.

UX notes:

- Should feel like entering the party, not launching software.
- Avoid dense instructions.
- Provide immediate visual connection to the birthday theme.

States:

- Loading: soft celebratory loading state, no spinner-only experience.
- Error: explain that the experience could not load and offer retry.

### Language Selection

Purpose: Let guests choose English or Vietnamese.

UX notes:

- Language options should be obvious and tappable.
- Language can be changed later through a small accessible control.
- Do not bury language behind settings.

States:

- Selected language visibly confirms choice.
- If translations are missing, QA should block release rather than showing raw keys.

### Guest Name Entry

Purpose: Collect a display name for leaderboard and submission identity.

UX notes:

- Keep the form short.
- Explain why the name is needed in a friendly way.
- Use validation that feels helpful, not punitive.

States:

- Empty: primary action disabled or prompts for name.
- Invalid: explain display name requirements.
- Duplicate or already completed: route to the existing result or explain that locked question responses cannot be changed.

### Quiz Start

Purpose: Prepare guests for a short timed quiz.

UX notes:

- Make the quiz feel playful and celebratory.
- Mention timing clearly before the first question.
- Avoid creating anxiety around score.

States:

- Ready state before question timer starts.
- Loading questions state if content or session setup is pending.

### Quiz Question

Purpose: Present one question at a time with answer options and a 20-second timer.

UX notes:

- One primary decision per screen.
- Timer must be visible but not stressful.
- Answers should be large touch targets.
- Use motion to transition between questions without slowing the flow.
- The timer must not begin before the question and required fallback assets are ready.
- Once a question response is accepted, stop the timer, disable all answer options, prevent backward editing, and show the reveal state.
- If the timer expires before a valid answer is accepted, lock the question as timed out and show the timeout reveal.
- Network retry behavior must never unlock an already accepted response or create duplicate question responses.

Micro interactions:

- Gentle entrance for each question.
- Clear selected-answer state.
- Subtle feedback when an answer is accepted and locked.
- Timer transition should become more noticeable near the end without feeling alarming.

States:

- Loading.
- Ready.
- Unanswered.
- Answer selected.
- Submitting.
- Accepted and locked.
- Correct reveal.
- Incorrect reveal.
- Timeout and locked.
- Temporary request failure.
- Safe retry.
- Transition to next question.

Open UX decision:

- Whether tapping an answer immediately submits it or whether a separate confirmation action is required. Existing documentation does not resolve this, so implementation must decide explicitly before building the quiz interaction.

### Quiz Completion

UX notes:

- Completion happens after all question responses are locked.
- There is no editable final review of all quiz answers.
- The final score is calculated from locked question responses.

States:

- Calculating result.
- Completed quiz attempt.
- Result unavailable with recovery guidance.

### Result Screen

Purpose: Celebrate completion and guide guests to next actions.

UX notes:

- Results should be warm regardless of score.
- Avoid language that makes low scores embarrassing.
- Offer actions to view leaderboard and leave a message.

States:

- Score available.
- Score pending due to network delay.
- Score unavailable with recovery guidance.

### Leaderboard Display

Purpose: Show live party results on a shared screen.

UX notes:

- Must be legible from across a room.
- Use restrained celebratory motion for new entries or rank changes.
- Keep layout stable to avoid visual chaos.
- Avoid overemphasizing losing positions.

States:

- Empty leaderboard before submissions.
- Few participants.
- Active updates.
- Connection interrupted.

### Mobile Leaderboard View

Purpose: Let guests view rankings from phones.

UX notes:

- Present fewer columns than TV view.
- Highlight the current guest if known.
- Provide a clear path back to message leaving.

### Leave A Message

Purpose: Collect birthday messages for Han and family.

UX notes:

- Should feel like signing a keepsake, not filling a ticket.
- Keep input comfortable and forgiving.
- Confirm submission warmly.

States:

- Empty input.
- Draft input.
- Submitting.
- Submitted.
- Failed with retry.

### Timeline Placeholder

Purpose: Reserve space for future memory timeline content.

UX notes:

- Do not imply real milestones until content is provided.
- Placeholder should feel intentional and gentle.
- If hidden for MVP, content model should still be documented.

States:

- Empty placeholder.
- Future populated state after real timeline entries are provided.

### Gallery Placeholder

Purpose: Reserve space for future photo memories.

UX notes:

- Do not generate fake photos.
- Placeholder art or neutral image frames may be used.
- Captions must come from content data.

States:

- Empty placeholder.
- Asset missing fallback.
- Future populated state after real assets are provided.

### Lightweight Admin

Purpose: Let Ian/admin handle essential event-day and testing checks without becoming a full dashboard product.

UX notes:

- Admin UI can be more utilitarian but should still be clear.
- Separate real event data from QA/test data.
- Do not expose admin controls to guests.
- Keep navigation and controls minimal so admin work does not block the guest MVP.

Approved capabilities:

- View guest names and final quiz scores.
- View submitted birthday messages.
- View current leaderboard.
- Distinguish QA/test data from real event data.
- Remove or reset an incorrect test record or quiz attempt when necessary.
- Open or link to the TV leaderboard.
- Optionally show a small readiness summary if it remains simple.

Out of MVP scope:

- Content editing.
- Translation management.
- Visual question editing.
- Media upload.
- Advanced analytics.
- Complex moderation workflow.
- User or role management.

### QA Mode

Purpose: Test the event safely before production use.

UX notes:

- QA mode should be visually identifiable to admins/testers.
- It should never confuse real guests.
- Test data should be resettable or clearly separated.

## Loading States

Loading states should use soft party-themed motion, layered shapes, or brief skeletons. Avoid generic technical spinners as the only signal. Loading copy must be localized.

## Error States

Errors should be direct, calm, and recoverable. They should explain what happened and what the guest can do next. Avoid technical language such as database, API, token, or request failure in guest-facing copy.

## Empty States

Empty states are important because timeline, gallery, and leaderboard may start with no content. Empty states should:

- Be honest.
- Avoid fake memories.
- Set expectation for what will appear later.
- Preserve the warm birthday tone.

## Animation Intentions

- Use entrance animations to make screens feel welcoming.
- Use subtle stagger for answer choices and leaderboard rows.
- Use small celebratory motion on quiz completion and message submission.
- Use rank-change motion carefully so the leaderboard remains readable.
- Respect reduced-motion preferences.

## Sound Intentions

- Use sound only after user interaction and only where it adds delight.
- Keep sounds short, soft, and party-appropriate.
- Provide mute control or respect system/browser constraints.
- Never make sound necessary to understand state.
