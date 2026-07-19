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
  disabled?: boolean;
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
  disabled = false,
  onValueChange,
  onSubmit
}: GuestNameCardProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-3xl flex-col justify-center py-8"
      data-testid="onboarding-name"
    >
      <PaperPanel tone="celebration" className="overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none cow-soft-spots absolute inset-0" aria-hidden="true" />
        <div className="grid gap-6 md:grid-cols-[0.86fr_1.14fr] md:items-center">
          <div className="relative rounded-[1.4rem] border border-party-orange/25 bg-surface-highlight p-5 text-center shadow-outline">
            <div className="paper-stage absolute inset-0 rounded-[1.4rem] opacity-45" aria-hidden="true" />
            <div className="relative space-y-4">
              <BirthdayBadge tone="coral" className="mx-auto">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {nameLabel}
              </BirthdayBadge>
              <div className="mx-auto flex h-24 w-24 rotate-[-2deg] items-center justify-center rounded-[1.45rem] border border-party-blue-deep/25 bg-surface-paper text-party-blue-deep shadow-sticker">
                <UserRound className="h-12 w-12" aria-hidden="true" />
              </div>
              <p className="text-sm font-extrabold leading-6 text-foreground">
                {description}
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-3 text-center md:text-left">
              <h1 className="font-display text-4xl font-extrabold leading-none text-foreground sm:text-5xl">
                {title}
              </h1>
            </div>
            <label className="grid gap-2 text-left text-sm font-extrabold text-foreground">
              <span>{nameLabel}</span>
              <input
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                placeholder={namePlaceholder}
                autoComplete="name"
                className="touch-target w-full rounded-[1rem] border-2 border-border bg-surface-paper px-4 py-3 text-lg font-bold leading-7 text-foreground shadow-lift outline-none transition duration-medium ease-paper placeholder:text-muted-foreground/70 focus:border-party-blue"
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
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={disabled}
              data-testid="guest-name-submit"
            >
              <PartyPopper aria-hidden="true" />
              {primaryAction}
            </Button>
          </form>
        </div>
      </PaperPanel>
    </section>
  );
}
