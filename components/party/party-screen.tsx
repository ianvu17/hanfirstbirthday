"use client";

import type { Locale } from "@/lib/i18n/routing";
import { getPartyUiCopy } from "@/lib/party-runtime/copy";
import {
  usePartySnapshot,
  useSharedPartyProjection,
} from "@/lib/party-runtime/runtime-provider";

import { PartyScreenView } from "./party-screen-view";

export function PartyScreen({ locale = "en" }: { locale?: Locale }) {
  const copy = getPartyUiCopy(locale);
  const projection = useSharedPartyProjection();
  const snapshot = usePartySnapshot();

  return (
    <PartyScreenView
      locale={locale}
      copy={copy}
      projection={projection}
      serverNow={snapshot.now}
      connection="connected"
      label={copy.developmentLabel}
      animationKey={`${snapshot.state.sessionId}:${snapshot.state.currentQuestionId ?? "none"}`}
    />
  );
}
