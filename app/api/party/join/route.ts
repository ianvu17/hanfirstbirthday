import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createParticipantCookieValue,
  joinActiveParty,
  parseParticipantCookieValue,
  validateParticipantSession,
  loadCurrentPartySession,
  buildRemotePartySnapshot,
  updateParticipantProfile,
} from "@/lib/party-remote/repository";
import { isLocale } from "@/lib/i18n/routing";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const joinSchema = z.object({
  displayName: z.string().min(1).max(80),
  locale: z.string(),
  joinCode: z.string().trim().max(80).optional()
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
    const partySession = await loadCurrentPartySession();

    if (!partySession) {
      return NextResponse.json(
        {
          error: {
            code: "party_not_found",
            message: "No active party session is open yet."
          }
        },
        { status: 404 }
      );
    }

    if (
      parsed.data.joinCode !== undefined &&
      parsed.data.joinCode !== partySession.public_join_code
    ) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_join_code",
            message: "That QR code is not for the current party session."
          }
        },
        { status: 400 }
      );
    }

    const existingParticipant = await validateParticipantSession(partySession.id, existingSession);

    if (existingParticipant) {
      if (partySession.phase === "lobby") {
        const updated = await updateParticipantProfile(existingSession, {
          displayName: parsed.data.displayName,
          locale: parsed.data.locale,
        });

        if (!updated.ok) {
          return NextResponse.json({ error: updated.error }, { status: 400 });
        }

        return NextResponse.json(updated.snapshot);
      }

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
