# Architecture Plan

This document describes the intended architecture. It is not an implementation plan to execute immediately.

## Target Stack

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Framer Motion.
- Supabase.
- next-intl.
- Vercel.

## Architecture Principles

- Separate content, runtime data, and presentation.
- Keep guest flows mobile-first and low-latency.
- Keep display routes optimized for large screens.
- Keep admin and QA routes isolated from guest routes.
- Treat localization and content validation as core architecture.
- Avoid hardcoded Han content in components.

## Planned Folder Structure

Future implementation may use a structure like:

```text
app/
  [locale]/
    (guest)/
      page.tsx
      quiz/
      result/
      leaderboard/
      message/
      timeline/
      gallery/
    admin/
    qa/
    design-system/
  display/
    leaderboard/
components/
  design/
  motion/
  ui/
  layout/
  guest/
  quiz/
  leaderboard/
  message/
  admin/
content/
  en.json
  vi.json
lib/
  content/
  i18n/
  supabase/
  quiz/
  validation/
styles/
  globals.css
```

The exact structure started in Milestone 1 and Milestone 2. Feature folders should still be introduced only as their milestones begin.

## Routing Plan

Guest routes:

- `/{locale}`: welcome and entry.
- `/{locale}/quiz`: quiz flow.
- `/{locale}/result`: result screen.
- `/{locale}/leaderboard`: mobile leaderboard.
- `/{locale}/message`: leave a birthday message.
- `/{locale}/timeline`: placeholder or future timeline.
- `/{locale}/gallery`: placeholder or future gallery.

Display routes:

- `/display/leaderboard`: TV/laptop leaderboard.

Internal review routes:

- `/{locale}/design-system`: development-facing visual foundation showcase. It demonstrates tokens, typography, controls, panels, placeholders, motifs, loading treatment, motion, and bilingual text expansion. It is not a production guest flow.

Admin routes:

- `/{locale}/admin`: lightweight admin utility for scores, messages, leaderboard link/status, QA/test separation, and simple resets.

QA routes:

- `/{locale}/qa`: QA mode entry.
- `/{locale}/qa/quiz`: test quiz flow.

Route protection and final URLs should be decided during implementation planning.

## Component Hierarchy

Base layer:

- Design tokens.
- shadcn/ui primitives.
- Layout primitives.
- Motion primitives.

Milestone 2 implemented base layer:

- Central tokens in `app/globals.css` and Tailwind mappings in `tailwind.config.ts`.
- Typography loaded in `app/layout.tsx` through `next/font/google`.
- Design primitives in `components/design/`.
- Motion primitives in `components/motion/`.
- Internal design-system route at `/{locale}/design-system` for visual review.
- Guest, display, admin, and QA route boundaries remain placeholders and do not perform runtime data actions.

Milestone 3 implemented guest onboarding components in `components/guest/`:

- `OnboardingFlow` owns the welcome-to-ready client flow.
- `OnboardingHero`, `LanguageSelector`, `GuestNameCard`, `InstructionCard`, `ProgressIndicator`, and `CelebrationBanner` compose the onboarding screens.
- The localized guest root `/{locale}` now renders onboarding instead of the scaffold placeholder.
- Display, admin, QA, and design-system routes remain separate from guest onboarding.

Domain components:

- Language selector.
- Guest name form.
- Quiz shell.
- Timer.
- Question card.
- Answer option.
- Result summary.
- Leaderboard table/list.
- Message form.
- Empty state.
- Asset placeholder.

Feature compositions:

- Welcome screen.
- Quiz flow controller.
- Result page.
- Mobile leaderboard page.
- TV leaderboard page.
- Lightweight admin utility.
- QA utility.

## State Management

Use the simplest state model that supports reliability.

Client state:

- Current question index.
- Selected answer for the active question before submission.
- Timer state.
- Local UI state such as loading, submitting, and errors.

Milestone 3 client/session state:

- Selected language.
- Guest display name.
- Current onboarding step.

This state is stored in browser `sessionStorage` only. It does not create participant IDs, Supabase records, quiz attempts, question responses, leaderboard entries, messages, admin records, or QA/test data.

Server/runtime state:

- Participant identity.
- Quiz attempt.
- Immutable question responses.
- Score.
- Message submissions.
- QA/test flag.

Persistence should happen at clear boundaries so refreshes and duplicate taps do not corrupt data.

## Content Loading

- Locale JSON files provide structured copy and quiz content.
- next-intl handles locale routing and translated UI strings.
- Content schema validation should run during development/build once implementation begins.
- Missing translation keys should block production release.

## Supabase Schema Plan

Tables should be finalized before migration implementation.

### `participants`

Purpose: Store guest identity for event interactions.

Fields:

- `id`.
- `display_name`.
- `locale`.
- `device_fingerprint` or equivalent non-sensitive duplicate-prevention token if approved.
- `is_test`.
- `created_at`.

### `quiz_attempts`

Purpose: Store one guest's quiz session.

Fields:

- `id`.
- `participant_id`.
- `status`.
- `score`.
- `total_questions`.
- `started_at`.
- `completed_at`.
- `is_test`.

Constraints:

- Enforce one active or completed attempt per participant/event scope if the approved guest identity model needs it.

### `question_responses`

Purpose: Store one immutable response for one question within one quiz attempt.

Fields:

- `id`.
- `attempt_id`.
- `question_id`.
- `selected_answer_id` or null for timeout.
- `status`, such as `accepted` or `timed_out`.
- `is_correct`.
- `timed_out`.
- `submitted_at`.
- `locked_at`.
- `response_duration_ms`.
- `idempotency_key` or equivalent retry token.

Constraints:

- Enforce one accepted question response per quiz attempt per question.
- Once accepted or timed out, a question response must not be reopened or edited.
- Retried requests with the same idempotency key or equivalent retry token should return the existing locked response instead of creating a duplicate.
- Final score should be calculated from accepted locked question responses.

### `messages`

Purpose: Store birthday messages.

Fields:

- `id`.
- `participant_id`.
- `display_name`.
- `locale`.
- `message`.
- `status`.
- `is_test`.
- `created_at`.

### `event_settings`

Purpose: Store runtime switches if needed.

Fields:

- `id`.
- `key`.
- `value`.
- `updated_at`.

## Leaderboard Strategy

- Source leaderboard from completed quiz attempts whose question responses are locked.
- Rank by score first.
- Use completion time or time remaining only if approved as a tie-breaker.
- Filter out QA/test data in production display.
- Use Supabase real-time subscriptions or a lightweight polling fallback.

## API Structure

Potential server actions or route handlers:

- Create or resume participant.
- Start quiz attempt.
- Submit question response.
- Lock timed-out question response.
- Complete quiz attempt.
- Fetch result.
- Fetch leaderboard.
- Submit message.
- Admin fetch final quiz scores.
- Admin fetch messages.
- Admin remove/reset incorrect test record or quiz attempt when necessary.
- QA reset test data.

All mutation paths should validate input, preserve immutable locked responses, and prevent duplicate question responses.

## Admin And QA Separation

- Admin routes should not be discoverable through guest navigation.
- Admin access control must be defined before production.
- QA mode should tag all generated data with `is_test`.
- Production leaderboard and message views should exclude test data by default.

## Deployment Plan

- Vercel hosts the Next.js application.
- Supabase hosts database and real-time services.
- Environment variables should be documented when implementation begins.
- Preview deployments should use separate or clearly tagged test data.

## Future Scalability

The expected party load is small, around 10 guests, but the architecture should still be clean enough to support:

- More guests.
- More quiz rounds.
- Post-event memory archive.
- Expanded gallery and timeline.
- Additional locales if needed.

Do not overbuild for hypothetical scale before the event-day experience is reliable.
