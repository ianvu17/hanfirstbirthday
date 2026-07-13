"use client";

import { AlertCircle } from "lucide-react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { LoadingTreatment } from "@/components/design/loading-treatment";
import { PaperPanel } from "@/components/design/paper-panel";
import { PartyScreenView } from "@/components/party/party-screen-view";
import type { Locale } from "@/lib/i18n/routing";
import { getPartyUiCopy } from "@/lib/party-runtime/copy";
import { useRemotePartySnapshot } from "@/lib/party-remote/use-remote-party";
import type { RemoteNoSessionSnapshot, RemotePartySnapshot } from "@/lib/party-remote/types";

export function RemotePartyScreenClient({ locale = "en" }: { locale?: Locale }) {
  const copy = getPartyUiCopy(locale);
  const { snapshot, connection, error } =
    useRemotePartySnapshot<RemotePartySnapshot | RemoteNoSessionSnapshot>(false);

  if (!snapshot) {
    return (
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center">
        <PaperPanel tone={error ? "warm" : "display"} className="w-full text-center">
          {error ? (
            <div className="space-y-4">
              <BirthdayBadge tone="coral">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {copy.error}
              </BirthdayBadge>
              <h1 className="font-display text-4xl font-extrabold text-foreground">
                {error.message}
              </h1>
            </div>
          ) : (
            <div className="space-y-4">
              <LoadingTreatment />
              <p className="text-lg font-extrabold text-muted-foreground">{copy.connecting}</p>
            </div>
          )}
        </PaperPanel>
      </section>
    );
  }

  if (!snapshot.session) {
    return (
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center">
        <PaperPanel tone="display" className="w-full text-center">
          <div className="space-y-4">
            <BirthdayBadge tone="yellow">{copy.remoteProductionSession}</BirthdayBadge>
            <h1 className="font-display text-5xl font-extrabold text-foreground">
              {copy.noActiveSession}
            </h1>
            <p className="text-lg font-extrabold text-muted-foreground">
              {copy.noActiveSessionDescription}
            </p>
          </div>
        </PaperPanel>
      </section>
    );
  }

  return (
    <PartyScreenView
      locale={locale}
      copy={copy}
      projection={snapshot.projection}
      joinUrl={snapshot.joinUrl}
      connection={connection}
      label={snapshot.session.isTest ? copy.remoteTestSession : copy.remoteProductionSession}
    />
  );
}
