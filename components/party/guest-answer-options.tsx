"use client";

import { Check, CheckCircle2, LockKeyhole, XCircle } from "lucide-react";

import type { GuestProjection, PublicPartyQuestion } from "@/lib/party-engine";
import type { Locale } from "@/lib/i18n/routing";
import type { PartyUiCopy } from "@/lib/party-runtime/copy";

export function GuestAnswerOptions({
  question,
  locale,
  copy,
  projection,
  selectedOptionId,
  canChangeSelection,
  onSelect
}: {
  question: PublicPartyQuestion;
  locale: Locale;
  copy: PartyUiCopy;
  projection: GuestProjection;
  selectedOptionId: string | null;
  canChangeSelection: boolean;
  onSelect: (optionId: string) => void;
}) {
  const locked = projection.lockedResponse;

  return (
    <div
      className="grid gap-2 [@media(max-height:620px)]:gap-1.5 sm:gap-3"
      role="radiogroup"
      aria-label={copy.selectAnswer}
    >
      {question.options.map((option) => {
        const selected = selectedOptionId === option.id;
        const wasLocked = locked?.selectedOptionId === option.id;
        const isCorrect = projection.reveal?.correctOptionId === option.id;
        const isWrongReveal =
          projection.reveal?.status === "incorrect" &&
          projection.reveal.selectedOptionId === option.id;
        const revealLabel = isCorrect
          ? copy.correctAnswer
          : isWrongReveal
            ? copy.yourAnswer
            : null;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected || wasLocked}
            aria-label={revealLabel ? `${revealLabel}: ${option.label[locale]}` : option.label[locale]}
            disabled={!canChangeSelection}
            onClick={() => onSelect(option.id)}
            className={`min-h-11 rounded-[1rem] border px-3 py-2 text-left text-sm font-extrabold leading-5 shadow-lift transition [@media(max-height:620px)]:leading-[1.15] sm:min-h-14 sm:px-4 sm:py-3 sm:text-base ${
              isCorrect
                ? "border-party-green bg-party-green/20 shadow-[0_0_0_3px_hsl(var(--party-green)/0.12)]"
                : isWrongReveal
                  ? "border-party-red/55 bg-party-red/10"
                  : selected || wasLocked
                    ? "border-party-blue-deep bg-surface-sky"
                    : "border-border bg-surface-paper"
            } disabled:cursor-not-allowed disabled:opacity-100`}
          >
            {revealLabel ? (
              <span
                className={`mb-1 flex items-center gap-1.5 text-[0.7rem] font-extrabold uppercase tracking-wide ${
                  isCorrect ? "text-[#24704d]" : "text-party-red"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                )}
                {revealLabel}
              </span>
            ) : null}
            <span className="flex items-center justify-between gap-3">
              <span>{option.label[locale]}</span>
              {!projection.reveal && wasLocked ? (
                <LockKeyhole className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : null}
              {!projection.reveal && selected && !wasLocked ? (
                <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
