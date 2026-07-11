# Han Birthday Experience

Public title: **WHO IS TURNING ONE?!**

Han Birthday Experience is a premium interactive web experience for Callahan (Han)'s first birthday. It is designed as a digital extension of the party: guests enter from a QR code on their phones, play a short bilingual quiz, leave a message, and see a live leaderboard on a laptop or TV display.

This repository has completed its documentation-first foundation review. The next approved step is Milestone 1 project scaffolding; no application implementation exists yet.

## Purpose

The project exists to preserve memories and create a warm shared moment at Han's birthday party. The technology should feel invisible. Guests should feel like they are participating in the celebration, not using a generic quiz website.

Priority order for every decision:

1. User experience
2. Emotional experience
3. Maintainability
4. Developer convenience

## Target Architecture

The planned stack is:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Supabase
- next-intl
- Vercel

No app scaffold or implementation code exists yet. The intended architecture is described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentation Structure

- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md): one-file briefing for future contributors and AI agents.
- [PROJECT_PHILOSOPHY.md](PROJECT_PHILOSOPHY.md): product, design, and decision principles.
- [DECISIONS.md](DECISIONS.md): architecture decision records for accepted decisions.
- [ROADMAP.md](ROADMAP.md): milestone plan before and during implementation.
- [docs/PRD.md](docs/PRD.md): product requirements document.
- [docs/UX.md](docs/UX.md): screens, flows, states, and interaction direction.
- [docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md): visual design system inspired by the birthday setup.
- [docs/CONTENT.md](docs/CONTENT.md): content models and rules.
- [docs/ASSETS.md](docs/ASSETS.md): required assets, naming, and replacement behavior.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): planned technical architecture.
- [docs/QA.md](docs/QA.md): testing and release strategy.
- [docs/FOUNDATION_REVIEW.md](docs/FOUNDATION_REVIEW.md): Milestone 0 review record and approved next step.
- [AGENTS.md](AGENTS.md): specialized AI roles for future project work.
- [.github/instructions/birthday.instructions.md](.github/instructions/birthday.instructions.md): project-specific coding and review instructions for AI agents.

## Content Files

Content must come from external data files. The initial placeholder schemas are:

- [content/en.json](content/en.json)
- [content/vi.json](content/vi.json)

These files intentionally contain no real Han stories, memories, timeline events, photos, or quiz questions.

## Development Workflow

1. Review the foundation documents.
2. Confirm product scope, content ownership, and asset availability.
3. Add real content only to external content files after Ian provides it.
4. Scaffold the application with the target stack during Milestone 1.
5. Build features milestone by milestone from [ROADMAP.md](ROADMAP.md).
6. Validate each milestone through the QA process in [docs/QA.md](docs/QA.md).

## Non-Negotiable Rules

- Do not invent stories, memories, timeline events, quiz answers, or photo descriptions.
- Do not generate fake photos.
- Do not hardcode content in components.
- Use placeholders until Ian provides real assets and copy.
- Keep the birthday experience warmer and more important than implementation convenience.
