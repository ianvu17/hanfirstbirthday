import { cookies } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { PageShell } from "@/components/design/page-shell";
import { OnboardingFlow } from "@/components/guest/onboarding-flow";
import { getContent } from "@/lib/content";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import {
  buildGuestPlayPath,
  normalizeJoinCode
} from "@/lib/party-remote/join-routing";
import {
  buildRemotePartySnapshot,
  parseParticipantCookieValue
} from "@/lib/party-remote/repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function GuestHomePage({
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
  const joinCode = normalizeJoinCode(join);
  const remoteEnabled = isSupabaseConfigured();

  if (remoteEnabled) {
    const cookieStore = await cookies();
    const participantSession = parseParticipantCookieValue(
      cookieStore.get("han_participant_session")?.value
    );

    if (participantSession) {
      const snapshot = await buildRemotePartySnapshot(participantSession);

      if (snapshot.session && "participant" in snapshot && snapshot.participant) {
        redirect(buildGuestPlayPath(locale, joinCode ?? snapshot.session.publicJoinCode));
      }
    }
  }

  const content = await getContent(locale);

  return (
    <PageShell variant="guest">
      <OnboardingFlow
        locale={locale}
        content={content}
        remoteEnabled={remoteEnabled}
        initialJoinCode={joinCode}
      />
    </PageShell>
  );
}
