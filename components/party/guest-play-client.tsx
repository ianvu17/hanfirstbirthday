"use client";

import { useMemo } from "react";

import { GuestController } from "@/components/party/guest-controller";
import { PartyRuntimeShell } from "@/components/party/party-runtime-shell";
import type { Locale } from "@/lib/i18n/routing";

const SESSION_KEY = "han-first-birthday:onboarding:v1";

function createGuestSessionId() {
  const randomId =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `guest-${randomId}`;
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

    const parsed = JSON.parse(raw) as {
      playerName?: unknown;
      guestSessionId?: unknown;
    };
    const displayName =
      typeof parsed.playerName === "string" ? parsed.playerName.trim() : "";

    if (!displayName) {
      return { guestId: null, displayName: null };
    }

    const guestSessionId =
      typeof parsed.guestSessionId === "string" && parsed.guestSessionId
        ? parsed.guestSessionId
        : createGuestSessionId();

    if (guestSessionId !== parsed.guestSessionId) {
      window.sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          ...parsed,
          guestSessionId
        })
      );
    }

    return {
      guestId: guestSessionId,
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
