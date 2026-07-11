# Project Context

## One-File Briefing

Han Birthday Experience is a premium, bilingual, mobile-first web experience for Callahan (Han)'s first birthday. The public title is **WHO IS TURNING ONE?!** The experience will be accessed by guests through a QR code at the party. Around 10 guests are expected to play on their own phones while a laptop or TV displays a live leaderboard.

This is not a generic quiz website. It is a digital extension of the birthday party, designed to make guests smile, help them learn fun facts about Han, and preserve memories through messages, photos, and future timeline content.

## Primary Goals

- Create a warm party experience that feels personal, premium, and easy to use.
- Support English and Vietnamese guests equally.
- Let guests play a short quiz with a 20-second timer per question.
- Submit and lock one response per question, including timed-out responses.
- Prevent duplicate question responses during safe retries.
- Display a live leaderboard for the room.
- Let guests leave a birthday message.
- Reserve space for timeline and gallery features without inventing content.
- Support lightweight admin and QA workflows so the event can be tested safely before launch.

## Target Audience

- Family and friends attending Han's first birthday.
- Guests using personal mobile phones, likely in a social environment with distractions.
- A host or admin checking event readiness, scores, messages, leaderboard access, and QA/test separation.
- Viewers watching a laptop or TV leaderboard during the party.

## Experience Goals

- Guests should understand the flow immediately after scanning the QR code.
- The interface should feel like part of the birthday setup, not a separate software product.
- The quiz should feel playful, short, and celebratory.
- The leaderboard should add energy without making the experience overly competitive.
- Message leaving should feel meaningful and low-pressure.
- Placeholder timeline and gallery areas should signal future memories without fabricating them.

## Design Direction

The birthday backdrop provides the visual reference. The UI should not copy the backdrop literally. It should extract the design language:

- Warm cream background.
- Blue, yellow, and orange palette.
- Rounded shapes.
- Layered paper-cut feeling.
- Handmade decorations.
- Premium children's party mood.
- Cow theme.
- Soft celebration atmosphere.

## Technical Direction

Planned stack:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Framer Motion.
- Supabase.
- next-intl.
- Vercel.

Architecture should separate:

- Static structured content in locale JSON files.
- Runtime event data in Supabase.
- UI components from content strings.
- Guest routes from admin, QA, and display routes.

Admin MVP must stay small: scores, messages, leaderboard view/link, QA/test separation, necessary test resets, and optional simple readiness summary.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the planned technical design.

## Constraints

- Documentation-first workflow: Milestone 0 foundation review is complete; next implementation work is limited to Milestone 1 scaffolding unless Ian explicitly reprioritizes.
- Do not invent stories, memories, quiz facts, timeline events, images, or photo descriptions.
- Do not hardcode content in components.
- All content-related data must come from external data files or Supabase records.
- Use placeholders until Ian provides real assets and copy.
- Mobile-first is mandatory.
- Bilingual support is mandatory.
- The event-day experience must be reliable with a small group of about 10 guests.

## Decision Priority

If decisions conflict, use this order:

1. User experience
2. Emotional experience
3. Maintainability
4. Developer convenience

## Current Repository State

The repository currently contains project documentation, AI guidance, and placeholder content schemas only. It intentionally does not contain Next.js application code, package configuration, generated assets, Supabase migrations, or UI components.
