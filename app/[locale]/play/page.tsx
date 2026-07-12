import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/design/page-shell";
import { GuestPlayClient } from "@/components/party/guest-play-client";
import { isLocale, type Locale } from "@/lib/i18n/routing";

export default async function GuestPlayPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  setRequestLocale(locale);

  return (
    <PageShell variant="guest">
      <GuestPlayClient locale={locale} />
    </PageShell>
  );
}
