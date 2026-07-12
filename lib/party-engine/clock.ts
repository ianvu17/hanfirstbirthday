export type CancellationHandle = {
  cancel: () => void;
};

export interface PartyClock {
  now(): number;
  scheduleDeadline(deadlineAt: number, callback: () => void): CancellationHandle;
}

export class SystemPartyClock implements PartyClock {
  now() {
    return Date.now();
  }

  scheduleDeadline(deadlineAt: number, callback: () => void): CancellationHandle {
    const delay = Math.max(0, deadlineAt - this.now());
    const timeoutId = window.setTimeout(callback, delay);

    return {
      cancel: () => window.clearTimeout(timeoutId)
    };
  }
}

export class ManualPartyClock implements PartyClock {
  private currentTime: number;
  private scheduled: Array<{ deadlineAt: number; callback: () => void; cancelled: boolean }> =
    [];

  constructor(startAt = 0) {
    this.currentTime = startAt;
  }

  now() {
    return this.currentTime;
  }

  scheduleDeadline(deadlineAt: number, callback: () => void): CancellationHandle {
    const item = { deadlineAt, callback, cancelled: false };
    this.scheduled.push(item);

    return {
      cancel: () => {
        item.cancelled = true;
      }
    };
  }

  advance(ms: number) {
    this.currentTime += ms;
    const due = this.scheduled
      .filter((item) => !item.cancelled && item.deadlineAt <= this.currentTime)
      .sort((a, b) => a.deadlineAt - b.deadlineAt);

    for (const item of due) {
      item.cancelled = true;
      item.callback();
    }
  }
}
