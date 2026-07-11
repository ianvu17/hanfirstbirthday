# Project Philosophy

## Core Principle

Han Birthday Experience exists to preserve memories. The product should feel like part of the birthday celebration, not like technology placed on top of it.

When in doubt, reduce software friction and increase emotional clarity.

## Experience Principles

- Make guests feel welcomed within seconds.
- Treat bilingual support as a first-class part of hospitality.
- Keep the quiz playful, fast, and low-pressure.
- Make the leaderboard celebratory rather than harshly competitive.
- Let guests leave messages without feeling like they are filling out a form.
- Use placeholders honestly when real content is not available.
- Protect the event from confusing flows, dead ends, and fragile dependencies.

## Design Principles

- Draw inspiration from the birthday backdrop without recreating it literally.
- Use rounded shapes, soft layering, warm cream surfaces, and joyful accents.
- Keep the cow theme warm and tasteful.
- Favor premium children's party styling over generic cartoon birthday styling.
- Make UI controls clear, large enough for phones, and calm under motion.
- Use animation to create delight and guide attention, not to show off.

## Content Principles

- Real stories must come from Ian or another approved source.
- Never invent memories, milestones, facts, quiz answers, or captions.
- Keep all content externalized for localization and future updates.
- Preserve the same meaning across English and Vietnamese.
- Use schema placeholders until real content is available.

## Technical Principles

- Build for event reliability first.
- Keep guest flows simple and fast.
- Separate static content, runtime data, and presentation.
- Prefer clear data models over clever shortcuts.
- Document decisions that shape future work.
- Avoid implementation work until the documentation foundation is reviewed.

## Decision Principles

Use this priority order when tradeoffs appear:

1. User experience
2. Emotional experience
3. Maintainability
4. Developer convenience

Examples:

- If a technically simpler interaction feels awkward during the party, choose the clearer guest experience.
- If a clever abstraction makes content harder to review, choose the simpler content workflow.
- If animation hurts performance on phones, reduce the animation.

## What Not To Build

- A generic trivia or quiz platform.
- A competitive game that overshadows the birthday.
- Fake memories, fake photos, fake captions, or invented Han stories.
- A content system that requires editing source components for party copy.
- A visually literal copy of the birthday backdrop.
- A dense admin product that consumes time better spent preparing the event.
- Features that require guests to create accounts.
- Anything that cannot be tested before party day.
