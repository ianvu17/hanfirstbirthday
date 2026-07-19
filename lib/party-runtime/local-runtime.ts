"use client";

import { getApprovedPartyConfig, SystemPartyClock, type PartyConfig } from "@/lib/party-engine";

import { LocalPartyRuntime } from "./runtime-contract";

declare global {
  interface Window {
    __hanFirstBirthdayPartyRuntime?: LocalPartyRuntime;
    __hanFirstBirthdayPartyRuntimeKey?: string;
  }
}

function configKey(config: PartyConfig) {
  return JSON.stringify({
    sessionId: config.sessionId,
    questionDurationMs: config.questionDurationMs,
    questions: config.questions.map((question) => ({
      id: question.id,
      sortOrder: question.sortOrder,
      prompt: question.prompt,
      optionIds: question.options.map((option) => option.id),
      optionLabels: question.options.map((option) => option.label),
      correctOptionId: question.correctOptionId,
      funFact: question.funFact,
      assetId: question.assetId ?? null
    }))
  });
}

export function getLocalPartyRuntime(config: PartyConfig = getApprovedPartyConfig()) {
  if (typeof window === "undefined") {
    return new LocalPartyRuntime(config, {
      now: () => Date.now(),
      scheduleDeadline: () => ({ cancel: () => undefined })
    });
  }

  const key = configKey(config);

  if (
    !window.__hanFirstBirthdayPartyRuntime ||
    window.__hanFirstBirthdayPartyRuntimeKey !== key
  ) {
    window.__hanFirstBirthdayPartyRuntime = new LocalPartyRuntime(config, new SystemPartyClock());
    window.__hanFirstBirthdayPartyRuntimeKey = key;
  }

  return window.__hanFirstBirthdayPartyRuntime;
}
