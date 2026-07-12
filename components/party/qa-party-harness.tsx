"use client";

import { HostControlPanel } from "@/components/party/host-control-panel";
import { PartyRuntimeShell } from "@/components/party/party-runtime-shell";
import { PartyScreen } from "@/components/party/party-screen";
import { GuestController } from "@/components/party/guest-controller";
import type { Locale } from "@/lib/i18n/routing";

export function QaPartyHarness({ locale }: { locale: Locale }) {
  return (
    <PartyRuntimeShell>
      <section className="grid gap-5 xl:grid-cols-[22rem_1fr]">
        <HostControlPanel locale={locale} />
        <div className="grid gap-5">
          <div className="rounded-[1.5rem] border border-party-blue/25 bg-background/70 p-3 shadow-paper">
            <div className="scale-[0.78] origin-top">
              <div className="min-h-[720px]" data-testid="qa-party-screen-preview">
                <PartyScreen locale={locale} />
              </div>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md rounded-[1.5rem] border border-border bg-background/80 p-3 shadow-paper">
            <GuestController
              locale={locale}
              guestId="qa-guest"
              displayName={locale === "vi" ? "QA Guest" : "QA Guest"}
            />
          </div>
        </div>
      </section>
    </PartyRuntimeShell>
  );
}
