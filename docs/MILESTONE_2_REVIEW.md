# Milestone 2 Review

## Review Date

2026-07-12.

## Repository Phase

Milestone 2: Content and Design System Foundation completed.

## Scope

This milestone transformed the neutral Milestone 1 scaffold into a reusable visual foundation inspired by Han's physical first-birthday theme. It did not implement the guest entry flow, quiz engine, Supabase runtime behavior, live leaderboard data, message persistence, admin actions, QA reset tools, or real Han content.

## Implemented Design Foundations

- Centralized semantic CSS tokens in `app/globals.css`.
- Tailwind mappings for surface, ink, party accent, shadow, duration, and easing tokens.
- Baloo 2 display typography and Be Vietnam Pro body/UI typography through `next/font/google`.
- Birthday-themed button treatment while preserving the shadcn-style API.
- Paper-cut visual primitives in `components/design/`.
- Reduced-motion-aware motion patterns in `components/motion/`.
- Lightweight original motifs: bunting, clouds, stars, wave divider, gingham, paper texture, and soft cow spots.
- Robust asset placeholder component with stable square, portrait, landscape, and wide ratios.
- Internal localized showcase routes at `/en/design-system` and `/vi/design-system`.
- Themed placeholder surfaces for `/en`, `/vi`, `/display/leaderboard`, `/{locale}/admin`, and `/{locale}/qa`.

## Token Strategy

Raw color values are centralized as CSS custom properties. Components use semantic Tailwind classes such as `bg-surface-paper`, `bg-party-blue`, `text-muted-foreground`, `border-border`, `shadow-paper`, and `shadow-lift`.

The palette translates the birthday reference into warm cream surfaces, clear blue actions, yellow celebration highlights, orange/red/pink accents, and restrained neutral ink. The design avoids stock gradients, generic SaaS blue-gray styling, and fake photographic content.

## Typography Decision

ADR-009 records Baloo 2 for celebratory display headings and Be Vietnam Pro for body/UI text. Both are loaded with Vietnamese support and `display: "swap"`.

## Primitives Created

- `PageShell`
- `PaperPanel`
- `DecorativeHeading`
- `BirthdayBadge`
- `AssetPlaceholder`
- `LoadingTreatment`
- `Bunting`, `CloudMotif`, `StarCluster`, and `WaveDivider`
- `MotionReveal`, `StaggeredReveal`, and `StaggeredItem`

## Placeholder Strategy

Placeholders are honest and asset-independent. They do not depict a baby, invent captions, or imply real memories. `AssetPlaceholder` accepts future `src`, `alt`, and `objectPosition` values and falls back gracefully when an image is missing or fails.

## Browser Checks

Screenshots were captured into `.next/milestone-2-screenshots/` using `npm run check:visual:milestone2` against a production `next start` server.

Checked viewports:

- Mobile English landing placeholder: `/en`, 390 x 844.
- Mobile Vietnamese landing placeholder: `/vi`, 390 x 844.
- Mobile Vietnamese long-copy showcase: `/vi/design-system`, 390 x 844, full page.
- Desktop design-system showcase: `/en/design-system`, 1440 x 1100, full page.
- Desktop 16:9 display placeholder: `/display/leaderboard`, 1366 x 768.
- Mobile admin placeholder: `/en/admin`, 390 x 844.
- Mobile QA placeholder: `/vi/qa`, 390 x 844.
- Reduced-motion Vietnamese showcase: `/vi/design-system`, 390 x 844, full page.

The browser script also checks for horizontal overflow in each viewport.

## Visual Review Findings

- Initial screenshot capture was too early during the Framer entrance and produced a mostly blank frame. The browser check now waits for route text and a short timeout before capture.
- The desktop showcase revealed one decorative cloud using an invalid Tailwind opacity class, causing it to render dark. This was corrected to `text-white/90`.
- Mobile Vietnamese copy wrapped cleanly without clipped diacritics.
- Display placeholder remained legible at 1366 x 768 with stable rows and restrained decoration.
- Admin remained calmer than guest/showcase surfaces.
- QA route was visually marked as QA/test context.

## Accessibility Findings

- Visible focus styling is centralized through `:focus-visible` and tokenized focus color.
- Buttons keep at least 44px touch targets.
- Decorative SVG motifs are hidden from assistive technology.
- Meaning is not conveyed by color alone in the reviewed placeholders.
- Reduced-motion CSS and Framer Motion reduced-motion branches are present and browser-checked.
- Remaining accessibility work for real forms, quiz states, leaderboard updates, and message submission is deferred to feature milestones.

## Validation

Baseline before edits:

- `npm run validate`
- `npm audit --audit-level=moderate`
- `git status --short`
- `git diff`

During implementation:

- `npm run validate:content`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `MILESTONE2_BASE_URL=http://localhost:3002 npm run check:visual:milestone2`

Final validation:

- `npm run validate`
- `npm audit --audit-level=moderate`
- `MILESTONE2_BASE_URL=http://localhost:3002 npm run check:visual:milestone2`

## Dependency Status

`@playwright/test` was added as a dev dependency for repeatable browser screenshot checks.

`npm audit` continued to report two moderate vulnerabilities from Next's transitive `postcss` dependency. The available fix requires `npm audit fix --force` and a breaking downgrade to `next@9.3.3`, so no forced remediation was applied.

## Documentation Updated

- `README.md`
- `PROJECT_CONTEXT.md`
- `ROADMAP.md`
- `REPOSITORY_SUMMARY.md`
- `DECISIONS.md`
- `docs/UI_GUIDELINES.md`
- `docs/ASSETS.md`
- `docs/ARCHITECTURE.md`
- `docs/QA.md`

## Structured Self-Review

Product Manager: The milestone supports the birthday experience and avoids premature feature scope.

Software Architect: The visual layer is reusable and keeps guest, display, admin, QA, and internal showcase route concerns separate.

Frontend Lead: Tokens, typography, primitives, motion, and route placeholders are centralized enough for Milestone 3 work.

UX Designer: Mobile and Vietnamese layouts were checked, and route placeholders avoid dead-end feature promises.

Art Director: The result translates the reference through cream surfaces, bunting, chunky type, gingham, stars, clouds, paper depth, and restrained party accents without copying the backdrop literally.

QA Lead: Build and visual checks pass, with screenshots captured and one visual issue corrected.

## Known Limitations

- Real guest copy is still absent from `content/en.json` and `content/vi.json`.
- Real Han photos, quiz content, memories, captions, and timeline entries are still absent.
- The showcase route is internal and should not be treated as a production guest flow.
- Feature-level accessibility, data, and interaction testing remains deferred.
- Admin and QA pages are placeholders only.

## Deferred Work

- Guest entry and language selection flow.
- Display name collection.
- Quiz questions, timer, scoring, and per-question locking behavior.
- Supabase schema, RLS, runtime writes, and realtime leaderboard.
- Birthday message persistence.
- Admin utility behavior and access control.
- QA/test data tagging and reset tools.
- Production deployment and QR readiness.

## Recommended Next Milestone

Milestone 3 — Guest Entry Flow.
