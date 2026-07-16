"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode
} from "react";

import {
  buildGuestProjection,
  buildSharedPartyProjection,
  selectHostCapabilities,
  type PartyConfig
} from "@/lib/party-engine";
import type { ParticipantAvatarProjection } from "@/lib/party-avatar";

import { getLocalPartyRuntime } from "./local-runtime";
import type { PartyRuntime } from "./runtime-contract";

const PartyRuntimeContext = createContext<PartyRuntime | null>(null);

export function PartyRuntimeProvider({
  children,
  config
}: {
  children: ReactNode;
  config?: PartyConfig;
}) {
  const [runtime] = useState(() => getLocalPartyRuntime(config));

  return (
    <PartyRuntimeContext.Provider value={runtime}>{children}</PartyRuntimeContext.Provider>
  );
}

export function usePartyRuntime() {
  const runtime = useContext(PartyRuntimeContext);

  if (!runtime) {
    throw new Error("usePartyRuntime must be used inside PartyRuntimeProvider.");
  }

  return runtime;
}

export function usePartySnapshot() {
  const runtime = usePartyRuntime();

  return useSyncExternalStore(
    runtime.subscribe.bind(runtime),
    () => runtime.getSnapshot(),
    () => runtime.getSnapshot()
  );
}

export function usePartyActions() {
  const runtime = usePartyRuntime();

  return useMemo(
    () => ({
      registerGuest: (
        guestId: string,
        displayName: string,
        locale: "en" | "vi",
        avatar?: ParticipantAvatarProjection | null
      ) => runtime.dispatch({ type: "REGISTER_GUEST", guestId, displayName, locale, avatar }),
      prepareFirstQuestion: () => runtime.dispatch({ type: "PREPARE_FIRST_QUESTION" }),
      revealChoices: () => runtime.dispatch({ type: "REVEAL_CHOICES" }),
      revealAnswer: () => runtime.dispatch({ type: "REVEAL_ANSWER" }),
      showLeaderboard: () => runtime.dispatch({ type: "SHOW_LEADERBOARD" }),
      advanceFromLeaderboard: () => runtime.dispatch({ type: "ADVANCE_FROM_LEADERBOARD" }),
      completePresentation: () => runtime.dispatch({ type: "COMPLETE_PRESENTATION" }),
      prepareNextQuestion: () => runtime.dispatch({ type: "PREPARE_NEXT_QUESTION" }),
      finishParty: () => runtime.dispatch({ type: "FINISH_PARTY" }),
      submitResponse: (
        guestId: string,
        questionId: string,
        selectedOptionId: string,
        submissionId: string
      ) =>
        runtime.dispatch({
          type: "SUBMIT_RESPONSE",
          guestId,
          questionId,
          selectedOptionId,
          submissionId
        }),
      resetLocalParty: () => runtime.reset()
    }),
    [runtime]
  );
}

export function useSharedPartyProjection() {
  const runtime = usePartyRuntime();
  const snapshot = usePartySnapshot();

  return buildSharedPartyProjection(snapshot.state, runtime.getConfig(), snapshot.now);
}

export function useGuestProjection(guestId: string) {
  const runtime = usePartyRuntime();
  const snapshot = usePartySnapshot();

  return buildGuestProjection(snapshot.state, runtime.getConfig(), guestId, snapshot.now);
}

export function useHostCapabilities() {
  const snapshot = usePartySnapshot();

  return selectHostCapabilities(snapshot.state);
}
