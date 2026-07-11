import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

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
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <section className="mx-auto max-w-3xl rounded-[1.5rem] border border-border bg-card p-6 shadow-paper">
        <h1 className="font-display text-4xl font-extrabold">
          {scaffoldCopy.qa.title}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {scaffoldCopy.qa.description}
        </p>
      </section>
    </main>
  );
}
