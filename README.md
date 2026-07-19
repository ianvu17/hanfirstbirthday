# Han Birthday Experience

Public title: **WHO IS TURNING ONE?!**

Han Birthday Experience is a premium interactive web experience for Callahan (Han)'s first birthday. It is designed as a digital extension of the party: guests enter from a QR code on their phones, use those phones as personal quiz controllers, watch a shared Party Screen on a laptop or TV, and leave a message.

This repository has completed its documentation-first foundation review, Milestone 1 runnable scaffold, Milestone 2 visual design-system foundation, Milestone 3 guest entry experience, Milestone 3.5 art-direction polish, Milestone 3.6 shared Party Screen architecture alignment, Milestone 4 local Party Engine implementation, and a Milestone 5 remote-runtime implementation pass. The application now has a React-independent Party Engine, typed host-driven phases, immutable per-question response locking, a timestamp-based countdown, local and Supabase-backed runtime paths, server-authoritative guest/host API routes, production Host Controller route, generated QR lobby, stabilized realtime status feedback, and a focused QA simulation harness.

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

Milestone 5 adds version-controlled Supabase schema, RLS policies, server-authoritative host commands, server-authoritative response submission, participant resume cookies, Host PIN session cookies, remote snapshot polling/realtime resync, and QA/production data tagging. The current host question flow is Start Game, Reveal Answers, automatic deadline closure, Reveal Correct Answer, Show Leaderboard, then Continue/Next/Finish. Hosted Supabase migrations, live anon RLS validation, Vercel preview deployment, and browser-context realtime rehearsal have passed; physical laptop/two-phone rehearsal, real Host PIN entry rehearsal, final production activation review, and production QR origin verification remain.

## Supabase Setup

Create `.env.local` from `.env.example`, set the public Supabase URL/anon key, server-only service role key, host PIN hash/session secret, and public app URL. Keep preview/local validation on `PARTY_SESSION_IS_TEST=true`. That flag is metadata for rehearsal/test rows only; current session selection is scoped by `PARTY_KEY`, `PARTY_DEPLOYMENT_ENVIRONMENT` or `VERCEL_ENV`, and the database `is_current` flag.

To create a safe local skeleton and generate a missing `HOST_SESSION_SECRET` without printing it:

```bash
npm run prepare:milestone5-env
```

The script leaves Supabase credentials and the host PIN blank for Ian to fill.

For the hosted Supabase project, link the project and apply migrations with:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list
```

Do not run `supabase db reset` against the hosted project.

For local-only Supabase development, use the local CLI lifecycle:

```bash
npx supabase start
npx supabase db reset
npm run dev
```

Generate the host PIN hash without storing the raw PIN in the command history:

```bash
read -s HOST_PIN
HOST_PIN="$HOST_PIN" node -e "console.log(require('crypto').createHash('sha256').update(process.env.HOST_PIN).digest('hex'))"
```

Run static migration checks with `npm run test:supabase`. After hosted env values are configured, run live anon-policy validation with `npm run test:rls:live`.

After Vercel CLI login and project linking, preview environment variables can be pushed from `.env.local` without printing values:

```bash
npm run vercel:push-env -- --target=preview --dry-run
npm run vercel:push-env -- --target=preview
```

For preview, the helper skips a localhost `NEXT_PUBLIC_APP_URL` so Vercel's `VERCEL_URL` fallback can generate QR links for the actual deployment origin. To force an explicit deployed origin, set `VERCEL_NEXT_PUBLIC_APP_URL` for that one command.

Deploy a preview with:

```bash
npx vercel deploy --yes
```

Do not pass `--target=preview`; the default CLI deployment is preview. A `.vercelignore` file keeps `.env.local`, `.vercel`, `.next`, `node_modules`, `supabase/.temp`, and TypeScript build info out of deployment uploads.

For browser-context realtime rehearsal against hosted Supabase, start an isolated local server with a validation join code:

```bash
PARTY_JOIN_CODE=codex-m5-... NEXT_PUBLIC_APP_URL=http://localhost:3001 PARTY_SESSION_IS_TEST=true npm run dev -- -p 3001
LIVE_REALTIME_BASE_URL=http://localhost:3001 LIVE_REALTIME_JOIN_CODE=codex-m5-... npm run test:realtime:live
```

To validate the real Host PIN unlock route during that rehearsal, provide the PIN through a silent shell prompt instead of putting it in command history:

```bash
read -s LIVE_REALTIME_HOST_PIN
LIVE_REALTIME_HOST_PIN="$LIVE_REALTIME_HOST_PIN" LIVE_REALTIME_BASE_URL=http://localhost:3001 LIVE_REALTIME_JOIN_CODE=codex-m5-... npm run test:realtime:live
```

Use a `codex-m5-*` join code so cleanup can safely remove only validation-owned rows.

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
