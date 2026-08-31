export type ProgressSnapshot = { readonly goldenBugs: number; readonly level: number };

export type ProgressSubmitter = { submit(level: number, goldenBugs: number): Promise<void> };

export class LeaderboardProgressSync {
  private dirty = false;
  private disposed = false;
  private inFlight = false;
  private bossQueued = false;
  private latest: ProgressSnapshot = { goldenBugs: 0, level: 0 };
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly submitter: ProgressSubmitter,
    private readonly delayMs = 300_000,
  ) {}

  observe(snapshot: ProgressSnapshot): void {
    if (snapshot.level <= this.latest.level && snapshot.goldenBugs <= this.latest.goldenBugs)
      return;
    this.latest = {
      goldenBugs: Math.max(this.latest.goldenBugs, snapshot.goldenBugs),
      level: Math.max(this.latest.level, snapshot.level),
    };
    this.dirty = true;
    this.schedule();
  }

  defeatedBoss(): void {
    if (this.inFlight) {
      this.bossQueued = true;
      return;
    }
    void this.send();
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer !== undefined) clearTimeout(this.timer);
  }

  private schedule(): void {
    if (this.timer !== undefined || this.disposed) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.send();
    }, this.delayMs);
  }

  private async send(): Promise<void> {
    if (this.inFlight || !this.dirty || this.disposed) return;
    this.inFlight = true;
    const sent = this.latest;
    try {
      await this.submitter.submit(sent.level, sent.goldenBugs);
      if (this.timer !== undefined) {
        clearTimeout(this.timer);
        this.timer = undefined;
      }
      this.dirty = this.latest.level > sent.level || this.latest.goldenBugs > sent.goldenBugs;
      if (this.bossQueued && this.dirty) {
        this.bossQueued = false;
        this.inFlight = false;
        await this.send();
        return;
      }
      this.bossQueued = false;
    } catch {
      // Keep dirty progress and retry once per bounded interval.
    } finally {
      this.inFlight = false;
      if (this.dirty) this.schedule();
    }
  }
}
