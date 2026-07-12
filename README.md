# Han Birthday Experience

Public title: **WHO IS TURNING ONE?!**

Han Birthday Experience is a premium interactive web experience for Callahan (Han)'s first birthday. It is designed as a digital extension of the party: guests enter from a QR code on their phones, use those phones as personal quiz controllers, watch a shared Party Screen on a laptop or TV, and leave a message.

This repository has completed its documentation-first foundation review, Milestone 1 runnable scaffold, Milestone 2 visual design-system foundation, Milestone 3 guest entry experience, Milestone 3.5 art-direction polish, Milestone 3.6 shared Party Screen architecture alignment, Milestone 4 local Party Engine implementation, and a Milestone 5 remote-runtime implementation pass. The application now has a React-independent Party Engine, typed host-driven phases, immutable per-question response locking, a timestamp-based countdown, local and Supabase-backed runtime paths, server-authoritative guest/host API routes, production Host Controller route, generated QR lobby, and a focused QA simulation harness.

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

The app scaffold, visual foundation, guest entry experience, art-direction polish, Party Screen architecture alignment, local Party Engine, and Supabase-backed shared-session implementation now exist. The intended architecture is described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), with milestone results recorded in the `docs/MILESTONE_*_REVIEW.md` files.

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
- [content/scaffold.json](content/scaffold.json): temporary diagnostic copy for Milestone 1 route placeholders.

These files intentionally contain no real Han stories, memories, timeline events, photos, or quiz questions.

## Local Development

Install dependencies and run the scaffold:

```bash
npm install
npm run dev
```

Useful validation commands:

```bash
npm run validate:content
npm run typecheck
npm run lint
npm run test
npm run test:supabase
npm run check:visual:milestone5
npm run build
npm run check:visual:milestone4
npm run check:visual:milestone3
npm run check:visual:milestone3.5
```

Current route status:

- `/en` and `/vi`: localized guest onboarding flow.
- `/en/play` and `/vi/play`: guest controller. Uses the Supabase-backed remote runtime when server Supabase env is configured; otherwise falls back to the local Milestone 4 runtime for development.
- `/en/host` and `/vi/host`: production Host Controller with PIN-backed HttpOnly host session.
- `/en/design-system` and `/vi/design-system`: internal visual foundation showcase.
- `/display/party`: shared Party Screen. Uses remote shared session, QR, live counts, and snapshot resync when Supabase env is configured; otherwise falls back to local lobby/question/reveal/leaderboard development behavior.
- `/display/leaderboard`: compatibility redirect to `/display/party`.
- `/en/admin` and `/vi/admin`: admin-route boundary placeholder.
- `/en/qa` and `/vi/qa`: QA-route boundary placeholder.
- `/en/qa/party` and `/vi/qa/party`: local host controls plus Party Screen and guest-controller simulation.

Milestone 5 adds version-controlled Supabase schema, RLS policy intent, server-authoritative host commands, server-authoritative response submission, participant resume cookies, Host PIN session cookies, remote snapshot polling/realtime resync, and QA/production data tagging. Live Supabase RLS/realtime and multi-device rehearsal require configured Supabase credentials and are documented as the remaining environment-dependent approval step.

## Supabase Setup

Create `.env.local` from `.env.example`, set the public Supabase URL/anon key, server-only service role key, host PIN hash/session secret, and public app URL. Apply migrations with Supabase CLI:

```bash
supabase start
supabase db reset
npm run dev
```

Generate the host PIN hash with:

```bash
node -e "console.log(require('crypto').createHash('sha256').update('123456').digest('hex'))"
```

## Development Workflow

1. Review the foundation documents.
2. Confirm product scope, content ownership, and asset availability.
3. Add real content only to external content files after Ian provides it.
4. Build features milestone by milestone from [ROADMAP.md](ROADMAP.md).
5. Validate each milestone through the QA process in [docs/QA.md](docs/QA.md).

## Non-Negotiable Rules

- Do not invent stories, memories, timeline events, quiz answers, or photo descriptions.
- Do not generate fake photos.
- Do not hardcode content in components.
- Use placeholders until Ian provides real assets and copy.
- Keep the birthday experience warmer and more important than implementation convenience.
