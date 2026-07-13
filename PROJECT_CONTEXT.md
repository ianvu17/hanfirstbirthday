# Project Context

## One-File Briefing

Han Birthday Experience is a premium, bilingual, mobile-first web experience for Callahan (Han)'s first birthday. The public title is **WHO IS TURNING ONE?!** The experience will be accessed by guests through a QR code at the party. Around 10 guests are expected to use their own phones as personal controllers while a laptop or TV acts as the shared Party Screen for everyone in the room.

This is not a generic quiz website. It is a digital extension of the birthday party, designed to make guests smile, help them learn fun facts about Han, and preserve memories through messages, photos, and future timeline content.

## Primary Goals

- Create a warm party experience that feels personal, premium, and easy to use.
- Support English and Vietnamese guests equally.
- Let guests play a short quiz with a 20-second timer per question.
- Submit and lock one response per question, including timed-out responses.
- Prevent duplicate question responses during safe retries.
- Make the shared Party Screen part of the birthday entertainment, including lobby, question, reveal, fun fact, leaderboard, and finished moments.
- Let guests leave a birthday message.
- Reserve space for timeline and gallery features without inventing content.
- Support lightweight admin and QA workflows so the event can be tested safely before launch.

## Target Audience

- Family and friends attending Han's first birthday.
- Guests using personal mobile phones, likely in a social environment with distractions.
- Ian or a trusted host pacing the shared game from a lightweight control surface.
- A host or admin checking event readiness, scores, messages, Party Screen access, and QA/test separation.
- Viewers watching the laptop or TV Party Screen during the party, including people who may never touch a phone.

## Experience Goals

- Guests should understand the flow immediately after scanning the QR code.
- The interface should feel like part of the birthday setup, not a separate software product.
- The quiz should feel playful, short, and celebratory.
- The Party Screen should add energy, guide the room through the game, and make answer reveals and fun facts enjoyable even for non-playing guests.
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

The birthday game is host-driven, not autonomous. Ian controls phase transitions such as Start Game, Open Question, Reveal Answer, Show Fun Fact, Show Leaderboard, and Next Question. Each opened question still has an automatic 20-second countdown.

Admin and future host controls must stay small: scores, messages, Party Screen view/link, QA/test separation, necessary test resets, optional simple readiness summary, and lightweight game controls such as Start Game, Next, Reveal, and Pause when that milestone is approved.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the planned technical design.

## Constraints

- Documentation-first workflow: Milestones 0, 1, 2, 3, 3.5, 3.6, and 4 are complete. Milestone 5 has an implementation pass for Supabase-backed shared sessions, server-authoritative host/guest routes, production Host Controller, generated QR lobby, participant resume, remote snapshot resync, and QA/production data tagging. Hosted Supabase migrations, live RLS validation, Vercel preview deployment, and browser-context realtime rehearsal have passed; physical laptop/two-phone rehearsal, real Host PIN entry rehearsal, final production environment setup, and production QR origin verification remain.
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

The repository currently contains project documentation, AI guidance, localized onboarding copy, a Milestone 1 Next.js scaffold, the completed Milestone 2 visual foundation, the implemented Milestone 3 guest entry experience, Milestone 3.5 art-direction polish, Milestone 3.6 Party Screen architecture alignment, the Milestone 4 local Party Engine, and Milestone 5 remote runtime infrastructure. It includes App Router route boundaries, bilingual locale routing, content validation, centralized Tailwind/CSS design tokens, Baloo 2 and Be Vietnam Pro typography, paper-cut visual primitives, richer party-scene motifs, a layered title lockup, a reusable Han photo frame placeholder, reduced-motion-aware motion patterns, a localized internal design-system showcase at `/en/design-system` and `/vi/design-system`, a session-only guest onboarding flow at `/en` and `/vi`, a guest controller at `/{locale}/play`, a production Host Controller at `/{locale}/host`, a shared Party Screen at `/display/party`, a compatibility redirect from `/display/leaderboard`, and a local QA party harness at `/{locale}/qa/party`.

The localized guest root routes implement Welcome, Language, Guest Name, How to Play, and Ready, then hand off to the guest controller. The Party Engine is React-independent and uses development-only bilingual fixtures until real quiz content is approved. The project intentionally does not yet contain real Han content, messages, gallery, timeline, production deployment configuration, full admin actions, or completed live-device approval evidence.
