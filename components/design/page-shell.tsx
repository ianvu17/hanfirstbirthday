import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Bunting, CloudMotif, StarCluster } from "./party-motifs";

type PageShellProps = {
  children: ReactNode;
  variant?: "guest" | "admin" | "display" | "qa" | "showcase";
  decorations?: boolean;
  className?: string;
};

export function PageShell({
  children,
  variant = "guest",
  decorations = true,
  className
}: PageShellProps) {
  return (
    <main
      className={cn(
        "paper-grid relative min-h-screen overflow-hidden px-[var(--safe-page-x)] py-[var(--safe-page-y)] text-foreground",
        variant === "admin" && "bg-background",
        variant === "display" && "flex items-center justify-center px-6 py-8",
        variant === "qa" && "bg-surface-deep",
        className
      )}
    >
      {decorations ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <Bunting className="absolute left-1/2 top-0 w-[44rem] max-w-[110vw] -translate-x-1/2 opacity-90" />
          <CloudMotif className="absolute -left-8 top-24 hidden w-40 text-white/90 drop-shadow-md sm:block" />
          <CloudMotif className="absolute -right-10 top-28 hidden w-48 text-white/80 drop-shadow-md lg:block" />
          <StarCluster className="absolute right-4 top-36 w-28 text-party-yellow sm:right-12" />
        </div>
      ) : null}
      <div className={cn("relative z-10 w-full", variant !== "display" && "mx-auto max-w-6xl")}>
        {children}
      </div>
    </main>
  );
}
