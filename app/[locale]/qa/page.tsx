import { FlaskConical } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { DecorativeHeading } from "@/components/design/decorative-heading";
import { PageShell } from "@/components/design/page-shell";
import { PaperPanel } from "@/components/design/paper-panel";
import { getScaffoldCopy } from "@/lib/content/scaffold";
import { isLocale, type Locale } from "@/lib/i18n/routing";

export default async function QaFoundationPage({
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
  const scaffoldCopy = getScaffoldCopy(locale);

  return (
    <PageShell variant="qa" className="py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-4xl content-center gap-6">
        <DecorativeHeading
          size="section"
          eyebrow={
            <BirthdayBadge tone="qa">
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              {scaffoldCopy.qa.eyebrow}
            </BirthdayBadge>
          }
          title={scaffoldCopy.qa.title}
          description={scaffoldCopy.qa.description}
        />
        <PaperPanel tone="warm">
          <p className="text-base font-extrabold leading-7 text-foreground">
            {scaffoldCopy.qa.warning}
          </p>
        </PaperPanel>
      </div>
    </PageShell>
  );
}
