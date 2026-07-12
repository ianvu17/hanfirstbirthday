import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  parseParticipantCookieValue,
  submitRemoteResponse
} from "@/lib/party-remote/repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const responseSchema = z.object({
  selectedOptionId: z.string().min(1),
  submissionId: z.string().min(1).max(160)
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "supabase_not_configured",
          message: "Supabase is not configured for response submission."
        }
      },
      { status: 503 }
    );
  }

  const parsed = responseSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "question_not_active",
          message: "Please choose an answer before submitting."
        }
      },
      { status: 400 }
    );
  }

  try {
    const cookieStore = await cookies();
    const participantSession = parseParticipantCookieValue(
      cookieStore.get("han_participant_session")?.value
    );
    const result = await submitRemoteResponse(
      participantSession,
      parsed.data.selectedOptionId,
      parsed.data.submissionId
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json(result.snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "temporary_server_failure",
          message: error instanceof Error ? error.message : "Could not submit that answer."
        }
      },
      { status: 500 }
    );
  }
}
