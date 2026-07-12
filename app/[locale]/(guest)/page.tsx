import Link from "next/link";
import { Gift, Languages, Sparkles, Timer } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AssetPlaceholder } from "@/components/design/asset-placeholder";
import { BirthdayBadge } from "@/components/design/birthday-badge";
import { DecorativeHeading } from "@/components/design/decorative-heading";
import { PageShell } from "@/components/design/page-shell";
import { PaperPanel } from "@/components/design/paper-panel";
import { WaveDivider } from "@/components/design/party-motifs";
import { MotionReveal } from "@/components/motion/motion-patterns";
import { Button } from "@/components/ui/button";
import { getContent } from "@/lib/content";
import {
  getCommonScaffoldCopy,
  getLocaleLabel,
  getScaffoldCopy
} from "@/lib/content/scaffold";
import { isLocale, locales, type Locale } from "@/lib/i18n/routing";

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
  const scaffoldCopy = getScaffoldCopy(locale);
  const commonCopy = getCommonScaffoldCopy();

  return (
    <PageShell variant="guest">
      <div className="flex min-h-[calc(100vh-2rem)] items-center py-14 sm:py-20">
        <MotionReveal className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <PaperPanel tone="paper" className="overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="cow-soft-spots absolute inset-0" aria-hidden="true" />
            <div className="relative space-y-7">
              <DecorativeHeading
                eyebrow={
                  <BirthdayBadge tone="yellow">
                    <Gift className="h-4 w-4" aria-hidden="true" />
                    {scaffoldCopy.guest.eyebrow}
                  </BirthdayBadge>
                }
                title={scaffoldCopy.guest.title}
                description={scaffoldCopy.guest.description}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild size="lg">
                  <Link href={`/${locale}/design-system`}>
                    <Sparkles aria-hidden="true" />
                    {scaffoldCopy.guest.primaryAction}
                  </Link>
                </Button>
                {locales
                  .filter((targetLocale) => targetLocale !== locale)
                  .map((targetLocale) => (
                    <Button key={targetLocale} asChild variant="outline" size="lg">
                      <Link href={`/${targetLocale}`} hrefLang={targetLocale}>
                        <Languages aria-hidden="true" />
                        {scaffoldCopy.guest.secondaryAction}
                      </Link>
                    </Button>
                  ))}
              </div>

              <div className="grid gap-3 text-sm font-bold text-muted-foreground sm:grid-cols-2">
                <div className="rounded-[1rem] border border-border bg-surface-paper px-4 py-3 shadow-lift">
                  {scaffoldCopy.guest.localeLabel}: {getLocaleLabel(locale)}
                </div>
                <div className="rounded-[1rem] border border-border bg-surface-paper px-4 py-3 shadow-lift">
                  <span className="inline-flex items-center gap-2">
                    <Timer className="h-4 w-4 text-party-orange" aria-hidden="true" />
                    {scaffoldCopy.guest.timerLabel}:{" "}
                    {content.quiz.settings.defaultQuestionDurationSeconds}s
                  </span>
                </div>
              </div>
            </div>
          </PaperPanel>

          <aside className="relative mx-auto w-full max-w-md">
            <div className="gingham-yellow absolute inset-x-8 top-5 h-28 rounded-[1.7rem] border border-party-orange/25 shadow-outline" />
            <PaperPanel tone="blue" className="relative mt-8 p-4 sm:p-5">
              <AssetPlaceholder
                label={commonCopy.assetPlaceholder.label}
                alt={commonCopy.assetPlaceholder.alt}
                ratio="landscape"
              />
              <WaveDivider className="mt-5 w-full text-party-blue" />
            </PaperPanel>
          </aside>
        </MotionReveal>
      </div>
    </PageShell>
  );
}
