import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { PartySessionQuestionCountError } from "@/lib/party-engine";
import { verifyHostSessionCookie } from "@/lib/party-remote/host-auth";
import {
  archivePartySession,
  buildRemotePartySnapshot,
  createPartySession,
  listSessionHistory,
} from "@/lib/party-remote/repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const createSchema = z.object({
  action: z.literal("create"),
  idempotencyKey: z.string().min(8).max(160),
  questionCount: z.number().int().min(1),
  label: z.string().trim().max(80).optional(),
  archiveExisting: z.boolean().optional(),
});

const archiveSchema = z.object({
  action: z.literal("archive"),
  sessionId: z.string().uuid(),
});

const mutationSchema = z.discriminatedUnion("action", [
  createSchema,
  archiveSchema,
]);

async function requireHost() {
  const cookieStore = await cookies();
  return verifyHostSessionCookie(cookieStore.get("han_host_session")?.value);
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "supabase_not_configured",
          message: "Supabase is not configured for party sessions.",
        },
      },
      { status: 503 },
    );
  }

  if (!(await requireHost())) {
    return NextResponse.json(
      {
        error: {
          code: "host_unauthorized",
          message: "Please unlock the host controller again.",
        },
      },
      { status: 401 },
    );
  }

  try {
    return NextResponse.json({
      current: await buildRemotePartySnapshot(),
      recentSessions: await listSessionHistory(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "temporary_server_failure",
          message:
            error instanceof Error
              ? error.message
              : "Could not load party sessions.",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "supabase_not_configured",
          message: "Supabase is not configured for party sessions.",
        },
      },
      { status: 503 },
    );
  }

  if (!(await requireHost())) {
    return NextResponse.json(
      {
        error: {
          code: "host_unauthorized",
          message: "Please unlock the host controller again.",
        },
      },
      { status: 401 },
    );
  }

  const input = await request.json().catch(() => null);
  const parsed = mutationSchema.safeParse(input);

  if (!parsed.success) {
    const invalidQuestionCount =
      typeof input === "object" &&
      input !== null &&
      "action" in input &&
      input.action === "create";
    return NextResponse.json(
      {
        error: {
          code: invalidQuestionCount
            ? "invalid_question_count"
            : "invalid_transition",
          message: invalidQuestionCount
            ? "Question count must be a whole number within the approved question set."
            : "That session action is not available.",
        },
      },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.action === "create") {
      await createPartySession(parsed.data.idempotencyKey, {
        label: parsed.data.label,
        archiveExisting: parsed.data.archiveExisting ?? false,
        questionCount: parsed.data.questionCount,
      });
    } else {
      await archivePartySession(parsed.data.sessionId);
    }

    return NextResponse.json({
      current: await buildRemotePartySnapshot(),
      recentSessions: await listSessionHistory(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not update party sessions.";
    const activeExists = message.includes("active_session_exists");
    const invalidQuestionCount =
      error instanceof PartySessionQuestionCountError ||
      message.includes("invalid_question_count");

    return NextResponse.json(
      {
        error: {
          code: invalidQuestionCount
            ? "invalid_question_count"
            : activeExists
              ? "invalid_transition"
              : "temporary_server_failure",
          message: invalidQuestionCount
            ? message
            : activeExists
              ? "A current session already exists. Archive it before creating another."
              : message,
        },
      },
      { status: invalidQuestionCount ? 400 : activeExists ? 409 : 500 },
    );
  }
}
