import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isLocale } from "@/lib/i18n/routing";
import {
  parseParticipantCookieValue,
  updateParticipantProfile,
} from "@/lib/party-remote/repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const profileSchema = z
  .object({
    displayName: z.string().max(80).optional(),
    locale: z.string().optional(),
  })
  .refine(
    (value) => value.displayName !== undefined || value.locale !== undefined,
  );

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: { code: "supabase_not_configured", message: "Remote profile updates are unavailable." } },
      { status: 503 },
    );
  }

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));

  if (
    !parsed.success ||
    (parsed.data.locale !== undefined && !isLocale(parsed.data.locale))
  ) {
    return NextResponse.json(
      { error: { code: "invalid_locale", message: "Please check your profile details." } },
      { status: 400 },
    );
  }

  try {
    const cookieStore = await cookies();
    const participantSession = parseParticipantCookieValue(
      cookieStore.get("han_participant_session")?.value,
    );
    const result = await updateParticipantProfile(participantSession, {
      displayName: parsed.data.displayName,
      locale:
        parsed.data.locale !== undefined && isLocale(parsed.data.locale)
          ? parsed.data.locale
          : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "temporary_server_failure",
          message: error instanceof Error ? error.message : "Could not update the profile.",
        },
      },
      { status: 500 },
    );
  }
}
