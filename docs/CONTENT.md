# Content Models

## Content Rule

Never invent Han content. Real quiz questions, memories, timeline entries, image captions, and stories must come from Ian or another approved source. Until then, use schema placeholders only.

The initial locale files are:

- [../content/en.json](../content/en.json)
- [../content/vi.json](../content/vi.json)

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

## Quiz Model

Quiz questions must be structured, localizable, and externally managed.

Question fields:

- `id`: stable unique identifier.
- `status`: `draft`, `ready`, or `archived`.
- `prompt`: localized question text.
- `helpText`: optional localized supporting text.
- `type`: initially `singleChoice`.
- `durationSeconds`: default 20 unless overridden by approved content.
- `answers`: localized answer options.
- `correctAnswerId`: stable answer id.
- `explanation`: optional localized explanation after answering or on result review.
- `assetId`: optional linked asset id.
- `sortOrder`: display order.

Answer fields:

- `id`: stable unique identifier.
- `label`: localized answer text.
- `assetId`: optional linked image or icon asset.

Validation rules:

- Every ready question must have at least two answers.
- Every ready single-choice question must have exactly one correct answer.
- Ready questions must exist in both locales.
- No prompt, answer, or explanation may be fabricated.

## Message Model

Guest messages are runtime data, stored in Supabase after implementation.

Fields:

- `id`: generated id.
- `participantId`: optional link to guest participant record.
- `displayName`: guest-provided display name.
- `locale`: submitted locale.
- `message`: guest message text.
- `status`: `pending`, `approved`, `hidden`, or `archived` if moderation is added.
- `isTest`: identifies QA/test data.
- `createdAt`: timestamp.

Constraints:

- Set a reasonable character limit before implementation.
- Do not require sensitive personal information.
- Provide admin review if messages may be displayed publicly later.

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
