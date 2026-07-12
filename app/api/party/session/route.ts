import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildRemotePartySnapshot, parseParticipantCookieValue } from "@/lib/party-remote/repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        error: {
          code: "supabase_not_configured",
          message: "Supabase is not configured for the remote party runtime."
        }
      },
      { status: 503 }
    );
  }

  try {
    const cookieStore = await cookies();
    const participantSession = parseParticipantCookieValue(
      cookieStore.get("han_participant_session")?.value
    );

    return NextResponse.json(await buildRemotePartySnapshot(participantSession));
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "temporary_server_failure",
          message: error instanceof Error ? error.message : "Could not load the party session."
        }
      },
      { status: 500 }
    );
  }
}
