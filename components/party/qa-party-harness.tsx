"use client";

import { useMemo, useState } from "react";

import { HostControlPanel } from "@/components/party/host-control-panel";
import { PartyRuntimeShell } from "@/components/party/party-runtime-shell";
import { PartyScreen } from "@/components/party/party-screen";
import { GuestController } from "@/components/party/guest-controller";
import type { Locale } from "@/lib/i18n/routing";
import {
  createSessionPartyConfig,
  getApprovedPartyConfig,
  getAvailableSessionQuestionCounts,
  getDefaultSessionQuestionCount,
  getDevelopmentPartyConfig,
} from "@/lib/party-engine";
import { getPartyUiCopy } from "@/lib/party-runtime/copy";

export function QaPartyHarness({ locale }: { locale: Locale }) {
  const copy = getPartyUiCopy(locale);
  const approvedConfig = getApprovedPartyConfig();
  const fixtureConfig = getDevelopmentPartyConfig();
  const [questionCount, setQuestionCount] = useState(
    getDefaultSessionQuestionCount(approvedConfig.questions.length),
  );
  const config = useMemo(
    () =>
      createSessionPartyConfig(
        {
          ...approvedConfig,
          sessionId: `local-qa-${questionCount}`,
          fixtureGuests: fixtureConfig.fixtureGuests,
        },
        questionCount,
      ),
    [approvedConfig, fixtureConfig.fixtureGuests, questionCount],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-[1rem] border border-party-blue/25 bg-surface-sky/55 p-3">
        <span className="font-extrabold">{copy.questionsThisSession}</span>
        {getAvailableSessionQuestionCounts(approvedConfig.questions.length).map(
          (count) => (
            <button
              key={count}
              type="button"
              aria-pressed={questionCount === count}
              onClick={() => setQuestionCount(count)}
              className={`min-h-10 min-w-12 rounded-[0.8rem] border px-3 font-extrabold ${
                questionCount === count
                  ? "border-party-blue-deep bg-party-blue text-white"
                  : "bg-surface-paper"
              }`}
            >
              {count}
            </button>
          ),
        )}
      </div>
      <PartyRuntimeShell key={questionCount} config={config}>
        <section className="grid gap-5 xl:grid-cols-[22rem_1fr]">
          <HostControlPanel locale={locale} />
          <div className="grid gap-5">
            <div className="rounded-[1.5rem] border border-party-blue/25 bg-background/70 p-3 shadow-paper">
              <div className="scale-[0.78] origin-top">
                <div
                  className="min-h-[720px]"
                  data-testid="qa-party-screen-preview"
                >
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
    </div>
  );
}
