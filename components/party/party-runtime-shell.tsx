"use client";

import { PartyRuntimeProvider } from "@/lib/party-runtime/runtime-provider";

export function PartyRuntimeShell({ children }: { children: React.ReactNode }) {
  return <PartyRuntimeProvider>{children}</PartyRuntimeProvider>;
}
