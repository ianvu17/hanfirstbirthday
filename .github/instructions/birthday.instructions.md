---
description: "Use when: working on the Han Birthday Experience repository, including product, design, frontend, architecture, content, QA, or implementation tasks."
applyTo: "**/*"
---

# Han Birthday Experience Instructions

## Required Context

Before making project changes, read [PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md), [DECISIONS.md](../../DECISIONS.md), and the relevant document in [docs](../../docs).

This project is a premium interactive web experience for Callahan (Han)'s first birthday. It is a digital extension of the party, not a generic quiz website.

## Documentation Precedence

When guidance conflicts, use this order:

1. Ian's most recent explicit instruction.
2. [PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md).
3. [DECISIONS.md](../../DECISIONS.md).
4. [docs/PRD.md](../../docs/PRD.md).
5. [docs/UX.md](../../docs/UX.md).
6. [docs/UI_GUIDELINES.md](../../docs/UI_GUIDELINES.md).
7. [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).
8. [docs/CONTENT.md](../../docs/CONTENT.md).
9. [docs/ASSETS.md](../../docs/ASSETS.md).
10. [docs/QA.md](../../docs/QA.md).
11. [ROADMAP.md](../../ROADMAP.md).
12. Existing implementation.

Do not silently resolve material conflicts. Record the conflict and ask for clarification when it changes product behavior.

## Decision Priority

When requirements conflict, prioritize:

1. User experience
2. Emotional experience
3. Maintainability
4. Developer convenience

## Non-Negotiable Rules

- Never invent Han stories, memories, facts, quiz answers, captions, timeline events, or photo descriptions.
- Never generate fake photos.
- Never hardcode content in UI components.
- Always use external content files or approved runtime data for content.
- Use placeholders until Ian provides real assets and copy.
- Do not start implementation before the documentation foundation is reviewed unless Ian explicitly asks.
- Stock baby images must not be used as Han placeholders.

## Coding Standards

- Use the approved stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Supabase, next-intl, and Vercel.
- Keep code strongly typed and easy to review.
- Prefer small, focused components organized by feature.
- Keep business logic outside presentational components.
- Validate content schemas before trusting content at runtime.
- Treat localization key parity as a release requirement.
- Avoid clever abstractions that make the event-day flow harder to reason about.

## Architecture Rules

- Separate guest routes, display routes, admin routes, and QA routes.
- Keep static content in locale files and runtime data in Supabase.
- Every question has its own submission.
- An accepted answer becomes immutable.
- A timeout also locks the question.
- There is no editable final review of all quiz answers.
- Safe retries must not duplicate responses or reopen locked answers.
- Tag QA/test data and filter it from production guest/display views.
- Keep admin scope intentionally minimal: scores, messages, current leaderboard, QA/test separation, necessary test resets, TV leaderboard link, and optional simple readiness summary.
- Document major technical decisions in [DECISIONS.md](../../DECISIONS.md).

## UI Rules

- Follow [docs/UI_GUIDELINES.md](../../docs/UI_GUIDELINES.md).
- Build mobile-first guest screens.
- Build a separate large-screen leaderboard experience.
- Use warm cream surfaces, rounded shapes, layered paper-cut feeling, blue/yellow/orange accents, and tasteful cow-theme references.
- Do not copy the birthday backdrop literally.
- Do not create generic SaaS, dashboard, or stock birthday visuals for guest flows.
- Treat shadcn/ui as an implementation primitive only; its default SaaS appearance must not define the experience.
- Avoid nested cards and unstable layouts.
- Ensure English and Vietnamese text fit without overlap.

## UX Rules

- Guests should understand each screen within seconds.
- Keep the quiz short, playful, and low-pressure.
- Make result and leaderboard moments celebratory without shaming low scores.
- Provide clear loading, empty, error, and duplicate-submission states.
- Do not make sound required for comprehension.
- Respect reduced-motion preferences.

## Content Rules

- Content models are defined in [docs/CONTENT.md](../../docs/CONTENT.md).
- Locale files must share the same structure.
- Real content must be approved before use.
- Placeholder states must be honest and must not imply real memories.
- Missing guest-facing translations should block production readiness.

## Review Expectations

Before finishing a change, verify:

- The change supports the birthday experience.
- No content was invented.
- No content was hardcoded in components.
- Mobile and bilingual behavior were considered.
- Guest, admin, QA, and display concerns remain separated.
- Relevant docs were updated when decisions or behavior changed.

## Next Milestone Guardrail

Milestone 4 local Party Engine is implemented and stops at Ian's human approval gate. Do not begin Milestone 5 automatically. The next milestone owns Supabase-backed shared sessions, realtime or approved fallback synchronization, production participant joining, command authority, reconnect/resume, production leaderboard data, QA/test data persistence, and host access strategy. Do not implement messages, gallery, timeline, complex admin, deployment, or production QR generation unless Ian explicitly reprioritizes.
