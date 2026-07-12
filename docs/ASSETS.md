# Asset Plan

## Asset Rule

Do not generate fake photos or imply that placeholders are real memories. Real assets must be provided by Ian or another approved source before being used as party content.

## Planned Directory Structure

When implementation begins, use a structure similar to:

```text
public/
  assets/
    brand/
    illustration/
    placeholders/
    photos/
    audio/
    icons/
content/
  en.json
  vi.json
```

If Supabase Storage is used later for gallery media, keep local placeholder references and production storage keys clearly separated in content metadata.

## Asset Categories

### Brand And Event Assets

Purpose:

- Visual anchors for the birthday experience.
- QR code materials.
- Event title treatment if provided.

Examples of required assets:

- Event backdrop reference image if Ian provides it in the repo.
- Logo/title treatment if created later.
- QR code image for production URL.

### Illustrations

Purpose:

- Support the warm paper-cut birthday mood.
- Provide non-photo decorative elements.

Direction:

- Rounded shapes.
- Cow-inspired accents.
- Garlands, soft banners, and celebration shapes.
- Cream, blue, yellow, and orange palette.

### Placeholders

Purpose:

- Represent unavailable real content honestly.
- Preserve layout before photos, timeline items, or content are provided.

Rules:

- Placeholder visuals must be visually distinct from real photos.
- Placeholder captions must not describe fake events.
- Placeholder assets should be replaceable without component changes.

Milestone 2 implementation:

- The reusable placeholder component is `components/design/asset-placeholder.tsx`.
- It supports square, portrait, landscape, and wide ratios.
- It accepts optional `src`, `alt`, and `objectPosition` values for future real assets.
- Missing or failed images fall back to a paper-textured placeholder with a neutral image icon and localized/internal scaffold label.
- The placeholder does not depict a baby, a real memory, or a fake Han photo.
- The original SVG placeholder remains at [../public/assets/placeholders/placeholder-gallery-frame-01.svg](../public/assets/placeholders/placeholder-gallery-frame-01.svg) for future reference/reuse.

Milestone 3.5 implementation:

- `components/design/hero-photo-frame.tsx` provides the primary guest-entry Han photo frame.
- The frame uses a portrait-oriented stable ratio, layered paper/gingham/backplate styling, localized placeholder copy, and a neutral camera icon.
- Future approved photos can be inserted through `src`, `alt`, and `objectPosition` without changing the surrounding welcome layout.
- Missing images and failed image loads fall back to the same honest non-photo placeholder treatment.

### Photos

Purpose:

- Future gallery and timeline content.

Rules:

- Use only provided photos.
- Store captions and alt text in content files.
- Do not crop faces or important details without review.
- Do not apply filters that make photos hard to inspect.

### Audio

Purpose:

- Optional celebration feedback for completed actions.

Rules:

- Sounds must be short and gentle.
- Sound should only play after user interaction.
- Provide mute or respect browser settings.
- Do not make audio required for comprehension.

### Icons

Purpose:

- Clarify controls and actions.

Rules:

- Use the app's selected icon library once implementation begins.
- Keep icon styling rounded and friendly.
- Avoid mixing unrelated icon styles.

## Naming Convention

Use lowercase kebab-case names.

Recommended pattern:

```text
category-purpose-variant.ext
```

Examples:

```text
placeholder-gallery-frame-01.svg
illustration-cow-spot-soft-01.svg
audio-success-soft-chime-01.mp3
```

These examples describe asset types only and are not real Han content.

## Replacement Rules

- Components reference asset ids, not hardcoded filenames, where practical.
- Content files map asset ids to paths or storage keys.
- Replacing an asset should not require component edits.
- Real assets should move from `placeholder` to `provided` or `approved` status in content metadata.
- Production release should verify that required guest-facing assets are approved.

## Fallback Behavior

Image fallback:

- Use approved placeholder illustration.
- Show localized alt text or neutral placeholder label.
- Do not invent a caption.

Audio fallback:

- Continue silently if sound fails to load.
- Do not block the guest flow.

Gallery fallback:

- Show empty state or placeholder frame.
- Make it clear that photos will appear when provided.

Timeline fallback:

- Show empty state.
- Do not display sample milestones.

## Asset Readiness Checklist

- Required assets are listed in content metadata.
- Real assets are provided and approved.
- Every meaningful image has localized alt text.
- Placeholder assets are not confused with real memories.
- File sizes are appropriate for mobile.
- TV leaderboard visuals remain legible at display distance.

Milestone 2 status:

- No real photos or real Han assets were added.
- Current placeholders are visual-system placeholders only.
- Future production content should move approved asset references into locale content metadata or Supabase Storage records before use in guest-facing memory features.
