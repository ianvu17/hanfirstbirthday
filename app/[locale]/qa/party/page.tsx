import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/design/page-shell";
import { QaPartyHarness } from "@/components/party/qa-party-harness";
import { isLocale, type Locale } from "@/lib/i18n/routing";

export default async function QaPartyPage({
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
    <PageShell variant="qa" decorations={false} className="overflow-auto">
      <QaPartyHarness locale={locale} />
    </PageShell>
  );
}
