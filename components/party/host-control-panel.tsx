"use client";

import { RotateCcw, Settings2 } from "lucide-react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { PaperPanel } from "@/components/design/paper-panel";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import { getPartyUiCopy } from "@/lib/party-runtime/copy";
import {
  useHostCapabilities,
  usePartyActions,
  usePartyRuntime,
  usePartySnapshot,
  useSharedPartyProjection
} from "@/lib/party-runtime/runtime-provider";

export function HostControlPanel({ locale }: { locale: Locale }) {
  const copy = getPartyUiCopy(locale);
  const actions = usePartyActions();
  const runtime = usePartyRuntime();
  const capabilities = useHostCapabilities();
  const snapshot = usePartySnapshot();
  const projection = useSharedPartyProjection();
  const question =
    snapshot.state.currentQuestionIndex === null
      ? null
      : runtime.getConfig().questions[snapshot.state.currentQuestionIndex] ?? null;

  function simulate(correct: boolean) {
    if (!question) {
      return;
    }

    const selectedOptionId = correct
      ? question.correctOptionId
      : (question.options.find((option) => option.id !== question.correctOptionId)?.id ??
        question.correctOptionId);

    actions.submitResponse(
      "test-guest-01",
      question.id,
      selectedOptionId,
      `qa:test-guest-01:${question.id}:${selectedOptionId}`
    );
  }

  return (
    <PaperPanel tone="admin" className="h-full">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Settings2 className="h-6 w-6 text-party-blue-deep" aria-hidden="true" />
          <div>
            <BirthdayBadge tone="blue">{copy.developmentLabel}</BirthdayBadge>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground">
              {copy.hostControls}
            </h2>
          </div>
        </div>

        <div className="grid gap-2" data-testid="host-controls">
          <Button
            type="button"
            disabled={!capabilities.canPrepareFirstQuestion}
            onClick={actions.prepareFirstQuestion}
            data-testid="host-prepare-first"
          >
            {copy.prepareFirst}
          </Button>
          <Button
            type="button"
            disabled={!capabilities.canRevealChoices}
            onClick={actions.revealChoices}
            data-testid="host-reveal-choices"
          >
            {copy.revealChoices}
          </Button>
          <Button
            type="button"
            disabled={!capabilities.canRevealAnswer}
            onClick={actions.revealAnswer}
            data-testid="host-reveal-answer"
          >
            {copy.revealAnswer}
          </Button>
          <Button
            type="button"
            disabled={!capabilities.canShowLeaderboard}
            onClick={actions.showLeaderboard}
            data-testid="host-show-leaderboard"
          >
            {copy.showLeaderboard}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!capabilities.canAdvanceFromLeaderboard}
            onClick={actions.advanceFromLeaderboard}
            data-testid="host-advance-leaderboard"
          >
            {projection.questionNumber === projection.totalQuestions
              ? copy.showWinner
              : copy.nextQuestion}
          </Button>
          <Button
            type="button"
            disabled={!capabilities.canPrepareNextQuestion}
            onClick={actions.prepareNextQuestion}
            data-testid="host-prepare-next"
          >
            {copy.prepareNext}
          </Button>
          <Button
            type="button"
            disabled={!capabilities.canFinishParty}
            onClick={actions.finishParty}
            data-testid="host-finish-party"
          >
            {copy.finishParty}
          </Button>
        </div>

        <div className="grid gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={snapshot.state.phase !== "question_active"}
            onClick={() => simulate(true)}
            data-testid="host-simulate-correct"
          >
            {copy.simulateCorrect}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={snapshot.state.phase !== "question_active"}
            onClick={() => simulate(false)}
            data-testid="host-simulate-wrong"
          >
            {copy.simulateWrong}
          </Button>
        </div>

        <div className="rounded-[1rem] border border-border bg-surface-deep/70 p-4 text-sm font-bold leading-7">
          <p>
            {copy.phase}: {snapshot.state.phase}
          </p>
          <p>
            {copy.revision}: {snapshot.state.revision}
          </p>
          <p>
            {copy.currentQuestion}: {snapshot.state.currentQuestionId ?? "-"}
          </p>
          <p>
            {copy.lastCommand}: {snapshot.state.lastAcceptedCommand ?? "-"}
          </p>
          <p>
            {copy.lastError}: {snapshot.state.lastError?.code ?? "-"}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={actions.resetLocalParty}
          data-testid="host-reset"
        >
          <RotateCcw aria-hidden="true" />
          {copy.reset}
        </Button>
      </div>
    </PaperPanel>
  );
}
