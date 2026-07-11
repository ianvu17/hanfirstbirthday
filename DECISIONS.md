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

Use Supabase for participant records, quiz attempts, answers, messages, admin data, QA/test separation, and leaderboard updates.

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
