import { Check, Languages } from "lucide-react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { PaperPanel } from "@/components/design/paper-panel";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  title: string;
  subtitle: string;
  englishLabel: string;
  englishDescription: string;
  vietnameseLabel: string;
  vietnameseDescription: string;
  selectedLocale: Locale;
  onSelect: (locale: Locale) => void;
};

const options = [
  {
    locale: "en",
    labelKey: "englishLabel",
    descriptionKey: "englishDescription"
  },
  {
    locale: "vi",
    labelKey: "vietnameseLabel",
    descriptionKey: "vietnameseDescription"
  }
] as const;

export function LanguageSelector({
  title,
  subtitle,
  englishLabel,
  englishDescription,
  vietnameseLabel,
  vietnameseDescription,
  selectedLocale,
  onSelect
}: LanguageSelectorProps) {
  const copy = {
    englishLabel,
    englishDescription,
    vietnameseLabel,
    vietnameseDescription
  };

  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-4xl flex-col justify-center gap-6 py-8 text-center"
      data-testid="onboarding-language"
    >
      <div className="space-y-3">
        <BirthdayBadge tone="blue" className="mx-auto">
          <Languages className="h-4 w-4" aria-hidden="true" />
          {title}
        </BirthdayBadge>
        <h1 className="font-display text-5xl font-extrabold leading-none text-foreground sm:text-6xl">
          {title}
        </h1>
        <p className="mx-auto max-w-xl text-base font-semibold leading-7 text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <PaperPanel tone="celebration" className="overflow-hidden p-4 sm:p-6">
        <div className="pointer-events-none absolute inset-0 cow-soft-spots opacity-70" aria-hidden="true" />
        <div className="grid gap-4 sm:grid-cols-2">
        {options.map(({ locale, labelKey, descriptionKey }) => {
          const isSelected = selectedLocale === locale;

          return (
            <button
              key={locale}
              type="button"
              onClick={() => onSelect(locale)}
              className={cn(
                "touch-target relative min-h-44 overflow-hidden rounded-[1.3rem] border p-5 text-left shadow-paper transition duration-medium ease-paper hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring",
                "after:pointer-events-none after:absolute after:-bottom-3 after:left-5 after:right-2 after:top-3 after:-z-10 after:rounded-[1.3rem] after:bg-party-orange/16",
                isSelected
                  ? "border-party-blue-deep/35 bg-surface-sky"
                  : "border-border bg-surface-paper hover:border-party-blue"
              )}
              data-testid={`language-${locale}`}
            >
              <span className="mb-6 flex items-center justify-between">
                <span className="rounded-[0.85rem] border border-party-orange/25 bg-surface-highlight px-3 py-1 text-xs font-extrabold uppercase text-foreground shadow-lift">
                  {locale.toUpperCase()}
                </span>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border",
                    isSelected
                      ? "border-party-blue-deep/25 bg-surface-paper text-party-blue-deep"
                      : "border-border bg-surface-deep text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {isSelected ? <Check className="h-5 w-5" /> : null}
                </span>
              </span>
              <span className="block font-display text-4xl font-extrabold leading-none text-foreground sm:text-5xl">
                {copy[labelKey]}
              </span>
              <span className="mt-4 block text-base font-bold leading-6 text-muted-foreground">
                {copy[descriptionKey]}
              </span>
            </button>
          );
        })}
        </div>
      </PaperPanel>
    </section>
  );
}
