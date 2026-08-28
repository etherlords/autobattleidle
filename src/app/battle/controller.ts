import { attack, purchaseUpgrade } from "../../domain/combat";
import type { AttackEvent, AttackSource, CombatState, UpgradeId } from "../../domain/combat";
import type { BattleEvent } from "../../domain/snapshot";
import { battleEventMessage } from "./presenter";
import type {
  BattleCommand,
  BattleControllerEvent,
  BattleControllerListener,
  BattleControllerOptions,
  BattleUpdate,
  Unsubscribe,
} from "./contracts";

const EVENT_HISTORY_LIMIT = 6;

export class BattleController {
  private disposed = false;
  private events: readonly BattleEvent[] = [];
  private readonly listeners = new Set<BattleControllerListener>();
  private nextEventId = 1;
  private nowMs: number;
  private state: CombatState;

  constructor(private readonly options: BattleControllerOptions) {
    this.nowMs = options.initialNowMs;
    this.state = options.initialState;
  }

  dispatch(command: BattleCommand): boolean {
    if (this.disposed) return false;
    switch (command.type) {
      case "attack":
        return this.performAttack(command.source);
      case "frame":
        return this.performFrame(command.nowMs);
      case "purchase":
        return this.performPurchase(command.id);
      case "reset":
        this.state = this.options.createInitialState();
        this.resetEvents();
        return this.publish({ ...this.update(), type: "reset" });
      case "restore":
        this.state = command.state;
        this.resetEvents();
        return this.publish({ ...this.update(), type: "restore" });
    }
    const exhaustiveCommand: never = command;
    return exhaustiveCommand;
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
    const result = attack(this.state, {
      atMs: this.nowMs,
      enemyId: this.state.enemy.id,
      rolls: this.options.rolls(),
      source,
    });
    this.state = result.state;
    if (result.event.type === "ignored") return false;
    return this.publishMessage({
      ...this.update(true),
      outcome: result.event,
      source,
      type: "attack",
    });
  }

  private performFrame(nowMs: number): boolean {
    this.nowMs = nowMs;
    if (!this.state.automaticUnlocked || this.nowMs < this.state.nextAutomaticAttackAtMs)
      return false;
    const automaticOutcome = this.automaticAttack();
    if (automaticOutcome.type === "ignored") return false;
    return this.publishMessage({
      ...this.update(true),
      automaticOutcome,
      type: "frame",
    });
  }

  private automaticAttack(): AttackEvent {
    const result = attack(this.state, {
      atMs: this.nowMs,
      enemyId: this.state.enemy.id,
      rolls: this.options.rolls(),
      source: "automatic",
    });
    this.state = result.state;
    return result.event;
  }

  private performPurchase(id: UpgradeId): boolean {
    const result = purchaseUpgrade(this.state, id, this.nowMs);
    this.state = result.state;
    return this.publishMessage({
      ...this.update(result.reason === null),
      id,
      reason: result.reason,
      type: "purchase",
    });
  }

  private update(persistenceChanged = false): BattleUpdate {
    return { events: this.events, nowMs: this.nowMs, persistenceChanged, state: this.state };
  }

  private publishMessage(event: BattleControllerEvent): boolean {
    const message = battleEventMessage(event);
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
