import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createParticipantCookieValue,
  joinActiveParty,
  parseParticipantCookieValue,
  validateParticipantSession,
  ensureActivePartySession,
  buildRemotePartySnapshot
} from "@/lib/party-remote/repository";
import { isLocale } from "@/lib/i18n/routing";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const joinSchema = z.object({
  displayName: z.string().min(1).max(80),
  locale: z.string()
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "supabase_not_configured",
          message: "Supabase is not configured for joining."
        }
      },
      { status: 503 }
    );
  }

  const parsed = joinSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || !isLocale(parsed.data.locale)) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_locale",
          message: "Please choose English or Vietnamese."
        }
      },
      { status: 400 }
    );
  }

  try {
    const cookieStore = await cookies();
    const existingSession = parseParticipantCookieValue(
      cookieStore.get("han_participant_session")?.value
    );
    const partySession = await ensureActivePartySession();
    const existingParticipant = await validateParticipantSession(partySession.id, existingSession);

    if (existingParticipant) {
      return NextResponse.json(await buildRemotePartySnapshot(existingSession));
    }

    const result = await joinActiveParty(parsed.data.displayName, parsed.data.locale);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    cookieStore.set(
      "han_participant_session",
      createParticipantCookieValue(result.participant.id, result.token),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7
      }
    );

    return NextResponse.json(result.snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "temporary_server_failure",
          message: error instanceof Error ? error.message : "Could not join the party."
        }
      },
      { status: 500 }
    );
  }
}
