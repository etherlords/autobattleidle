import { attack as resolveAttack, expireGoldenBug, purchaseUpgrade } from "../../domain/combat";
import { COMBAT_BALANCE, resolveAutomaticPackets } from "../../domain/combat";
import type { AttackEvent, AttackSource, CombatState, UpgradeId } from "../../domain/combat";
import type { BattleAttackMetadata, BattleEvent } from "../../domain/snapshot";
import { battleEventMessages, type AttackLogComposition } from "./presenter";
import type {
  BattleCommand,
  BattleCommandContext,
  BattleControllerEvent,
  BattleControllerListener,
  BattleControllerOptions,
  BattleUpdate,
  AutomaticAttackReceipt,
  Unsubscribe,
} from "./contracts";

const EVENT_HISTORY_LIMIT = 6;

export class BattleController {
  private readonly commandContext: BattleCommandContext = {
    attack: (source) => this.performAttack(source),
    toggleAutomaticPause: () => this.toggleAutomaticPause(),
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
  private automaticPaused = false;
  private pausedAutomaticRemainingMs = 0;

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
    const expiredEnemy = this.state.enemy;
    if (this.expireGoldenBug())
      return this.publishMessage(
        {
          ...this.update(true),
          automaticOutcome: null,
          goldenBugEscaped: true,
          previousEnemy: expiredEnemy,
          type: "frame",
        },
        "Golden Bug escaped.",
      );
    const previousEnemy = this.state.enemy;
    const goldenBugBefore = this.state.goldenBug !== null;
    const result = resolveAttack(this.state, {
      atMs: this.nowMs,
      enemyId: this.state.enemy.id,
      rolls: this.options.rolls(),
      source,
    });
    this.state = result.state;
    this.syncGoldenBugDeadline();
    if (result.event.type === "ignored") return false;
    const outcome = result.event;
    this.addEvent(battleEventMessages.attack(outcome, goldenBugBefore), {
      kind: outcome.critical ? "critical" : "hit",
      source,
      packets: { count: 1, units: 1 },
      damage: outcome.damage,
      defeated: outcome.defeated,
    });
    return this.publish({
      ...this.update(true),
      outcome: result.event,
      goldenBugBefore,
      previousEnemy,
      source,
      type: "attack",
    });
  }

  private performFrame(nowMs: number): boolean {
    this.nowMs = nowMs;
    const expiredEnemy = this.state.enemy;
    if (this.expireGoldenBug())
      return this.publishMessage(
        {
          ...this.update(true),
          automaticOutcome: null,
          goldenBugEscaped: true,
          previousEnemy: expiredEnemy,
          type: "frame",
        },
        "Golden Bug escaped.",
      );
    if (
      this.automaticPaused ||
      !this.state.automaticUnlocked ||
      this.nowMs < this.state.nextAutomaticAttackAtMs
    )
      return false;
    const previousEnemy = this.state.enemy;
    const goldenBugBefore = this.state.goldenBug !== null;
    const { outcome: automaticOutcome, receipt: automaticReceipt } = this.automaticAttack();
    if (automaticOutcome.type === "ignored") return false;
    const composition: AttackLogComposition = {
      kind: automaticOutcome.critical ? "critical" : "hit",
      packets: automaticReceipt,
      baseDamage: this.state.player.damage,
    };
    this.addEvent(battleEventMessages.frame(automaticOutcome, goldenBugBefore, composition) ?? "", {
      kind: composition.kind,
      source: "automatic",
      packets: automaticReceipt,
      damage: automaticOutcome.damage,
      defeated: automaticOutcome.defeated,
    });
    return this.publish({
      ...this.update(true),
      automaticOutcome,
      automaticReceipt,
      goldenBugBefore,
      previousEnemy,
      type: "frame",
    });
  }

  private automaticAttack(): {
    readonly outcome: { readonly type: "ignored" } | Extract<AttackEvent, { type: "hit" }>;
    readonly receipt: AutomaticAttackReceipt;
  } {
    const resolution = resolveAutomaticPackets(this.state, this.nowMs, (state, packet) =>
      resolveAttack(state, {
        atMs: this.nowMs,
        ...packet,
        enemyId: state.enemy.id,
        rolls: this.options.rolls(),
        source: "automatic",
      }),
    );
    this.state = resolution.state;
    this.syncGoldenBugDeadline();
    const outcomes = resolution.events;
    const hits = outcomes.filter(
      (outcome): outcome is Exclude<AttackEvent, { type: "ignored" }> => outcome.type === "hit",
    );
    const receipt = {
      count: resolution.schedule.packets.length,
      units: resolution.schedule.packets.reduce(
        (total, packet) => total + packet.damageMultiplier,
        0,
      ),
    };
    if (hits.length === 0) return { outcome: { type: "ignored" }, receipt };
    return {
      outcome: {
        armorPreventedDamage: hits.reduce(
          (total, outcome) => total + outcome.armorPreventedDamage,
          0,
        ),
        critical: hits.some((outcome) => outcome.critical),
        damage: hits.reduce((total, outcome) => total + outcome.damage, 0),
        defeated: hits.some((outcome) => outcome.defeated),
        penetration: hits.at(-1)?.penetration ?? 0,
        reward: hits.reduce((total, outcome) => total + outcome.reward, 0),
        type: "hit",
      },
      receipt,
    };
  }

  private toggleAutomaticPause(): boolean {
    if (!this.state.automaticUnlocked) return false;
    if (this.automaticPaused) {
      this.state = {
        ...this.state,
        nextAutomaticAttackAtMs: this.nowMs + this.pausedAutomaticRemainingMs,
      };
      this.automaticPaused = false;
      this.pausedAutomaticRemainingMs = 0;
    } else {
      this.pausedAutomaticRemainingMs = Math.max(
        0,
        this.state.nextAutomaticAttackAtMs - this.nowMs,
      );
      this.automaticPaused = true;
    }
    return this.publish({ ...this.update(), type: "toggle-automatic-pause" });
  }

  private performPurchase(id: UpgradeId, quantity: number): boolean {
    const requestedQuantity = Math.min(1_000, Math.max(1, Math.floor(quantity)));
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
    this.automaticPaused = false;
    this.pausedAutomaticRemainingMs = 0;
    this.syncGoldenBugDeadline();
    return this.publishMessage({ ...this.update(), type: "reset" }, battleEventMessages.reset());
  }

  private performRestore(state: CombatState): boolean {
    this.state = state;
    this.resetEvents();
    this.automaticPaused = false;
    this.pausedAutomaticRemainingMs = 0;
    this.syncGoldenBugDeadline();
    return this.publishMessage(
      { ...this.update(), type: "restore" },
      battleEventMessages.restore(),
    );
  }

  private update(persistenceChanged = false): BattleUpdate {
    let automaticRemainingMs = 0;
    if (this.automaticPaused) automaticRemainingMs = this.pausedAutomaticRemainingMs;
    else if (this.state.automaticUnlocked)
      automaticRemainingMs = Math.max(0, this.state.nextAutomaticAttackAtMs - this.nowMs);
    return {
      events: this.events,
      goldenBugRemainingMs:
        this.goldenBugDeadlineMs === undefined
          ? null
          : Math.max(0, this.goldenBugDeadlineMs - this.nowMs),
      automaticPaused: this.automaticPaused,
      automaticRemainingMs,
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

  private addEvent(message: string, attack?: BattleAttackMetadata): void {
    const event: BattleEvent =
      attack === undefined
        ? { id: this.nextEventId, message }
        : { id: this.nextEventId, message, attack };
    this.events = [...this.events, event].slice(-EVENT_HISTORY_LIMIT);
    this.nextEventId += 1;
  }

  private resetEvents(): void {
    this.events = [];
    this.nextEventId = 1;
  }
}
