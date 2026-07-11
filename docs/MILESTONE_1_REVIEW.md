# Milestone 1 Review

## Review Date

2026-07-12.

## Repository Phase

Milestone 1: Project Scaffold completed.

## Delivered

- Next.js App Router scaffold with TypeScript.
- Tailwind CSS configuration and global birthday-theme tokens.
- shadcn/ui configuration plus a local button primitive.
- Framer Motion dependency and a reduced-motion-aware entrance primitive.
- next-intl routing foundation with English and Vietnamese locale routes.
- Supabase client dependency and environment placeholders for later milestones.
- Validated content loader for `content/en.json` and `content/vi.json`.
- External scaffold copy in `content/scaffold.json` for temporary route-placeholder text.
- Locale schema and key-parity validation script.
- Neutral placeholder asset system under `public/assets/placeholders`.
- Route boundaries for guest, display, admin, and QA areas.
- Vercel-compatible production build path through Next.js.

## Intentionally Deferred

- Quiz mechanics, timers, scoring, answer locking, and safe retries.
- Supabase schema, migrations, policies, runtime writes, and realtime subscriptions.
- Live leaderboard behavior.
- Message submission and persistence.
- Complete guest entry flow.
- Admin utility behavior and access control.
- QA/test data reset behavior.
- Real Han content, quiz facts, memories, timeline entries, captions, and photos.

## Validation

- `npm run validate:content`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Route smoke tests against the local dev server for `/en`, `/vi`, `/display/leaderboard`, `/en/admin`, and `/vi/qa`.
- Playwright screenshot checks for mobile English, mobile Vietnamese, and desktop display placeholder.

All commands passed.

## Assumptions

- Milestone 1 is allowed to show diagnostic placeholder UI while content files remain schema-only.
- Neutral placeholder artwork is acceptable because it does not represent a real photo, memory, or event.
- Admin and QA routes can exist as route-boundary placeholders, with behavior deferred.

## Risks And Follow-Ups

- npm audit reports two moderate transitive vulnerabilities; no forced upgrade was applied because that can introduce breaking changes. Review before production hardening.
- The current audit finding is in Next's bundled PostCSS dependency; `npm audit fix --force` suggested a breaking downgrade and was not applied.
- Milestone 2 should turn the initial theme tokens and primitives into the full design system described in `docs/UI_GUIDELINES.md`.
- Real guest-facing copy is still absent and must be provided externally before production readiness.
