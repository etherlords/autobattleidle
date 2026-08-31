import { afterEach, describe, expect, it, vi } from "vitest";
import { LeaderboardProgressSync } from "./leaderboard-progress-sync";

afterEach(() => vi.useRealTimers());

describe("LeaderboardProgressSync", () => {
  it("submits dirty progress once after five minutes without ordinary-level spam", async () => {
    vi.useFakeTimers();
    const submit = vi.fn(async () => undefined);
    const sync = new LeaderboardProgressSync({ submit }, 300_000);
    sync.observe({ goldenBugs: 0, level: 2 });
    await vi.advanceTimersByTimeAsync(300_000);
    expect(submit).toHaveBeenCalledTimes(1);
    sync.observe({ goldenBugs: 1, level: 3 });
    await vi.advanceTimersByTimeAsync(299_999);
    expect(submit).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it("restarts five minutes after a successful boss-triggered submission", async () => {
    vi.useFakeTimers();
    const submit = vi.fn(async () => undefined);
    const sync = new LeaderboardProgressSync({ submit }, 300_000);
    sync.observe({ goldenBugs: 0, level: 1 });
    await vi.advanceTimersByTimeAsync(150_000);
    sync.defeatedBoss();
    await Promise.resolve();
    sync.observe({ goldenBugs: 0, level: 2 });
    await vi.advanceTimersByTimeAsync(150_000);
    expect(submit).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(149_999);
    expect(submit).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it("retains failed progress and retries only after the bounded interval", async () => {
    vi.useFakeTimers();
    const submit = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const sync = new LeaderboardProgressSync({ submit }, 300_000);
    sync.observe({ goldenBugs: 1, level: 2 });
    await vi.advanceTimersByTimeAsync(300_000);
    expect(submit).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(299_999);
    expect(submit).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it("sends immediately for bosses, coalesces in flight, retries failures, and disposes", async () => {
    vi.useFakeTimers();
    let resolve: (() => void) | undefined;
    const pending = new Promise<void>((done) => {
      resolve = done;
    });
    const submit = vi.fn(() => pending);
    const sync = new LeaderboardProgressSync({ submit }, 300_000);
    sync.observe({ goldenBugs: 0, level: 1 });
    sync.defeatedBoss();
    sync.observe({ goldenBugs: 1, level: 2 });
    sync.defeatedBoss();
    expect(submit).toHaveBeenCalledTimes(1);
    resolve?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(submit).toHaveBeenCalledTimes(2);
    sync.dispose();
    await vi.advanceTimersByTimeAsync(300_000);
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it("clears a pending timer on disposal", async () => {
    vi.useFakeTimers();
    const submit = vi.fn(async () => undefined);
    const sync = new LeaderboardProgressSync({ submit }, 300_000);
    sync.observe({ goldenBugs: 0, level: 1 });
    sync.dispose();
    await vi.advanceTimersByTimeAsync(300_000);
    expect(submit).not.toHaveBeenCalled();
  });
});
