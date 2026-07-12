import { ClipboardList } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { DecorativeHeading } from "@/components/design/decorative-heading";
import { PageShell } from "@/components/design/page-shell";
import { PaperPanel } from "@/components/design/paper-panel";
import { getScaffoldCopy } from "@/lib/content/scaffold";
import { isLocale, type Locale } from "@/lib/i18n/routing";

export default async function AdminFoundationPage({
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
    <PageShell variant="admin" decorations={false} className="py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-4xl content-center gap-6">
        <DecorativeHeading
          size="section"
          eyebrow={
            <BirthdayBadge tone="cream">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              {scaffoldCopy.admin.eyebrow}
            </BirthdayBadge>
          }
          title={scaffoldCopy.admin.title}
          description={scaffoldCopy.admin.description}
        />
        <PaperPanel tone="admin">
          <div className="grid gap-3 sm:grid-cols-3">
            {scaffoldCopy.admin.items.map((item) => (
              <div
                key={item}
                className="rounded-[1rem] border border-border bg-background px-4 py-4 text-sm font-bold leading-5 text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </div>
        </PaperPanel>
      </div>
    </PageShell>
  );
}
