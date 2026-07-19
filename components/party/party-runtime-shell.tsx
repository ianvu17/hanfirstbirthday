"use client";

import { PartyRuntimeProvider } from "@/lib/party-runtime/runtime-provider";
import type { PartyConfig } from "@/lib/party-engine";

export function PartyRuntimeShell({
  children,
  config
}: {
  children: React.ReactNode;
  config?: PartyConfig;
}) {
  return <PartyRuntimeProvider config={config}>{children}</PartyRuntimeProvider>;
}
