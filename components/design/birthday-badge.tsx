import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BirthdayBadgeProps = {
  children: ReactNode;
  tone?: "cream" | "blue" | "yellow" | "coral" | "qa";
  className?: string;
};

const badgeTone = {
  cream: "border-border bg-surface-paper text-foreground",
  blue: "border-party-blue-deep/30 bg-party-blue text-primary-foreground",
  yellow: "border-party-orange/30 bg-party-yellow text-foreground",
  coral: "border-party-red/25 bg-surface-coral text-foreground",
  qa: "border-party-red/35 bg-party-red text-primary-foreground"
};

export function BirthdayBadge({
  children,
  tone = "cream",
  className
}: BirthdayBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-[0.95rem] border px-3 py-1 text-xs font-extrabold uppercase tracking-normal shadow-lift",
        badgeTone[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
