# Milestone 3.6 Review: Shared Party Screen Architecture Alignment

## Scope

Milestone 3.6 aligned the product, UX, architecture, route responsibility, QA, and handoff documentation around the clarified party model:

- Phone is the personal controller for each guest.
- Desktop/laptop/TV is the shared Party Screen for the room.
- Ian is the host who controls phase transitions.
- The quiz remains timed with an automatic 20-second countdown once each question is opened.

This milestone is documentation and architecture alignment only.

## What Changed

- Added ADR-010 for the phone-controller plus shared Party Screen model.
- Marked the leaderboard-first portion of ADR-006 as superseded.
- Updated the product context and PRD to describe the laptop/TV as the main shared Party Screen.
- Updated UX guidance to distinguish phone responsibilities from Party Screen responsibilities.
- Added shared lifecycle terms for future planning:
  - `LOBBY`
  - `QUESTION_ACTIVE`
  - `QUESTION_LOCKED`
  - `ANSWER_REVEAL`
  - `LEADERBOARD`
  - `NEXT_QUESTION`
  - `FINISHED`
- Updated architecture guidance to plan `/display/party` as the future shared Party Screen route while treating `/display/leaderboard` as a legacy placeholder or redirect candidate.
- Updated QA, asset, UI, roadmap, README, and repository handoff documentation to use Party Screen framing.
- Updated the existing display placeholder copy to say Party Screen foundation instead of leaderboard display.

## Explicitly Not Implemented

No quiz engine, realtime behavior, Supabase schema or client, networking, host controls, live Party Screen runtime, live leaderboard data, admin actions, QA reset tools, production deployment, QR generation, real Han facts, real memories, real photos, or message persistence were implemented.

## Route Responsibility Outcome

- `/{locale}` remains the existing localized guest onboarding flow.
- `/display/leaderboard` remains the existing placeholder route from earlier milestones.
- `/display/party` is now the planned future route for the shared Party Screen.
- `/{locale}/admin` remains a lightweight utility boundary, not a host-control dashboard.
- `/{locale}/qa` remains the QA route boundary.

## Validation

- `npm run validate:content`
- `npm run typecheck`
- `npm run lint`

Visual regression was not required because this milestone made only documentation changes and one placeholder-copy update. No runtime layout or interaction behavior changed.

## Material Assumptions

- Ian remains the intended host for event-day phase control.
- Host controls should be minimal and event-specific.
- Party Screen implementation will occur after the architecture is approved, not during Milestone 3.6.
- The legacy `/display/leaderboard` route can remain in place until a future milestone adds `/display/party` or redirects the old path.

## Self-Review

Product Manager: The milestone protects the clarified party vision by making the desktop/laptop the main shared experience, not a secondary scoreboard.

Software Architect: The architecture now names shared lifecycle phases and route responsibilities without prematurely choosing Supabase tables, realtime mechanics, or host-control implementation.

Frontend Lead: Future frontend work has clear separation between phone controller UI, Party Screen UI, admin utility UI, and QA UI.

UX Designer: The phone stays focused on individual guest actions while the shared screen can entertain the whole room.

Art Director: Party Screen guidance preserves the warm birthday stage direction and avoids reducing the display to a utilitarian ranking table.

QA Lead: QA expectations now include Party Screen legibility, shared lifecycle behavior, and future host-paced run-of-show checks.

## Remaining Risks

- The actual `/display/party` route is not built yet.
- Host-control access and implementation details are still undecided.
- Realtime or fallback synchronization strategy remains future work.
- The quiz engine must now be implemented without accidentally duplicating Party Screen behavior on phones.
