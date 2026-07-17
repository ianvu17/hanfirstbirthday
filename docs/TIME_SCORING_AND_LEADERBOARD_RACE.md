# Time Scoring, Configurable Sessions, And Leaderboard Race

## Previous Architecture

Before this milestone, the server response route created `receivedAt` with `Date.now()` inside `submitRemoteResponse`. The Party Engine compared that value with persisted `question_deadline_at`, calculated correctness from the approved static question config, and inserted an immutable `question_responses` row. The row stored `submitted_at`, `locked_at`, `response_duration_ms`, and `is_correct`.

Scores were not stored. `selectLeaderboardRows()` recalculated totals as one for every persisted correct response and zero otherwise. The same selector fed the Party Screen, guest projection, and certificate winner lookup. Ties used participant creation order and then display name. Session config always loaded all enabled approved questions, so progress, final-question detection, and certificate totals implicitly used 10.

The Party Screen leaderboard was a stable list. No previous-score or current-round gain projection existed.

## Authoritative Scoring Contract

Constants:

```text
BASE_CORRECT_POINTS = 1,000
MAX_TIME_BONUS_POINTS = 1,000
SCORING_VERSION = time-v1
```

For a correct response:

```text
elapsedMs = clamp(serverReceivedAt - persistedQuestionOpenedAt, 0, questionDurationMs)
remainingRatio = 1 - elapsedMs / questionDurationMs
timeBonus = round(1,000 × remainingRatio)
pointsAwarded = 1,000 + timeBonus
```

Incorrect and timeout responses receive zero. A defensive zero or malformed duration gives a correct response base points only. Negative elapsed time clamps to zero. The existing deadline rule remains strict: `receivedAt >= deadlineAt` is rejected.

Worked 20-second examples:

| Response time | Points |
| ------------- | -----: |
| 0 ms          |  2,000 |
| 5,000 ms      |  1,750 |
| 10,000 ms     |  1,500 |
| 15,000 ms     |  1,250 |
| 19,999 ms     |  1,000 |

The remote deadline includes the existing five-second delivery allowance. Scoring still clamps to the configured 20-second duration, so accepted responses during that allowance receive the 1,000-point minimum rather than falling below the contract.

## Response Persistence

`question_responses` retains `response_duration_ms` as authoritative clamped response-time evidence and adds:

- `points_awarded integer not null default 0`
- `scoring_version text not null default 'time-v1'`

New answer and timeout inserts always supply both fields. Historical rows are backfilled to their original value, 1 for correct and 0 otherwise, and marked `correct-count-v1`. Projections sum `points_awarded`; they never apply the current algorithm to old rows.

Exact retries return the locked response and its persisted points. Conflicting retries remain rejected. Winner authorization and the certificate use the same persisted response rows, so a finished winner does not change because of a future scoring algorithm.

## Deterministic Ranking

Ordering is:

1. Total persisted points descending.
2. Participant creation order ascending.
3. Display name ascending.
4. Participant id ascending.

Remote participant creation order is built from `joined_at` and then participant id, so equal database timestamps remain deterministic.

## Session Question Count

`party_sessions.question_count` is an immutable integer from 1 through the currently approved total. Existing sessions receive 10. New sessions default to `min(10, enabledQuestionCount)` and the host sees recommended 3, 5, 7, and 10 choices when available.

Creation validates the value in three places:

- Host/API input schema requires an integer of at least one.
- Repository validation requires no more than the enabled approved total.
- The database function and constraint accept only 1 through 10 for the current approved set.

The runtime builds session config with `approvedQuestions.slice(0, question_count)`. It does not shuffle or mutate question definitions. Progress, final-question detection, reconnect, host actions, guest projections, Party Screen projections, winner state, and certificate denominator all use that sliced config.

Only the count is persisted. This is sufficient under ADR-020, which makes question and option ids immutable for an active rehearsed session and requires content deployments to use a new session. A CMS or question snapshot is intentionally not added.

## Leaderboard Race Projection

Every projected row includes:

```ts
{
  (guestId,
    displayName,
    avatar,
    previousScore,
    pointsGained,
    score,
    previousRank,
    rank,
    answeredCount,
    correctCount);
}
```

`previousScore` excludes responses for the current question. `pointsGained` sums persisted awarded points for the current question. Previous and final ranks use the same deterministic tie fallback. The first leaderboard begins at zero.

## Animation Lifecycle

The Party Screen uses `intro → grow → reorder → settled`:

- Intro holds previous rank and score for 400 ms.
- Grow animates bars and integer score values for 1,250 ms.
- Reorder moves stable participant-id rows for 800 ms.
- Settled is stable after 2,600 ms.

The browser key is `sessionId + questionId`. Completed keys are stored only in browser session storage, capped to recent entries. Realtime refresh, avatar URL refresh, and unrelated rerenders do not replay a completed race. Reconnect may play an unseen race in that browser. No frame or stage is written to Supabase.

Bars use transforms and Framer Motion values rather than React state on every frame. The scale is the next 1/2/4/5/10 nice ceiling with a 2,000-point minimum. All rows share the final scale so they rescale together. Zero-score participants retain a full readable row and empty track without a misleading bar.

The Party Screen renders all 10 participants with adaptive row height and no internal scrolling. Phones keep a simplified personal score and current-round gain rather than duplicating the full race. The host shows a compact stable surface and delays its advance action until the essential race completes.

With `prefers-reduced-motion`, the component renders final scores and final order immediately. All names, avatars, ranks, gains, and totals remain present.
