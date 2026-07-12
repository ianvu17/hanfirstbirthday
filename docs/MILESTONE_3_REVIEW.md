# Milestone 3 Review

## Review Date

2026-07-12.

## Repository Phase

Milestone 3: Guest Entry Experience implemented and awaiting Ian approval.

## Scope

Implemented the guest onboarding flow only:

1. Welcome.
2. Language selection.
3. Guest display name.
4. How to play.
5. Ready.
6. Quiz Coming Soon placeholder.

The quiz engine, timer runtime, answer logic, scoring, leaderboard runtime, Supabase persistence, messages, admin behavior, QA tools, deployment, and QR generation were not implemented.

## Implemented Screens

- Welcome screen with the public title, placeholder hero image frame, birthday decorations, gentle hero float motion, and start CTA.
- Language selection with two large options for English and Vietnamese.
- Guest name form with friendly explanation, whitespace trimming, blank-name validation, long-name support, and session-only storage.
- How to Play screen with three illustrated rule cards: 20 seconds, locked answer, reveal/fun fact/next.
- Ready screen with a celebratory handoff and Start Quiz CTA.
- Quiz Coming Soon placeholder that stops before Milestone 4.

## Components Created

- `components/guest/onboarding-flow.tsx`
- `components/guest/onboarding-hero.tsx`
- `components/guest/language-selector.tsx`
- `components/guest/guest-name-card.tsx`
- `components/guest/instruction-card.tsx`
- `components/guest/progress-indicator.tsx`
- `components/guest/celebration-banner.tsx`

## State Management Approach

Milestone 3 uses browser `sessionStorage` only for:

- Selected language.
- Guest display name.
- Current onboarding step.

No participant IDs, quiz attempts, question responses, Supabase records, messages, admin data, or QA/test records are created.

## Architecture Summary

- `/{locale}` now renders the guest onboarding flow instead of the scaffold placeholder.
- Static copy comes from `content/en.json` and `content/vi.json`.
- The content schema was extended for onboarding-specific screens.
- Guest onboarding is isolated in `components/guest/`.
- Display, admin, QA, and design-system route boundaries remain separate.
- The Start Quiz button intentionally routes to an in-flow placeholder so Milestone 4 can replace it with the quiz engine.

## UX Summary

- First impression is visual and celebratory, with no quiz details on the welcome screen.
- Language choice is simple and early, with small switch controls available later.
- Name entry explains why the name is needed without creating accounts or backend identity.
- Rules are short and visual instead of paragraph-heavy.
- The Ready screen increases excitement, then stops safely before quiz implementation.

## Screenshot Outputs

Before implementation:

- `.next/milestone-3-screenshots/before/en-mobile-before.png`
- `.next/milestone-3-screenshots/before/vi-mobile-before.png`
- `.next/milestone-3-screenshots/before/en-desktop-before.png`

After implementation:

- `.next/milestone-3-screenshots/after/en-01-welcome.png`
- `.next/milestone-3-screenshots/after/en-02-language.png`
- `.next/milestone-3-screenshots/after/en-03-name.png`
- `.next/milestone-3-screenshots/after/en-04-instructions.png`
- `.next/milestone-3-screenshots/after/en-05-ready.png`
- `.next/milestone-3-screenshots/after/en-06-quiz-placeholder.png`
- `.next/milestone-3-screenshots/after/vi-01-welcome.png`
- `.next/milestone-3-screenshots/after/vi-02-language.png`
- `.next/milestone-3-screenshots/after/vi-03-name.png`
- `.next/milestone-3-screenshots/after/vi-04-instructions.png`
- `.next/milestone-3-screenshots/after/vi-05-ready.png`
- `.next/milestone-3-screenshots/after/vi-06-quiz-placeholder.png`
- `.next/milestone-3-screenshots/after/responsive/`

## Validation

Baseline before edits:

- `npm run validate`
- Before screenshots captured from `/en` and `/vi`.

During implementation:

- `npm run validate:content`
- `npm run typecheck`
- `npm run lint`
- `npm run check:visual:milestone3`
- `MILESTONE2_BASE_URL=http://localhost:3000 npm run check:visual:milestone2`

Final validation:

- `npm run validate`
- `MILESTONE3_BASE_URL=http://localhost:3002 npm run check:visual:milestone3`
- `MILESTONE2_BASE_URL=http://localhost:3002 npm run check:visual:milestone2`

All final commands passed against a production `next start` server on port `3002`.

## Visual Review Findings

- Initial browser pass found a decorative cow-spot overlay intercepting taps on the name submit button. The overlay is now pointer-event-free.
- Mobile progress labels were too compressed. Mobile now shows numbered progress markers with accessible labels, while larger screens keep text labels.
- Vietnamese name and instruction screens render diacritics cleanly.
- iPhone SE, modern iPhone, Pixel width, iPad, desktop, and large-TV viewports passed horizontal-overflow checks.
- Reduced-motion capture works for the Vietnamese welcome screen.

## Accessibility Findings

- Primary controls use comfortable touch targets.
- Name validation is announced with `aria-live`.
- Decorative motifs and placeholder decoration are hidden from assistive technology.
- Progress markers expose labels through ARIA even when mobile text labels are hidden.
- The flow is keyboard reachable through standard buttons and form controls.

## Documentation Updated

- `README.md`
- `PROJECT_CONTEXT.md`
- `ROADMAP.md`
- `REPOSITORY_SUMMARY.md`
- `.github/instructions/birthday.instructions.md`
- `docs/UX.md`
- `docs/ARCHITECTURE.md`
- `docs/QA.md`
- `docs/MILESTONE_3_REVIEW.md`

## Structured Self-Review

Product Manager: The milestone serves the guest first impression and does not invent Han facts or exceed the requested scope.

Software Architect: State remains client/session-only and future Supabase integration is not pre-implemented.

Frontend Lead: The flow uses existing design primitives, remains mobile-first, and keeps route concerns separated.

UX Designer: The screens are short, sequential, and stop cleanly before quiz work begins.

Art Director: The implementation keeps the warm cream, blue, yellow, orange, cow-accented paper-party atmosphere with honest placeholders.

QA Lead: Validation and visual screenshot scripts cover English, Vietnamese, mobile, responsive, and reduced-motion checks.

## Known Issues

- The hero image is still a placeholder because no approved birthday hero image has been provided.
- Quiz Coming Soon is intentionally a placeholder.
- Onboarding state is session-only and will reset when the browser session ends.
- No real quiz content, scoring, persistence, leaderboard, messages, admin, QA mode, deployment, or QR code exists yet.
- Admin, QA, display, and design-system routes remain separate placeholders or internal review routes.

## Suggested Improvements

- Replace the hero placeholder with an approved real event image or approved illustration.
- Add the Milestone 4 quiz engine behind the Ready CTA after Ian approval.
- Decide whether quiz answer selection should submit immediately or require confirmation.
- Add automated component tests for the name form and session-state transitions.
- Re-run screenshots on target physical devices before party-day deployment.

## Recommended Next Milestone

Milestone 4 — Quiz Engine.

Do not begin Milestone 4 until Ian approves this milestone.
