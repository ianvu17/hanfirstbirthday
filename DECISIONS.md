# Architecture Decision Records

This document records accepted decisions only. Proposed ideas should be captured in the relevant planning document until accepted.

## ADR-001: Documentation-First Foundation

**Decision**

Begin with project documentation, AI context, placeholder content schemas, and planning documents before creating application code.

**Status**

Accepted.

**Reason**

The project will be built over many iterations and must remain emotionally specific, content-safe, and consistent across future AI-assisted work.

**Consequence**

Implementation is intentionally delayed until the foundation is reviewed. Future contributors should start with [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) and the docs folder.

## ADR-002: Next.js App Router Target Stack

**Decision**

Use Next.js App Router with TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Supabase, next-intl, and Vercel.

**Status**

Accepted.

**Reason**

This stack supports mobile-first web delivery, localization, server-rendered routes, reusable UI primitives, tasteful animation, real-time data, and Vercel deployment.

**Consequence**

Architecture and future implementation should align with this stack. Alternative frameworks or hosting targets require a new ADR.

## ADR-003: Externalized Content Only

**Decision**

All content-related data must live in external content files or Supabase records. Components must not hardcode Han facts, copy, timeline entries, photo metadata, quiz questions, or message content.

**Status**

Accepted.

**Reason**

The project must never invent or accidentally bake in family memories. Externalized content keeps localization, review, and updates safer.

**Consequence**

Future implementation must load copy and structured content from content files or Supabase. Placeholder schemas are allowed until Ian provides real content.

## ADR-004: Bilingual Experience As Core Scope

**Decision**

Support English and Vietnamese as first-class locales from the beginning.

**Status**

Accepted.

**Reason**

The birthday audience includes guests who may prefer either language. Language support is part of the hospitality of the experience.

**Consequence**

Routes, content models, QA, and UI layouts must account for both languages. Missing translations should be treated as release blockers for guest-facing flows.

## ADR-005: Supabase For Runtime Event Data

**Decision**

Use Supabase for participant records, quiz attempts, immutable question responses, messages, minimal admin data, QA/test separation, and leaderboard updates.

**Status**

Accepted.

**Reason**

The project needs lightweight persistence, real-time updates, and a deployable backend compatible with Vercel.

**Consequence**

The architecture should define Supabase tables, constraints, policies, and real-time subscriptions before implementation.

## ADR-006: Mobile-First Guest Flow With TV Leaderboard

**Decision**

Optimize guest interaction for mobile phones and provide a separate display route for the live leaderboard.

**Status**

Accepted.

**Reason**

Guests will access the experience through QR code on personal phones while a laptop or TV displays shared party progress.

**Consequence**

Responsive design and QA must cover phone screens and large display screens as distinct experiences.

## ADR-007: Per-Question Immutable Responses

**Context**

The quiz has a 20-second timer per question and guests answer one question at a time. Earlier wording could be interpreted as keeping all answers editable until the whole quiz is completed.

**Decision**

Each question has its own question response. Once the server accepts a submitted answer, that response is permanently locked. If the timer expires before a valid answer is submitted, the question response is locked as timed out. The final score is calculated from all locked question responses in the completed quiz attempt.

**Status**

Accepted.

**Reason**

Per-question locking matches the live party quiz experience, makes timer behavior clear, supports reveal states and fun facts after each question, and keeps retry handling small enough for a family birthday game.

**Consequence**

Future implementation must enforce one accepted question response per quiz attempt per question. Retried requests must be idempotent and must not create duplicate responses or reopen locked answers. There is no editable end-of-quiz review of all answers.

**Rejected Alternatives**

- Keep all answers editable and submit the complete quiz at the end.
- Add examination-level identity verification or anti-cheating systems.

## ADR-008: Minimal Admin MVP

**Context**

Ian is not expected to use admin tools frequently. Admin functionality exists to support event-day confidence and QA, not to become a content platform.

**Decision**

Admin MVP is a small utility area. It may view guest names and final quiz scores, view submitted birthday messages, view the current leaderboard, distinguish QA/test data from real event data, remove or reset incorrect test records or quiz attempts when necessary, open or link to the TV leaderboard, and optionally show a simple readiness summary.

**Status**

Accepted.

**Reason**

Minimal admin scope protects the guest MVP, reduces party-day risk, and keeps content ownership file-driven for the first release.

**Consequence**

Admin implementation should be clear and visually consistent, but it does not require the same decorative intensity as guest-facing screens. It must not block guest MVP work.

**Deferred Capabilities**

- CMS or content editor.
- Visual quiz editor.
- Translation editor.
- Media upload manager.
- Advanced analytics dashboard.
- Complex moderation workflow.
- Role-management system.
- Reusable admin platform.

## ADR-009: Bilingual Typography Pairing For Visual Foundation

**Decision**

Use Baloo 2 as the expressive display font and Be Vietnam Pro as the primary body/UI font, loaded through `next/font/google` with Latin and Vietnamese subsets.

**Status**

Accepted.

**Reason**

Milestone 2 requires a playful title treatment and a highly legible body font that both support Vietnamese diacritics. Baloo 2 provides rounded, party-appropriate display shapes without requiring local font assets. Be Vietnam Pro keeps body copy, buttons, admin labels, and longer Vietnamese strings readable on phones.

**Consequence**

Future UI work should use the display font for celebratory headings and title moments only, and use Be Vietnam Pro for body, forms, controls, admin, QA, and leaderboard supporting text. Any future font change must preserve Vietnamese rendering, mobile readability, and build reliability.
