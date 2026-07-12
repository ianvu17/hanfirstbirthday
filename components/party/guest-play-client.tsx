"use client";

import { useMemo } from "react";

import { GuestController } from "@/components/party/guest-controller";
import { PartyRuntimeShell } from "@/components/party/party-runtime-shell";
import type { Locale } from "@/lib/i18n/routing";

const SESSION_KEY = "han-first-birthday:onboarding:v1";

function slugifyGuestId(name: string) {
  return `guest-${name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 48)}`;
}

function readGuestSession() {
  if (typeof window === "undefined") {
    return { guestId: null, displayName: null };
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      return { guestId: null, displayName: null };
    }

    const parsed = JSON.parse(raw) as { playerName?: unknown };
    const displayName =
      typeof parsed.playerName === "string" ? parsed.playerName.trim() : "";

    if (!displayName) {
      return { guestId: null, displayName: null };
    }

    return {
      guestId: slugifyGuestId(displayName),
      displayName
    };
  } catch {
    return { guestId: null, displayName: null };
  }
}

export function GuestPlayClient({ locale }: { locale: Locale }) {
  const guest = useMemo(() => readGuestSession(), []);

  return (
    <PartyRuntimeShell>
      <GuestController
        locale={locale}
        guestId={guest.guestId}
        displayName={guest.displayName}
      />
    </PartyRuntimeShell>
  );
}
