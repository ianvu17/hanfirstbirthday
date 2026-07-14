# Content Models

## Content Rule

Never invent Han content. Real quiz questions, memories, timeline entries, image captions, and stories must come from Ian or another approved source. Until then, use schema placeholders only.

The initial locale files are:

- [../content/en.json](../content/en.json)
- [../content/vi.json](../content/vi.json)
- [../content/party-fixtures.json](../content/party-fixtures.json) for Milestone 4 development-only Party Engine fixtures.
- [../content/party-ui.json](../content/party-ui.json) for Milestone 4 localized development UI labels.

Milestone 1 also includes [../content/scaffold.json](../content/scaffold.json) for temporary diagnostic route-placeholder copy. It must not contain Han facts, memories, quiz answers, timeline entries, captions, or photo descriptions.

The Milestone 4 fixture files are not approved production Han content. They are visibly marked development-only, use placeholder questions and placeholder fun facts, and now exist only for the explicit QA party harness and fixture-specific automated tests.

## Localization Model

Each locale file should share the same structure so missing translations can be detected.

Top-level fields:

- `schemaVersion`: content schema version string.
- `locale`: locale code.
- `metadata`: project and content status metadata.
- `navigation`: labels for guest navigation.
- `screens`: screen-level copy.
- `quiz`: quiz settings and questions.
- `timeline`: timeline configuration and entries.
- `gallery`: gallery configuration and items.
- `messages`: message form copy and constraints.
- `assets`: references to required visual and audio assets.
- `admin`: admin-facing labels and validation copy.

## Static Question Content

Quiz questions must be structured, localizable, and externally managed.

Normal local application runtime, Vercel Preview, and Production load approved static questions from `content/en.json` and `content/vi.json` through `getApprovedPartyConfig()`. Supabase does not store question definitions.

Canonical authoring question fields:

- `id`: stable unique identifier.
- `enabled`: whether the question participates in the active quiz.
- `sortOrder`: display order.
- `prompt`: localized question text.
- `answers`: localized answer options.
- `correctAnswerId`: stable answer id.
- `funFact`: localized Han fun fact shown on the Party Screen after answer reveal. It is required by the current runtime and must be provided by Ian or another approved source before event release.
- `assetId`: optional linked asset id.

Canonical quiz settings:

- `questionDurationSeconds`: global question duration. The current runtime maps this to `PartyConfig.questionDurationMs`. Per-question durations are not supported.
- `responseLocking`: must be `per-question-immutable`.
- `questionOrder`: must be `content-order`.
- `scoringMode`: must be `correct-count`.

Answer fields:

- `id`: stable unique identifier.
- `label`: localized answer text.
- `assetId`: optional linked image or icon asset.

Validation rules:

- Enabled question sets must match between English and Vietnamese.
- Enabled questions must have matching ids, enabled states, sort orders, answer ids, and correct answer ids across locales.
- Every enabled question must have at least two answers.
- Every enabled question must have exactly one correct answer through `correctAnswerId`.
- Every correct answer id must match an answer id.
- Enabled `sortOrder` values must be unique.
- No prompt, answer, or fun fact may be fabricated.

The authoring schema and runtime schema intentionally differ:

```text
Authoring: answers           -> Runtime: options
Authoring: correctAnswerId   -> Runtime: correctOptionId
Authoring: questionDurationSeconds -> Runtime: questionDurationMs
```

The implementation is text-based single-choice only. `assetId` may be preserved for later work, but this implementation does not render production photo, audio, or video question media.

Content immutability safeguards:

- Question ids are stable and must not change after rehearsal approval.
- Option ids are stable and must not change after rehearsal approval.
- Correct-answer ids must not change during an active session.
- A new content deployment should be tested with a new session.
- Existing session response rows must never be reinterpreted using different option ids.

## Runtime Guest Response

Question responses are runtime data and must be stored in Supabase or an approved runtime data store after implementation. They do not belong in `content/en.json` or `content/vi.json`.

Milestone 5 stores runtime responses in Supabase `question_responses` rows. The active Party Session and participants are also runtime data. Normal runtime question content comes from the approved bilingual locale files; development fixture questions remain placeholder-only and are isolated to QA/test code.

Potential fields:

- `quizAttemptId`: quiz session id.
- `questionId`: stable content question id.
- `selectedAnswerId`: selected answer id, or null for a timeout.
- `resultStatus`: correct, incorrect, or timed out.
- `responseDurationMs`: response duration.
- `submittedAt`: submission timestamp.
- `lockedAt`: lock timestamp.
- `timedOut`: timeout flag.
- `idempotencyKey`: retry token or equivalent.

Milestone 5 participant/session runtime fields:

- `partySessionId`: shared session id.
- `publicJoinCode`: stable join code for QR URLs.
- `participantId`: opaque guest identity.
- `displayName`: guest-provided leaderboard name.
- `locale`: English or Vietnamese.
- `resumeTokenHash`: server-side hash of the participant resume token.
- `isTest`: separates QA/preview records from production event data.

## Message Model

Guest messages are runtime data, stored in Supabase after implementation.

Fields:

- `id`: generated id.
- `participantId`: optional link to guest participant record.
- `displayName`: guest-provided display name.
- `locale`: submitted locale.
- `message`: guest message text.
- `status`: simple visibility/review status if messages are later displayed publicly.
- `isTest`: identifies QA/test data.
- `createdAt`: timestamp.

Constraints:

- Set a reasonable character limit before implementation.
- Do not require sensitive personal information.
- Keep any review workflow simple and defer complex moderation unless Ian explicitly approves it later.

## Timeline Model

Timeline entries are content data and must not be invented.

Fields:

- `id`: stable unique identifier.
- `status`: `placeholder`, `draft`, `ready`, or `archived`.
- `dateLabel`: localized display date or age label.
- `title`: localized title.
- `description`: localized description.
- `assetIds`: optional linked asset ids.
- `sortOrder`: display order.

Placeholder behavior:

- Empty timeline is acceptable.
- Placeholder copy should say that memories will be added when provided.
- Do not add sample milestones.

## Gallery Model

Gallery items are content data and must reference real provided assets.

Fields:

- `id`: stable unique identifier.
- `status`: `placeholder`, `draft`, `ready`, or `archived`.
- `assetId`: required for ready gallery item.
- `alt`: localized accessible description provided with the asset.
- `caption`: optional localized caption.
- `credit`: optional asset credit.
- `sortOrder`: display order.

Rules:

- Do not generate fake photos.
- Do not write fake captions.
- Missing assets should show approved placeholders only.

## Asset Reference Model

Asset references in content files should point to entries defined by id.

Fields:

- `id`: stable unique identifier.
- `type`: `image`, `audio`, `icon`, or `illustration`.
- `src`: path or storage key.
- `alt`: localized alt text when visual.
- `description`: internal note for replacement.
- `status`: `placeholder`, `provided`, or `approved`.

See [ASSETS.md](ASSETS.md) for file naming and replacement rules.

## Content Review Checklist

- All ready content exists in English and Vietnamese.
- No real content appears without approval.
- No placeholder accidentally claims to be a real memory.
- Quiz answer ids are stable across locales.
- Asset ids resolve to provided or approved placeholder assets.
- Admin/test copy is separate from guest copy where appropriate.
