import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/design/page-shell";
import { ProductionHostController } from "@/components/party/host/production-host-controller";
import { isLocale, type Locale } from "@/lib/i18n/routing";

export default async function HostPage({
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
    <PageShell variant="admin" decorations={false}>
      <ProductionHostController locale={locale} />
    </PageShell>
  );
}
