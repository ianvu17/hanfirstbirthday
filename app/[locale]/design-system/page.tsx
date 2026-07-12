import Link from "next/link";
import { ArrowLeft, Check, CircleDot, LoaderCircle, MousePointer2 } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AssetPlaceholder } from "@/components/design/asset-placeholder";
import { BirthdayBadge } from "@/components/design/birthday-badge";
import { DecorativeHeading } from "@/components/design/decorative-heading";
import { LoadingTreatment } from "@/components/design/loading-treatment";
import { PageShell } from "@/components/design/page-shell";
import { PaperPanel } from "@/components/design/paper-panel";
import { Bunting, CloudMotif, StarCluster, WaveDivider } from "@/components/design/party-motifs";
import { MotionReveal, StaggeredItem, StaggeredReveal } from "@/components/motion/motion-patterns";
import { Button } from "@/components/ui/button";
import {
  getCommonScaffoldCopy,
  getScaffoldCopy
} from "@/lib/content/scaffold";
import { isLocale, type Locale } from "@/lib/i18n/routing";

const colorTokens = [
  ["background-page", "bg-background"],
  ["surface-paper", "bg-surface-paper"],
  ["surface-highlight", "bg-surface-highlight"],
  ["accent-blue", "bg-party-blue"],
  ["accent-yellow", "bg-party-yellow"],
  ["accent-orange", "bg-party-orange"],
  ["accent-red", "bg-party-red"],
  ["accent-pink", "bg-party-pink"]
] as const;

export default async function DesignSystemPage({
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
  const commonCopy = getCommonScaffoldCopy();
  const designCopy = scaffoldCopy.designSystem;

  return (
    <PageShell variant="showcase">
      <div className="grid gap-8 py-14 sm:py-20">
        <MotionReveal className="grid gap-6">
          <Button asChild variant="ghost" className="w-fit">
            <Link href={`/${locale}`}>
              <ArrowLeft aria-hidden="true" />
              {scaffoldCopy.guest.secondaryAction}
            </Link>
          </Button>
          <DecorativeHeading
            eyebrow={<BirthdayBadge tone="blue">{designCopy.eyebrow}</BirthdayBadge>}
            title={designCopy.title}
            description={designCopy.description}
          />
        </MotionReveal>

        <section className="grid gap-4">
          <h2 className="font-display text-3xl font-extrabold">
            {designCopy.sections.colors}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {colorTokens.map(([label, swatch]) => (
              <PaperPanel key={label} tone="paper" className="p-4">
                <div className={`mb-3 h-20 rounded-[1rem] border border-border ${swatch}`} />
                <p className="text-sm font-extrabold text-muted-foreground">{label}</p>
              </PaperPanel>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <PaperPanel tone="paper">
            <h2 className="font-display text-4xl font-extrabold leading-none">
              {designCopy.sections.typography}
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-muted-foreground">
              {designCopy.longCopy}
            </p>
          </PaperPanel>
          <PaperPanel tone="yellow">
            <p className="font-display text-5xl font-extrabold leading-none text-foreground">
              WHO IS TURNING ONE?!
            </p>
            <p className="mt-4 text-lg font-bold leading-8 text-foreground">
              Xin chào gia đình và bạn bè, đây là dòng chữ dài để kiểm tra dấu tiếng Việt.
            </p>
          </PaperPanel>
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-3xl font-extrabold">
            {designCopy.sections.controls}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button>
              <Check aria-hidden="true" />
              {designCopy.buttons.primary}
            </Button>
            <Button variant="secondary">
              <CircleDot aria-hidden="true" />
              {designCopy.buttons.secondary}
            </Button>
            <Button variant="outline">
              <MousePointer2 aria-hidden="true" />
              {designCopy.buttons.outline}
            </Button>
            <Button variant="ghost">
              <ArrowLeft aria-hidden="true" />
              {designCopy.buttons.ghost}
            </Button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <PaperPanel tone="paper">
            <h2 className="mb-4 font-display text-3xl font-extrabold">
              {designCopy.sections.panels}
            </h2>
            <div className="flex flex-wrap gap-2">
              <BirthdayBadge>{designCopy.labels.badge}</BirthdayBadge>
              <BirthdayBadge tone="coral">{designCopy.labels.focus}</BirthdayBadge>
              <BirthdayBadge tone="qa">{designCopy.labels.qa}</BirthdayBadge>
            </div>
          </PaperPanel>
          <PaperPanel tone="blue" className="lg:col-span-2">
            <p className="text-base font-bold leading-7 text-foreground">
              {designCopy.longCopy}
            </p>
          </PaperPanel>
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-3xl font-extrabold">
            {designCopy.sections.placeholders}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <AssetPlaceholder
              label={commonCopy.assetPlaceholder.label}
              alt={commonCopy.assetPlaceholder.alt}
              ratio="portrait"
            />
            <AssetPlaceholder
              label={commonCopy.assetPlaceholder.label}
              alt={commonCopy.assetPlaceholder.alt}
              ratio="square"
            />
            <AssetPlaceholder
              label={commonCopy.assetPlaceholder.label}
              alt={commonCopy.assetPlaceholder.alt}
              ratio="wide"
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <PaperPanel tone="paper" className="overflow-hidden">
            <h2 className="mb-4 font-display text-3xl font-extrabold">
              {designCopy.sections.motifs}
            </h2>
            <Bunting className="w-full text-party-orange" />
            <WaveDivider className="mt-4 w-full" />
          </PaperPanel>
          <PaperPanel tone="warm">
            <div className="grid grid-cols-2 items-center gap-4">
              <CloudMotif className="w-full text-white drop-shadow-md" />
              <StarCluster className="w-full text-party-yellow" />
            </div>
          </PaperPanel>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <PaperPanel tone="paper">
            <h2 className="mb-4 font-display text-3xl font-extrabold">
              {designCopy.sections.motion}
            </h2>
            <StaggeredReveal className="grid gap-3">
              {[designCopy.labels.loading, designCopy.labels.badge, designCopy.labels.focus].map(
                (label) => (
                  <StaggeredItem
                    key={label}
                    className="rounded-[1rem] border border-border bg-surface-paper px-4 py-3 text-sm font-extrabold shadow-lift"
                  >
                    {label}
                  </StaggeredItem>
                )
              )}
            </StaggeredReveal>
          </PaperPanel>
          <PaperPanel tone="yellow">
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-extrabold text-muted-foreground">
              <LoaderCircle className="h-4 w-4" aria-hidden="true" />
              {designCopy.labels.loading}
            </div>
            <LoadingTreatment />
          </PaperPanel>
        </section>
      </div>
    </PageShell>
  );
}
