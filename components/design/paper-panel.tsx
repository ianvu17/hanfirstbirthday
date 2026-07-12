import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PaperPanelProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  tone?: "paper" | "warm" | "blue" | "yellow" | "admin" | "display";
  className?: string;
};

const panelTone = {
  paper: "border-border/80 bg-surface-paper/95",
  warm: "border-party-orange/25 bg-surface-deep/95",
  blue: "border-party-blue-deep/25 bg-surface-sky/88",
  yellow: "border-party-orange/25 bg-surface-highlight/80",
  admin: "border-border bg-surface-paper",
  display: "border-party-blue-deep/30 bg-surface-paper/96"
};

export function PaperPanel<T extends ElementType = "section">({
  as,
  children,
  tone = "paper",
  className
}: PaperPanelProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      className={cn(
        "relative rounded-[1.6rem] border p-5 shadow-paper sm:p-7",
        "before:pointer-events-none before:absolute before:inset-2 before:rounded-[1.25rem] before:border before:border-white/55",
        panelTone[tone],
        className
      )}
    >
      <div className="relative">{children}</div>
    </Component>
  );
}
