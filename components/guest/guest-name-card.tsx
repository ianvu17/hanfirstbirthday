import { FormEvent } from "react";
import { PartyPopper, UserRound } from "lucide-react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { PaperPanel } from "@/components/design/paper-panel";
import { Button } from "@/components/ui/button";

type GuestNameCardProps = {
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  primaryAction: string;
  value: string;
  error?: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
};

export function GuestNameCard({
  title,
  description,
  nameLabel,
  namePlaceholder,
  primaryAction,
  value,
  error,
  onValueChange,
  onSubmit
}: GuestNameCardProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-xl flex-col justify-center py-10"
      data-testid="onboarding-name"
    >
      <PaperPanel tone="paper" className="overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none cow-soft-spots absolute inset-0" aria-hidden="true" />
        <div className="space-y-6">
          <div className="space-y-3 text-center">
            <BirthdayBadge tone="yellow" className="mx-auto">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              {nameLabel}
            </BirthdayBadge>
            <h1 className="font-display text-4xl font-extrabold leading-none text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="text-base font-semibold leading-7 text-muted-foreground">
              {description}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-left text-sm font-extrabold text-foreground">
              <span>{nameLabel}</span>
              <input
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                placeholder={namePlaceholder}
                autoComplete="name"
                className="touch-target w-full rounded-[1rem] border border-border bg-surface-paper px-4 py-3 text-lg font-bold leading-7 text-foreground shadow-lift outline-none transition duration-medium ease-paper placeholder:text-muted-foreground/70 focus:border-party-blue"
                data-testid="guest-name-input"
              />
            </label>
            <p
              className="min-h-6 text-sm font-bold leading-6 text-party-red"
              aria-live="polite"
              data-testid="guest-name-error"
            >
              {error}
            </p>
            <Button type="submit" size="lg" className="w-full" data-testid="guest-name-submit">
              <PartyPopper aria-hidden="true" />
              {primaryAction}
            </Button>
          </form>
        </div>
      </PaperPanel>
    </section>
  );
}
