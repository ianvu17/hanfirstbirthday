import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  parseParticipantCookieValue,
  setParticipantReadiness,
} from "@/lib/party-remote/repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const readinessSchema = z.object({ isReady: z.boolean() });

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: { code: "supabase_not_configured", message: "Remote readiness is unavailable." } },
      { status: 503 },
    );
  }

  const parsed = readinessSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "invalid_participant_session", message: "Please choose a readiness state." } },
      { status: 400 },
    );
  }

  try {
    const cookieStore = await cookies();
    const participantSession = parseParticipantCookieValue(
      cookieStore.get("han_participant_session")?.value,
    );
    const result = await setParticipantReadiness(
      participantSession,
      parsed.data.isReady,
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "temporary_server_failure",
          message: error instanceof Error ? error.message : "Could not update readiness.",
        },
      },
      { status: 500 },
    );
  }
}
