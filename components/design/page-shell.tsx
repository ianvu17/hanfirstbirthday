import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  BalloonCluster,
  Bunting,
  CloudMotif,
  GiftStack,
  PartyHat,
  StarCluster
} from "./party-motifs";

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
        "paper-grid relative min-h-screen min-h-dvh overflow-hidden px-[var(--safe-page-x)] py-[var(--safe-page-y)] pb-[max(var(--safe-page-y),env(safe-area-inset-bottom))] text-foreground",
        variant === "admin" && "bg-background",
        variant === "display" && "flex items-center justify-center px-6 py-8",
        variant === "qa" && "bg-surface-deep",
        className
      )}
    >
      {decorations ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <Bunting className="absolute left-1/2 top-0 w-[52rem] max-w-[132vw] -translate-x-1/2 opacity-95 drop-shadow-sm" />
          <CloudMotif className="absolute -left-12 top-24 hidden w-44 text-white/90 drop-shadow-md sm:block" />
          <CloudMotif className="absolute -right-14 top-28 hidden w-52 text-white/85 drop-shadow-md lg:block" />
          <StarCluster className="absolute right-3 top-36 w-28 text-party-yellow drop-shadow-sm sm:right-12" />
          <BalloonCluster className="absolute left-2 bottom-20 hidden w-36 opacity-95 drop-shadow-md xl:block" />
          <GiftStack className="absolute bottom-5 left-[7%] hidden w-48 opacity-95 drop-shadow-md xl:block" />
          <PartyHat className="absolute bottom-28 right-[8%] hidden w-20 rotate-6 opacity-90 drop-shadow-sm lg:block" />
          <div className="paper-stage absolute inset-x-[-8%] bottom-0 h-28 border-t border-party-orange/20 shadow-[0_-18px_40px_-38px_hsl(var(--shadow-warm))]" />
          <div className="blue-runner absolute bottom-0 left-1/2 h-32 w-44 -translate-x-1/2 rounded-t-[1.5rem] opacity-90 shadow-paper sm:w-64 lg:w-80" />
        </div>
      ) : null}
      <div className={cn("relative z-10 w-full", variant !== "display" && "mx-auto max-w-6xl")}>
        {children}
      </div>
    </main>
  );
}
