"use client";

import { useSyncExternalStore } from "react";

import { LoadingTreatment } from "@/components/design/loading-treatment";
import { PaperPanel } from "@/components/design/paper-panel";
import { GuestController } from "@/components/party/guest-controller";
import { PartyRuntimeShell } from "@/components/party/party-runtime-shell";
import { RemoteGuestController } from "@/components/party/remote/remote-guest-controller";
import type { Locale } from "@/lib/i18n/routing";

const SESSION_KEY = "han-first-birthday:onboarding:v1";
type GuestSessionSnapshot = { guestId: string | null; displayName: string | null };

const emptyGuest: GuestSessionSnapshot = { guestId: null, displayName: null };
let cachedGuestRaw: string | null | undefined;
let cachedGuest: GuestSessionSnapshot = emptyGuest;

function createGuestSessionId() {
  const randomId =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `guest-${randomId}`;
}

function readGuestSession() {
  if (typeof window === "undefined") {
    return emptyGuest;
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      return emptyGuest;
    }

    const parsed = JSON.parse(raw) as {
      playerName?: unknown;
      guestSessionId?: unknown;
    };
    const displayName =
      typeof parsed.playerName === "string" ? parsed.playerName.trim() : "";

    if (!displayName) {
      return emptyGuest;
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
    return emptyGuest;
  }
}

function subscribeToGuestSession(onStoreChange: () => void) {
  const handle = window.setTimeout(onStoreChange, 0);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.clearTimeout(handle);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getGuestSessionSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(SESSION_KEY);

  if (raw === cachedGuestRaw) {
    return cachedGuest;
  }

  cachedGuestRaw = raw;
  cachedGuest = readGuestSession();
  return cachedGuest;
}

export function GuestPlayClient({
  locale,
  remoteEnabled = false,
  joinCode
}: {
  locale: Locale;
  remoteEnabled?: boolean;
  joinCode?: string;
}) {
  const guest = useSyncExternalStore(
    subscribeToGuestSession,
    getGuestSessionSnapshot,
    () => null
  );

  if (!guest) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center">
        <PaperPanel tone="paper" className="w-full">
          <LoadingTreatment />
        </PaperPanel>
      </section>
    );
  }

  if (remoteEnabled) {
    return (
      <RemoteGuestController
        locale={locale}
        displayName={guest.displayName}
        joinCode={joinCode}
      />
    );
  }

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
