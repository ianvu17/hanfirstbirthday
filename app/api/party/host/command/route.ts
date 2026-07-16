import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyHostSessionCookie } from "@/lib/party-remote/host-auth";
import { runHostCommand } from "@/lib/party-remote/repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const commandSchema = z.object({
  type: z.enum([
    "PREPARE_FIRST_QUESTION",
    "REVEAL_CHOICES",
    "REVEAL_ANSWER",
    "SHOW_LEADERBOARD",
    "ADVANCE_FROM_LEADERBOARD",
    "COMPLETE_PRESENTATION",
    "PREPARE_NEXT_QUESTION",
    "FINISH_PARTY"
  ]),
  expectedRevision: z.number().int().nonnegative(),
  commandId: z.string().min(1).max(120)
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "supabase_not_configured",
          message: "Supabase is not configured for host commands."
        }
      },
      { status: 503 }
    );
  }

  const cookieStore = await cookies();

  if (!verifyHostSessionCookie(cookieStore.get("han_host_session")?.value)) {
    return NextResponse.json(
      {
        error: {
          code: "host_unauthorized",
          message: "Please unlock the host controller again."
        }
      },
      { status: 401 }
    );
  }

  const parsed = commandSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_transition",
          message: "That host action is not available."
        }
      },
      { status: 400 }
    );
  }

  try {
    const result = await runHostCommand(
      { type: parsed.data.type },
      parsed.data.expectedRevision,
      parsed.data.commandId
    );

    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "temporary_server_failure",
          message: error instanceof Error ? error.message : "Could not run that host command."
        }
      },
      { status: 500 }
    );
  }
}
