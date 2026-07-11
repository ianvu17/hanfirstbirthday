import Image from "next/image";
import Link from "next/link";
import { Gift, Languages, Sparkles } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SoftEntrance } from "@/components/motion/soft-entrance";
import { getContent } from "@/lib/content";
import { getLocaleLabel, getScaffoldCopy } from "@/lib/content/scaffold";
import { placeholderAssets } from "@/lib/assets/placeholders";
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

  return (
    <main className="paper-grid min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center">
        <SoftEntrance className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="relative rounded-[2rem] border border-border/70 bg-card/88 p-6 shadow-paper backdrop-blur sm:p-8">
            <div className="cow-soft-spots absolute inset-0 rounded-[2rem]" aria-hidden="true" />
            <div className="relative space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-warm px-4 py-2 text-sm font-semibold text-warm-foreground shadow-lift">
                <Gift className="h-4 w-4" aria-hidden="true" />
                {content.metadata.projectName}
              </div>

              <div className="space-y-4">
                <h1 className="font-display text-5xl font-extrabold leading-[0.98] text-foreground sm:text-6xl lg:text-7xl">
                  {content.metadata.publicTitle}
                </h1>
                <p className="max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg">
                  {content.metadata.contentStatus}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {locales.map((targetLocale) => (
                  <Button
                    key={targetLocale}
                    asChild
                    variant={targetLocale === locale ? "default" : "secondary"}
                    size="lg"
                  >
                    <Link href={`/${targetLocale}`} hrefLang={targetLocale}>
                      <Languages className="h-5 w-5" aria-hidden="true" />
                      {getLocaleLabel(targetLocale)}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </section>

          <aside className="relative mx-auto aspect-[1.2/1] w-full max-w-md">
            <div className="absolute inset-x-8 top-4 h-28 rounded-[2rem] bg-secondary/80 shadow-paper" />
            <div className="absolute bottom-2 left-0 right-0 rounded-[2rem] border border-border/70 bg-card p-5 shadow-paper">
              <Image
                src={placeholderAssets.galleryFrame.src}
                alt={placeholderAssets.galleryFrame.alt}
                width={640}
                height={420}
                priority
                className="h-auto w-full rounded-[1.25rem]"
              />
              <div className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-muted-foreground">
                <span>
                  {scaffoldCopy.guest.localeLabel}: {content.locale}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                  {content.quiz.settings.defaultQuestionDurationSeconds}s
                </span>
              </div>
            </div>
          </aside>
        </SoftEntrance>
      </div>
    </main>
  );
}
