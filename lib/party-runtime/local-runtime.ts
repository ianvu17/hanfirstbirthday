"use client";

import { getDevelopmentPartyConfig, SystemPartyClock } from "@/lib/party-engine";

import { LocalPartyRuntime } from "./runtime-contract";

declare global {
  interface Window {
    __hanFirstBirthdayPartyRuntime?: LocalPartyRuntime;
  }
}

export function getLocalPartyRuntime() {
  if (typeof window === "undefined") {
    return new LocalPartyRuntime(getDevelopmentPartyConfig(), {
      now: () => Date.now(),
      scheduleDeadline: () => ({ cancel: () => undefined })
    });
  }

  window.__hanFirstBirthdayPartyRuntime ??= new LocalPartyRuntime(
    getDevelopmentPartyConfig(),
    new SystemPartyClock()
  );

  return window.__hanFirstBirthdayPartyRuntime;
}
