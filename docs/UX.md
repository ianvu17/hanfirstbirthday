# UX Specification

## UX Goal

The experience should feel instantly understandable, warm, and festive. Guests should be able to complete the core flow while standing at a party, using one hand, with minimal instruction.

## Surface Model

The birthday game has two simultaneous experiences:

- Phone: the personal controller for one guest. It handles QR entry, language choice, display name, answer selection, answer submission, personal progress, personal result, and next actions.
- Desktop/laptop/TV: the shared Party Screen for the room. It is the birthday-game stage and should remain entertaining for guests who never touch a phone.

The phone should not duplicate the desktop presentation. It should show only information useful to the current guest at that moment.

## Host Model

The birthday game is host-driven, not autonomous. Ian controls phase transitions such as Start Game, Open Question, Reveal Answer, Show Fun Fact, Show Leaderboard, and Next Question. Once a question is opened, the 20-second countdown is automatic.

Future host controls should be intentionally lightweight. Expected controls include Start Game, Next, Reveal, and Pause, but Milestone 3.6 does not implement host controls.

Milestone 5 implements the production Host Controller at `/{locale}/host`. It starts with a PIN screen, then shows party status, phase, question progress, participant count, submitted count, connection state, and one dominant valid next action. Finish Party requires confirmation. Developer diagnostics and fixture actions remain in `/{locale}/qa/party`.

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

## Shared Party Screen Flow

The shared Party Screen should eventually support:

1. Lobby with hero artwork, QR code, join instructions, guest count, and future countdown-until-start support.
2. Large active question with automatic countdown, progress, and number of answers submitted.
3. Locked-question state after the timer ends or the host closes answering.
4. Correct-answer reveal.
5. Han fun fact reveal when approved content exists.
6. Leaderboard with animated ranking and current positions.
7. Next-question preparation.
8. Finished state with final leaderboard, celebration, and thank-you.

Milestone 5 implements this flow for the quiz runtime, Supabase-backed shared state, realtime wake-up, server snapshots, and host controls. Messages, timeline, gallery, and standalone mobile leaderboard remain future work.

## Game Phases

Use these shared lifecycle terms for future planning:

- `LOBBY`: Guests join by phone while the Party Screen provides QR and room context.
- `QUESTION_ACTIVE`: Phones collect answers; the Party Screen shows the question, countdown, progress, and submitted-answer count.
- `QUESTION_LOCKED`: Phones show locked or timed-out personal state; the Party Screen holds the room before reveal.
- `ANSWER_REVEAL`: The Party Screen reveals the correct answer and celebration; phones show concise personal feedback.
- `LEADERBOARD`: The Party Screen shows current rankings; phones may show a smaller personal leaderboard view.
- `NEXT_QUESTION`: The host advances the room to the next question.
- `FINISHED`: The Party Screen closes with final leaderboard, celebration, and thank-you; phones show personal result and next actions.

Milestone 3 implemented the guest entry portion only:

1. Welcome.
2. Language selection.
3. Guest display name.
4. How to play.
5. Ready.
6. Quiz-coming-soon placeholder.

Milestone 4 replaced the quiz-coming-soon boundary with the local Party Engine and Milestone 5 added the Supabase-backed remote runtime. Messages, gallery, timeline, standalone mobile leaderboard, and full admin message/score utilities remain deferred.

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
- Milestone 3 shows only delight and entry context here; quiz details are intentionally delayed until the instructions screen.

States:

- Loading: soft celebratory loading state, no spinner-only experience.
- Error: explain that the experience could not load and offer retry.

### Language Selection

Purpose: Let guests choose English or Vietnamese.

UX notes:

- Language options should be obvious and tappable.
- Language can be changed later through a small accessible control.
- Do not bury language behind settings.
- Milestone 3 uses two large options and stores the selected locale in session-only state.

States:

- Selected language visibly confirms choice.
- If translations are missing, QA should block release rather than showing raw keys.

### Guest Name Entry

Purpose: Collect a display name for leaderboard and submission identity.

UX notes:

- Keep the form short.
- Explain why the name is needed in a friendly way.
- Use validation that feels helpful, not punitive.
- Milestone 3 trims whitespace, rejects blank names, supports long Vietnamese names, and stores the display name only in session storage.

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
- Milestone 3 splits this preparation into a short illustrated "How to play" screen and a celebratory "Ready" screen. The Start Quiz button stops at a placeholder until Milestone 4.

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

Milestone 4 decision:

- Answering uses select-then-confirm. Tapping an option selects it; pressing Submit Answer sends the authoritative runtime command and locks the response if accepted.

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

### Shared Party Screen

Purpose: Host the shared birthday-game stage on a laptop or TV.

UX notes:

- Must be legible from across a room.
- Must be enjoyable even for guests who are only watching.
- Use restrained celebratory motion for phase changes, answer reveals, fun facts, new leaderboard entries, or rank changes.
- Keep layout stable to avoid visual chaos.
- Avoid overemphasizing losing positions.
- Do not show dense admin controls or private guest data.

States:

- Lobby before the game starts.
- Empty or low-participation join state.
- Question active with countdown.
- Question locked.
- Answer reveal.
- Fun fact reveal.
- Leaderboard.
- Finished.
- Connection interrupted.

Milestone 4 implementation:

- `/display/party` renders the local shared Party Screen for lobby, question ready, active question, locked question, answer reveal, leaderboard, waiting, and finished states.
- `/display/leaderboard` redirects to `/display/party` so there is no competing primary display route.
- `/{locale}/qa/party` provides a local simulation harness with host controls, Party Screen preview, and a guest-controller preview.
- This is not cross-device synchronization. It is a deterministic local runtime for architecture, QA, and visual validation.

Milestone 5 implementation:

- `/display/party` uses the Supabase-backed remote runtime when configured.
- Lobby QR is generated from the active party join URL.
- Participant count, response count, reveal, and leaderboard projections come from server snapshots.
- If Supabase env is absent, the route falls back to the local Milestone 4 runtime for development rather than running divergent device state.

### Mobile Leaderboard View

Purpose: Let guests view rankings from phones.

UX notes:

- Present fewer columns than TV view.
- Highlight the current guest if known.
- Provide a clear path back to message leaving.
- Do not duplicate the full Party Screen choreography on phones.

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
- View current Party Screen or leaderboard state.
- Distinguish QA/test data from real event data.
- Remove or reset an incorrect test record or quiz attempt when necessary.
- Open or link to the Party Screen.
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

Milestone 5 keeps `/{locale}/qa/party` as the local Developer Playground. Remote test data is marked with `is_test` through the party session configuration; production host controls do not expose QA reset or fixture actions.

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
