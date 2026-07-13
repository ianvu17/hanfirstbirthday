import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/design/page-shell";
import { GuestPlayClient } from "@/components/party/guest-play-client";
import { isLocale, type Locale } from "@/lib/i18n/routing";
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

  const joinCode = Array.isArray(join) ? join[0] : join;

  return (
    <PageShell variant="guest">
      <GuestPlayClient
        locale={locale}
        remoteEnabled={isSupabaseConfigured()}
        joinCode={joinCode}
      />
    </PageShell>
  );
}
