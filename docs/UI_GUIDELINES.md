# UI Guidelines

## Visual Direction

The interface should feel inspired by the birthday backdrop without copying it literally. Translate the setup into digital form through warm color, soft layered shapes, rounded geometry, playful type, handmade decoration cues, and a tasteful cow-party theme.

Keywords:

- Premium children's party.
- Warm cream backdrop.
- Blue, yellow, and orange accents.
- Rounded paper-cut layers.
- Handmade decorations.
- Soft celebration.
- Gentle cow theme.

## Color System

Use semantic tokens rather than raw colors in components.

Milestone 2 implementation:

- Tokens live primarily in [../app/globals.css](../app/globals.css) as CSS custom properties and are exposed through [../tailwind.config.ts](../tailwind.config.ts).
- Core semantic surfaces include `background-page`, `surface-paper`, `surface-paper-deep`, `surface-highlight`, `surface-sky`, `surface-coral`, `text-primary`, `text-muted`, `border-playful`, `shadow-paper`, and `focus-ring`.
- Accent tokens are `accent-blue`, `accent-blue-deep`, `accent-yellow`, `accent-orange`, `accent-red`, `accent-pink`, and `accent-green`.
- Component code should prefer semantic Tailwind classes such as `bg-surface-paper`, `text-muted-foreground`, `bg-party-blue`, and `shadow-paper` over raw color values.

Suggested palette direction:

- Background cream: warm, soft, not stark white.
- Primary blue: cheerful and clear for main actions.
- Accent yellow: celebratory highlights and positive moments.
- Accent orange: warmth, progress, and special states.
- Soft brown or charcoal: readable text with warmth.
- Muted blue-gray: secondary text and borders.
- Cow spot neutral: sparing decorative contrast, not dominant.

Usage rules:

- Cream should be the primary surface color.
- Blue should carry primary actions and navigation anchors.
- Yellow and orange should add joy, not overwhelm the page.
- Avoid purple-heavy gradients, corporate dark dashboards, or neon party colors.
- Maintain accessible contrast for all text and controls.

## Typography

Typography should feel playful but readable.

Milestone 2 implementation:

- Display font: Baloo 2 via `next/font/google`, used for title moments, large headings, celebratory numerals, and limited display emphasis.
- Body/UI font: Be Vietnam Pro via `next/font/google`, used for body copy, buttons, controls, admin, QA, and longer Vietnamese text.
- Both fonts are loaded with Vietnamese support and `display: "swap"`.
- Typography decisions are recorded in [../DECISIONS.md](../DECISIONS.md) as ADR-009.

Direction:

- Use an expressive display font for title moments and celebratory headings.
- Use a highly readable text font for body copy, buttons, forms, and admin screens.
- Ensure Vietnamese diacritics render beautifully in all chosen fonts.
- Avoid default-feeling system typography unless a later design decision justifies it.

Rules:

- Do not scale font size directly with viewport width.
- Avoid negative letter spacing.
- Keep quiz and form text large enough for phones.
- Party Screen typography should prioritize distance readability, especially for questions, countdowns, answer reveals, fun facts, and leaderboard rankings.

## Spacing

Use generous spacing for guest-facing flows and denser spacing only in admin views.

Direction:

- Mobile screens should have comfortable thumb spacing.
- Quiz answer choices need stable height and clear separation.
- Party Screen layouts should stay spacious on TV, with stable areas for questions, countdowns, reveal content, and leaderboard rows.
- Avoid nested card layouts.

## Radius

Rounded shapes are part of the design language.

Direction:

- Use medium-large radius for playful panels and answer choices.
- Keep utility components controlled and consistent.
- Avoid pill-shaped everything; vary shape intentionally.

## Shadows And Layers

The visual style should suggest layered paper and handmade party decor.

Milestone 2 implementation:

- `shadow-paper` is the default warm paper depth.
- `shadow-lift` is used for buttons, badges, and compact raised elements.
- `shadow-sticker` and `shadow-outline` support offset paper/title effects.
- Use `PaperPanel` for reusable framed paper surfaces instead of creating ad hoc card stacks.

Milestone 3.5 implementation:

- Guest-facing paper panels now include a standardized offset backplate and inner border for stronger physical depth.
- The page shell includes a stage/table base and blue runner inspired by the physical party setup.
- `TitleLockup` creates the public title with colored chunky lettering, cream stroke, warm red outline, and blue offset depth while keeping accessible text in the DOM.

Direction:

- Use soft shadows with warm undertones.
- Prefer layered flat shapes over glossy effects.
- Avoid heavy drop shadows that feel like generic app cards.
- Use depth to guide hierarchy, not decoration alone.

## Illustrations And Decorative Shapes

Illustrations should be simple, warm, and handmade-feeling.

Milestone 2 implementation:

- Lightweight motif primitives live in `components/design/party-motifs.tsx`.
- Current motifs: bunting, clouds, star cluster, and wave divider.
- Motifs are original SVG/CSS shapes, decorative by default, and hidden from assistive technology.
- Gingham, paper texture, and soft cow-spot treatments live as CSS utilities.

Milestone 3.5 implementation:

- Additional reusable motifs include `BalloonCluster`, `GiftStack`, and `PartyHat`.
- Decorative motifs remain original SVGs, `aria-hidden`, pointer-event-free through the shell, and subordinate to content.

Allowed direction:

- Rounded paper-cut shapes.
- Soft banner or garland-inspired details.
- Cow spot motifs used sparingly.
- Confetti-like accents in controlled amounts.

Avoid:

- Literal recreation of the backdrop.
- Generic stock birthday clip art.
- Fake photos.
- Decorative clutter that competes with quiz choices.

## Icon Style

Use simple rounded icons when helpful. Icons should support comprehension, not decorate every label.

Direction:

- Prefer established icon libraries used by the app stack once implemented.
- Keep stroke weight friendly and consistent.
- Pair icons with text for important mobile actions unless the icon is universally understood.
- Add accessible labels for icon-only controls.

## Animation Language

Motion should feel soft, celebratory, and intentional.

Milestone 2 implementation:

- `components/motion/soft-entrance.tsx` provides a reduced-motion-aware entrance primitive.
- `components/motion/motion-patterns.tsx` provides page, paper-layer, celebratory reveal, and staggered reveal patterns.
- Global reduced-motion CSS removes nonessential animation for users who request it.
- Do not add continuous background animation to guest or display screens.

Use motion for:

- Screen entrances.
- Question transitions.
- Answer selection feedback.
- Timer urgency near the end of a question.
- Result reveal.
- Shared Party Screen phase transitions.
- Answer and Han fun fact reveals.
- New leaderboard entries.
- Leaderboard bar growth, integer count-up, and row reordering in explicit intro/grow/reorder/settled stages.
- Message submission confirmation.

Avoid:

- Constant background movement.
- Long animations that slow guests down.
- Motion that makes Party Screen content or leaderboard rows hard to read.
- Effects that fail on lower-powered phones.

Respect reduced-motion preferences.

The Party Screen leaderboard uses one blue bar family with top-three paper accents, not unrelated chart colors. Bar scale uses a shared nice ceiling with a 2,000-point minimum; zero-score rows remain visible with an empty track. All 10 participant rows must fit 1366x768 without internal scrolling. Reduced motion skips bar growth and reordering and renders the final information immediately.

## Responsiveness

Guest experience:

- Design mobile-first for one-handed use.
- Keep primary actions within comfortable reach.
- Ensure text wraps cleanly in English and Vietnamese.
- Avoid layout shifts when timer, answers, or validation text changes.

Party Screen:

- Use a dedicated large-screen layout.
- Increase type size and row spacing.
- Avoid tiny controls or dense admin information.
- Keep the top results visible and stable.
- Treat leaderboard as one Party Screen phase, not the only desktop responsibility.

Admin:

- Admin views may use more compact layouts.
- Still preserve clarity, localization where needed, and separation from guest visuals.

Production Host Controller:

- Use restrained party styling rather than dashboard chrome.
- Keep one large bottom-reachable primary action.
- Show connection, phase, participant, response, revision, and current-question status in compact readable blocks.
- PIN, pending, live, reconnecting, offline, accepted, rejected, and finish-confirmation states must be legible at phone width.
- Do not expose QA fixture controls or developer diagnostics on the production Host Controller.

## Component Guidance

- Use shadcn/ui primitives once implementation begins.
- Use Tailwind design tokens for color, spacing, radius, and shadow values.
- Do not place cards inside cards.
- Do not style whole page sections as floating cards unless the section is an actual framed tool.
- Build stable dimensions for quiz options, timer areas, counters, and leaderboard rows.
- Use content placeholders that are visually intentional and clearly replaceable.

Milestone 2 primitives:

- `PageShell` for guest/admin/display/QA/showcase route surfaces.
- `PaperPanel` for framed paper surfaces.
- `DecorativeHeading` for title treatment and bilingual-safe descriptions.
- `BirthdayBadge` for labels and QA/admin markers.
- `AssetPlaceholder` for honest missing/provided-image frames with stable ratios.
- `HeroPhotoFrame` for the primary future Han portrait slot with layered birthday framing, missing-image fallback, and image-load error handling.
- `TitleLockup` for the public "WHO IS TURNING ONE?!" treatment.
- `LoadingTreatment` for soft skeleton-like loading.
- `Button` keeps the shadcn-style API but uses custom birthday visual treatment.
