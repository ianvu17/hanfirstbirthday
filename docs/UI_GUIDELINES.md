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

Direction:

- Use an expressive display font for title moments and celebratory headings.
- Use a highly readable text font for body copy, buttons, forms, and admin screens.
- Ensure Vietnamese diacritics render beautifully in all chosen fonts.
- Avoid default-feeling system typography unless a later design decision justifies it.

Rules:

- Do not scale font size directly with viewport width.
- Avoid negative letter spacing.
- Keep quiz and form text large enough for phones.
- TV leaderboard typography should prioritize distance readability.

## Spacing

Use generous spacing for guest-facing flows and denser spacing only in admin views.

Direction:

- Mobile screens should have comfortable thumb spacing.
- Quiz answer choices need stable height and clear separation.
- Leaderboard rows should be spacious on TV.
- Avoid nested card layouts.

## Radius

Rounded shapes are part of the design language.

Direction:

- Use medium-large radius for playful panels and answer choices.
- Keep utility components controlled and consistent.
- Avoid pill-shaped everything; vary shape intentionally.

## Shadows And Layers

The visual style should suggest layered paper and handmade party decor.

Direction:

- Use soft shadows with warm undertones.
- Prefer layered flat shapes over glossy effects.
- Avoid heavy drop shadows that feel like generic app cards.
- Use depth to guide hierarchy, not decoration alone.

## Illustrations And Decorative Shapes

Illustrations should be simple, warm, and handmade-feeling.

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

Use motion for:

- Screen entrances.
- Question transitions.
- Answer selection feedback.
- Timer urgency near the end of a question.
- Result reveal.
- New leaderboard entries.
- Message submission confirmation.

Avoid:

- Constant background movement.
- Long animations that slow guests down.
- Motion that makes leaderboard rows hard to read.
- Effects that fail on lower-powered phones.

Respect reduced-motion preferences.

## Responsiveness

Guest experience:

- Design mobile-first for one-handed use.
- Keep primary actions within comfortable reach.
- Ensure text wraps cleanly in English and Vietnamese.
- Avoid layout shifts when timer, answers, or validation text changes.

TV leaderboard:

- Use a dedicated large-screen layout.
- Increase type size and row spacing.
- Avoid tiny controls or dense admin information.
- Keep the top results visible and stable.

Admin:

- Admin views may use more compact layouts.
- Still preserve clarity, localization where needed, and separation from guest visuals.

## Component Guidance

- Use shadcn/ui primitives once implementation begins.
- Use Tailwind design tokens for color, spacing, radius, and shadow values.
- Do not place cards inside cards.
- Do not style whole page sections as floating cards unless the section is an actual framed tool.
- Build stable dimensions for quiz options, timer areas, counters, and leaderboard rows.
- Use content placeholders that are visually intentional and clearly replaceable.
