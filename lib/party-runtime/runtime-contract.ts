import type { CancellationHandle, PartyClock } from "@/lib/party-engine/clock";
import {
  createInitialPartyState,
  processPartyCommand,
  type PartyCommand,
  type PartyCommandResult,
  type PartyConfig,
  type PartySnapshot,
  type PartyState
} from "@/lib/party-engine";

export type RuntimePartyCommand = PartyCommand extends infer Command
  ? Command extends { type: string }
    ? Omit<Command, "now" | "receivedAt">
    : never
  : never;

export interface PartyRuntime {
  getConfig(): PartyConfig;
  getSnapshot(): PartySnapshot;
  subscribe(listener: () => void): () => void;
  dispatch(command: RuntimePartyCommand): PartyCommandResult;
  reset(): PartyCommandResult;
  notifyClockTick(): void;
}

export class LocalPartyRuntime implements PartyRuntime {
  private state: PartyState;
  private snapshot: PartySnapshot;
  private deadlineHandle: CancellationHandle | null = null;
  private listeners = new Set<() => void>();

  constructor(
    private readonly config: PartyConfig,
    private readonly clock: PartyClock
  ) {
    this.state = createInitialPartyState(config);
    this.snapshot = {
      state: this.state,
      now: this.clock.now()
    };
  }

  getConfig() {
    return this.config;
  }

  getSnapshot(): PartySnapshot {
    return this.snapshot;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(command: RuntimePartyCommand): PartyCommandResult {
    const now = this.clock.now();
    const timedCommand =
      command.type === "SUBMIT_RESPONSE"
        ? { ...command, receivedAt: now }
        : { ...command, now };
    const result = processPartyCommand(this.state, timedCommand as PartyCommand, this.config);

    this.state = result.state;
    this.rescheduleDeadline();
    this.emit();

    return result;
  }

  reset() {
    const result = processPartyCommand(
      this.state,
      { type: "RESET_LOCAL_PARTY", now: this.clock.now() },
      this.config
    );

    this.state = result.state;
    this.rescheduleDeadline();
    this.emit();

    return result;
  }

  notifyClockTick() {
    this.emit();
  }

  private rescheduleDeadline() {
    this.deadlineHandle?.cancel();
    this.deadlineHandle = null;

    if (this.state.phase !== "question_active" || this.state.questionDeadlineAt === null) {
      return;
    }

    this.deadlineHandle = this.clock.scheduleDeadline(this.state.questionDeadlineAt, () => {
      if (this.state.phase !== "question_active") {
        return;
      }

      const result = processPartyCommand(
        this.state,
        { type: "LOCK_QUESTION", now: this.clock.now(), reason: "deadline" },
        this.config
      );

      this.state = result.state;
      this.deadlineHandle = null;
      this.emit();
    });
  }

  private emit() {
    this.snapshot = {
      state: this.state,
      now: this.clock.now()
    };

    for (const listener of this.listeners) {
      listener();
    }
  }
}
