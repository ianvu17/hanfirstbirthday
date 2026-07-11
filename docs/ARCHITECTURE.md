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
  display/
    leaderboard/
components/
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

The exact structure should be confirmed during Milestone 1.

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

Admin routes:

- `/{locale}/admin`: admin dashboard.
- `/{locale}/admin/messages`: message review.
- `/{locale}/admin/submissions`: submission monitoring.

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
- Admin dashboard.
- QA dashboard.

## State Management

Use the simplest state model that supports reliability.

Client state:

- Current question index.
- Selected answers before submission.
- Timer state.
- Local UI state such as loading, submitting, and errors.

Server/runtime state:

- Participant identity.
- Quiz attempt.
- Submitted answers.
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

Purpose: Store one scored attempt per participant/event scope.

Fields:

- `id`.
- `participant_id`.
- `status`.
- `score`.
- `total_questions`.
- `started_at`.
- `submitted_at`.
- `is_test`.

Constraints:

- Enforce one submitted attempt per participant/event scope.

### `quiz_answers`

Purpose: Store answers for auditing and scoring review.

Fields:

- `id`.
- `attempt_id`.
- `question_id`.
- `answer_id`.
- `is_correct`.
- `answered_at`.
- `time_remaining_ms` if used for tie-breaking.

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

- Source leaderboard from submitted quiz attempts.
- Rank by score first.
- Use completion time or time remaining only if approved as a tie-breaker.
- Filter out QA/test data in production display.
- Use Supabase real-time subscriptions or a lightweight polling fallback.

## API Structure

Potential server actions or route handlers:

- Create or resume participant.
- Start quiz attempt.
- Submit quiz attempt.
- Fetch result.
- Fetch leaderboard.
- Submit message.
- Admin fetch submissions.
- Admin fetch messages.
- QA reset test data.

All mutation paths should validate input and prevent duplicate submissions.

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
