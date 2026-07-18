import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { PageShell } from "@/components/design/page-shell";
import { GuestPlayClient } from "@/components/party/guest-play-client";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import {
  buildGuestPlayPath,
  buildGuestWelcomePath,
  normalizeJoinCode
} from "@/lib/party-remote/join-routing";
import {
  buildRemotePartySnapshot,
  parseParticipantCookieValue
} from "@/lib/party-remote/repository";
import type { RemoteGuestSnapshot } from "@/lib/party-remote/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function GuestPlayPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ join?: string | string[] }>;
}) {
  const { locale: localeParam } = await params;
  const { join } = await searchParams;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  setRequestLocale(locale);
  const remoteEnabled = isSupabaseConfigured();
  const joinCode = normalizeJoinCode(join);

  if (remoteEnabled) {
    const cookieStore = await cookies();
    const participantSession = parseParticipantCookieValue(
      cookieStore.get("han_participant_session")?.value
    );
    const snapshot = participantSession
      ? await buildRemotePartySnapshot(participantSession)
      : null;
    const guestSnapshot =
      snapshot && "participant" in snapshot
        ? (snapshot as RemoteGuestSnapshot)
        : null;
    const hasParticipant =
      Boolean(snapshot?.session) &&
      Boolean(guestSnapshot?.participant);

    if (!hasParticipant) {
      redirect(buildGuestWelcomePath(locale, joinCode));
    }

    if (guestSnapshot?.session && guestSnapshot.participant) {
      const participant = guestSnapshot.participant;
      const effectiveJoinCode = joinCode ?? guestSnapshot.session.publicJoinCode;

      if (guestSnapshot.session.phase === "lobby" && !participant.isReady) {
        redirect(buildGuestWelcomePath(participant.locale, effectiveJoinCode));
      }

      if (participant.locale !== locale) {
        redirect(buildGuestPlayPath(participant.locale, effectiveJoinCode));
      }
    }
  }

  return (
    <PageShell variant="guest" className="guest-controller-page">
      <GuestPlayClient
        locale={locale}
        remoteEnabled={remoteEnabled}
        joinCode={joinCode}
      />
    </PageShell>
  );
}
