# AI Agent Roles

This repository is expected to be built over many AI-assisted iterations. Agents must read [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) first, then consult [DECISIONS.md](DECISIONS.md), the role guidance below, and the relevant document for the task.

## Mandatory Workflow

Before making a change, every agent must:

1. Read [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).
2. Read [DECISIONS.md](DECISIONS.md).
3. Read the task-relevant documentation.
4. Inspect the current repository state.
5. State material assumptions.
6. Stay within requested scope.
7. Validate relevant behavior.
8. Update documentation when approved behavior changes.

## Documentation Precedence

When guidance conflicts, use this order:

1. Ian's most recent explicit instruction.
2. [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).
3. [DECISIONS.md](DECISIONS.md).
4. [docs/PRD.md](docs/PRD.md).
5. [docs/UX.md](docs/UX.md).
6. [docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md).
7. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
8. [docs/CONTENT.md](docs/CONTENT.md).
9. [docs/ASSETS.md](docs/ASSETS.md).
10. [docs/QA.md](docs/QA.md).
11. [ROADMAP.md](ROADMAP.md).
12. Existing implementation.

Future agents must not silently resolve material conflicts. Record the conflict and ask for clarification when it changes product behavior.

## Shared Definition Of Done

Where applicable, a task is not complete until:

- Type checking passes.
- Linting passes.
- Relevant tests pass.
- English and Vietnamese behavior is verified.
- Mobile layout is verified.
- Missing assets degrade gracefully.
- No Han facts or memories are invented.
- Question locking behavior is preserved.
- QA/test data remains separate.
- Documentation is updated.
- The agent reports changed files, validation, assumptions, and risks.

## Multi-Role Self-Review

Before completion, the executing agent must review its work through these lenses:

- Product Manager.
- Software Architect.
- Frontend Lead.
- UX Designer.
- Art Director.
- QA Lead.

This is a structured self-review. It does not require multiple spawned agents.

## Product Manager

### Mission

Protect the birthday experience, product scope, and guest value. Ensure each feature serves the party, the family, and the memory-preservation purpose.

### Responsibilities

- Maintain the product vision in [docs/PRD.md](docs/PRD.md).
- Clarify feature priority and release milestones in [ROADMAP.md](ROADMAP.md).
- Verify that real content is provided by Ian before it is used.
- Keep the MVP small enough to be reliable at the event.
- Prevent generic quiz-site behavior from replacing the party-specific experience.

### Review Checklist

- Does this serve guests at the birthday party?
- Does this preserve or support a memory?
- Is any content invented or assumed?
- Is the scope appropriate for the next milestone?
- Is the bilingual experience treated as core, not optional?

## Software Architect

### Mission

Design a reliable, maintainable system that supports mobile guests, a live leaderboard display, bilingual content, and future memory features without overengineering.

### Responsibilities

- Maintain [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [DECISIONS.md](DECISIONS.md).
- Define data ownership across JSON content, Supabase, and runtime state.
- Ensure deployment compatibility with Vercel and Supabase.
- Design for per-question immutable quiz responses and real-time leaderboard updates.
- Keep implementation choices aligned with the approved stack.

### Review Checklist

- Is content externalized and localizable?
- Does the data model prevent duplicate question responses?
- Can the leaderboard update for a room of about 10 guests?
- Are admin and QA capabilities separated from guest flows?
- Are decisions documented when they affect long-term maintainability?

## Frontend Lead

### Mission

Build the application experience with mobile-first reliability, accessible interactions, and polished motion while staying faithful to the design language.

### Responsibilities

- Implement screens defined in [docs/UX.md](docs/UX.md).
- Use the visual system in [docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md).
- Keep UI copy and structured content out of components.
- Ensure all interactions work on guest phones.
- Keep the TV leaderboard legible from across a room.

### Review Checklist

- Does the mobile experience fit small screens comfortably?
- Does the page feel like a birthday extension rather than a form?
- Are loading, empty, and error states present?
- Is motion purposeful and respectful of performance?
- Are component choices consistent with shadcn/ui and Tailwind conventions?

## UX Designer

### Mission

Shape the guest journey so the experience feels simple, festive, emotionally warm, and easy to complete during a live party.

### Responsibilities

- Maintain flow, screen, and state guidance in [docs/UX.md](docs/UX.md).
- Keep the quiz fast and understandable.
- Design graceful recovery for weak connection, duplicate attempts, and incomplete input.
- Balance celebration with clarity.
- Ensure English and Vietnamese flows are equally complete.

### Review Checklist

- Can a guest understand what to do in seconds?
- Are transitions and confirmations clear?
- Does the flow avoid awkward dead ends?
- Are errors written with warmth and directness?
- Does the experience still work when content is incomplete?

## Art Director

### Mission

Translate the birthday backdrop's design language into a premium digital interface without copying it literally.

### Responsibilities

- Maintain [docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md) and [docs/ASSETS.md](docs/ASSETS.md).
- Preserve the warm cream, blue, yellow, orange, cow-themed, paper-cut party atmosphere.
- Guide illustration, shape, icon, motion, and asset style.
- Prevent generic gradients, stock birthday visuals, or overly corporate UI.
- Ensure placeholders are clearly replaceable and do not imply real memories.

### Review Checklist

- Does the interface feel handmade, layered, warm, and premium?
- Are rounded shapes and soft shadows used intentionally?
- Does the palette avoid drifting into unrelated themes?
- Are visual assets real, provided, or clearly placeholders?
- Is the cow theme subtle and celebratory rather than cartoonish overload?

## QA Lead

### Mission

Protect the event-day experience through practical test coverage, preview checks, device testing, and deployment readiness.

### Responsibilities

- Maintain [docs/QA.md](docs/QA.md).
- Define milestone acceptance checks.
- Verify question locking behavior, timer behavior, localization, and leaderboard updates.
- Coordinate QA mode and test data reset expectations.
- Validate Vercel preview and production readiness.

### Review Checklist

- Has the critical guest path been tested on mobile?
- Has the TV leaderboard been tested on the target display size?
- Can QA data be separated from event data?
- Are error and offline states tested?
- Is the production deployment ready before the party day?
