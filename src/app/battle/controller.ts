import { attack as resolveAttack, expireGoldenBug, purchaseUpgrade } from "../../domain/combat";
import { COMBAT_BALANCE } from "../../domain/combat";
import type { AttackEvent, AttackSource, CombatState, UpgradeId } from "../../domain/combat";
import type { BattleEvent } from "../../domain/snapshot";
import { battleEventMessages } from "./presenter";
import type {
  BattleCommand,
  BattleCommandContext,
  BattleControllerEvent,
  BattleControllerListener,
  BattleControllerOptions,
  BattleUpdate,
  Unsubscribe,
} from "./contracts";

const EVENT_HISTORY_LIMIT = 6;

export class BattleController {
  private readonly commandContext: BattleCommandContext = {
    attack: (source) => this.performAttack(source),
    frame: (nowMs) => this.performFrame(nowMs),
    purchase: (id, quantity) => this.performPurchase(id, quantity),
    reset: () => this.performReset(),
    restore: (state) => this.performRestore(state),
  };
  private disposed = false;
  private events: readonly BattleEvent[] = [];
  private readonly listeners = new Set<BattleControllerListener>();
  private nextEventId = 1;
  private nowMs: number;
  private state: CombatState;
  private goldenBugDeadlineMs: number | undefined;
  private goldenBugDeadlineEventId: number | undefined;

  constructor(private readonly options: BattleControllerOptions) {
    this.nowMs = options.initialNowMs;
    this.state = options.initialState;
    this.syncGoldenBugDeadline();
  }

  dispatch(command: BattleCommand): boolean {
    if (this.disposed) return false;
    return command.execute(this.commandContext);
  }

  subscribe(listener: BattleControllerListener): Unsubscribe {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  currentUpdate(): BattleUpdate {
    return this.update();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.listeners.clear();
  }

  private performAttack(source: AttackSource): boolean {
    if (this.expireGoldenBug())
      return this.publishMessage(
        { ...this.update(true), automaticOutcome: null, type: "frame" },
        "Golden Bug escaped.",
      );
    const result = resolveAttack(this.state, {
      atMs: this.nowMs,
      enemyId: this.state.enemy.id,
      rolls: this.options.rolls(),
      source,
    });
    this.state = result.state;
    this.syncGoldenBugDeadline();
    if (result.event.type === "ignored") return false;
    return this.publishMessage(
      {
        ...this.update(true),
        outcome: result.event,
        source,
        type: "attack",
      },
      battleEventMessages.attack(source, result.event),
    );
  }

  private performFrame(nowMs: number): boolean {
    this.nowMs = nowMs;
    if (this.expireGoldenBug())
      return this.publishMessage(
        { ...this.update(true), automaticOutcome: null, type: "frame" },
        "Golden Bug escaped.",
      );
    if (!this.state.automaticUnlocked || this.nowMs < this.state.nextAutomaticAttackAtMs)
      return false;
    const automaticOutcome = this.automaticAttack();
    if (automaticOutcome.type === "ignored") return false;
    return this.publishMessage(
      {
        ...this.update(true),
        automaticOutcome,
        type: "frame",
      },
      battleEventMessages.frame(automaticOutcome),
    );
  }

  private automaticAttack(): AttackEvent {
    const result = resolveAttack(this.state, {
      atMs: this.nowMs,
      enemyId: this.state.enemy.id,
      rolls: this.options.rolls(),
      source: "automatic",
    });
    this.state = result.state;
    this.syncGoldenBugDeadline();
    return result.event;
  }

  private performPurchase(id: UpgradeId, quantity: number): boolean {
    const requestedQuantity = Math.min(100, Math.max(1, Math.floor(quantity)));
    let successfulPurchases = 0;
    let reason: string | null = null;
    for (let index = 0; index < requestedQuantity; index += 1) {
      const result = purchaseUpgrade(this.state, id, this.nowMs);
      if (result.reason !== null) {
        reason = result.reason;
        break;
      }
      this.state = result.state;
      successfulPurchases += 1;
      this.addEvent(battleEventMessages.purchase(id, null));
    }
    if (successfulPurchases === 0) return false;
    return this.publish({
      ...this.update(true),
      id,
      quantity: successfulPurchases,
      reason,
      type: "purchase",
    });
  }

  private performReset(): boolean {
    this.state = this.options.createInitialState();
    this.resetEvents();
    this.syncGoldenBugDeadline();
    return this.publishMessage({ ...this.update(), type: "reset" }, battleEventMessages.reset());
  }

  private performRestore(state: CombatState): boolean {
    this.state = state;
    this.resetEvents();
    this.syncGoldenBugDeadline();
    return this.publishMessage(
      { ...this.update(), type: "restore" },
      battleEventMessages.restore(),
    );
  }

  private update(persistenceChanged = false): BattleUpdate {
    return {
      events: this.events,
      goldenBugRemainingMs:
        this.goldenBugDeadlineMs === undefined
          ? null
          : Math.max(0, this.goldenBugDeadlineMs - this.nowMs),
      nowMs: this.nowMs,
      persistenceChanged,
      state: this.state,
    };
  }

  private expireGoldenBug(): boolean {
    if (
      this.state.goldenBug === null ||
      this.goldenBugDeadlineMs === undefined ||
      this.nowMs < this.goldenBugDeadlineMs
    )
      return false;
    this.state = expireGoldenBug(this.state);
    this.goldenBugDeadlineMs = undefined;
    this.goldenBugDeadlineEventId = undefined;
    return true;
  }

  private syncGoldenBugDeadline(): void {
    if (this.state.goldenBug === null) {
      this.goldenBugDeadlineMs = undefined;
      this.goldenBugDeadlineEventId = undefined;
      return;
    }
    if (this.goldenBugDeadlineEventId === this.state.goldenBug.id) return;
    this.goldenBugDeadlineEventId = this.state.goldenBug.id;
    this.goldenBugDeadlineMs = this.nowMs + COMBAT_BALANCE.goldenBugWindowMs;
  }

  private publishMessage(event: BattleControllerEvent, message: string | undefined): boolean {
    if (message !== undefined) this.addEvent(message);
    return this.publish({ ...event, events: this.events });
  }

  private publish(event: BattleControllerEvent): boolean {
    for (const listener of [...this.listeners]) listener(event);
    return true;
  }

  private addEvent(message: string): void {
    this.events = [...this.events, { id: this.nextEventId, message }].slice(-EVENT_HISTORY_LIMIT);
    this.nextEventId += 1;
  }

  private resetEvents(): void {
    this.events = [];
    this.nextEventId = 1;
  }
}
