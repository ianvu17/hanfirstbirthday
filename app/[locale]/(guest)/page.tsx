import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/design/page-shell";
import { OnboardingFlow } from "@/components/guest/onboarding-flow";
import { getContent } from "@/lib/content";
import { isLocale, type Locale } from "@/lib/i18n/routing";

export default async function GuestHomePage({
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
  const content = await getContent(locale);

  return (
    <PageShell variant="guest">
      <OnboardingFlow locale={locale} content={content} />
    </PageShell>
  );
}
