import { Languages } from "lucide-react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
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
      className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-3xl flex-col justify-center gap-6 py-10 text-center"
      data-testid="onboarding-language"
    >
      <div className="space-y-3">
        <BirthdayBadge tone="blue" className="mx-auto">
          <Languages className="h-4 w-4" aria-hidden="true" />
          {selectedLocale.toUpperCase()}
        </BirthdayBadge>
        <h1 className="font-display text-4xl font-extrabold leading-none text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto max-w-xl text-base font-semibold leading-7 text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map(({ locale, labelKey, descriptionKey }) => {
          const isSelected = selectedLocale === locale;

          return (
            <button
              key={locale}
              type="button"
              onClick={() => onSelect(locale)}
              className={cn(
                "touch-target min-h-40 rounded-[1.35rem] border p-5 text-left shadow-paper transition duration-medium ease-paper hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring",
                isSelected
                  ? "border-party-blue-deep/35 bg-surface-sky"
                  : "border-border bg-surface-paper hover:border-party-blue"
              )}
              data-testid={`language-${locale}`}
            >
              <span className="block font-display text-4xl font-extrabold leading-none text-foreground">
                {copy[labelKey]}
              </span>
              <span className="mt-4 block text-base font-bold leading-6 text-muted-foreground">
                {copy[descriptionKey]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
