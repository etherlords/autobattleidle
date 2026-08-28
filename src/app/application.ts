import {
  attack,
  createCombatState,
  purchaseUpgrade,
  UPGRADES,
  upgradeCost,
  upgradeDisabledReason,
  upgradeLevel,
  type AttackRolls,
  type CombatState,
  type UpgradeId,
} from "../domain/combat";
import { createBattleSnapshot, type BattleEvent, type BattleSnapshot } from "../domain/snapshot";
import { createBattlefield, type Battlefield } from "../game/battlefield";
import {
  createPersistenceBoundary,
  type PersistenceBoundary,
} from "../persistence/persistence-boundary";
import { createHud, type Hud } from "../ui/hud";

type AnimationFrameHost = {
  addEventListener(type: "resize", listener: EventListenerOrEventListenerObject): void;
  cancelAnimationFrame(handle: number): void;
  removeEventListener(type: "resize", listener: EventListenerOrEventListenerObject): void;
  requestAnimationFrame(callback: FrameRequestCallback): number;
  confirm?(message: string): boolean;
};

export type Application = { dispose(): void };
export type ApplicationDependencies = {
  readonly window: AnimationFrameHost;
  readonly createGame: (host: HTMLElement) => Battlefield;
  readonly createHud: (host: HTMLElement, battlefield: HTMLElement) => Hud;
  readonly createPersistence: () => PersistenceBoundary;
  readonly rolls: () => AttackRolls;
  readonly initialState: CombatState;
  readonly createInitialState?: () => CombatState;
  readonly now?: () => number;
};

type LifecycleDependencies = Omit<
  ApplicationDependencies,
  "createGame" | "createHud" | "createPersistence"
> & {
  readonly game: Battlefield;
  readonly hud: Hud;
  readonly persistence: PersistenceBoundary;
  readonly viewport: () => { readonly width: number; readonly height: number };
  readonly onDispose: () => void;
  readonly initialNowMs?: number;
};

const browserDependencies = (): ApplicationDependencies => {
  const createInitialState = (): CombatState =>
    createCombatState(
      { automaticSpeedLevel: 0, criticalChance: 0, damage: 1, doubleRewardChance: 0 },
      Math.random(),
      false,
    );
  return {
    window,
    createGame: createBattlefield,
    createHud,
    createInitialState,
    createPersistence: createPersistenceBoundary,
    initialState: createInitialState(),
    now: () => performance.now(),
    rolls: () => ({
      critical: Math.random(),
      doubleReward: Math.random(),
      nextEliteModifier: Math.random(),
    }),
  };
};

export const createApplication = (
  root: HTMLElement,
  dependencies: ApplicationDependencies = browserDependencies(),
): Application => {
  const persistence = dependencies.createPersistence();
  const initialNowMs = dependencies.now?.() ?? 0;
  const initialState = persistence.load(dependencies.initialState, initialNowMs);
  const battlefieldHost = document.createElement("div");
  battlefieldHost.className = "battlefield";
  root.replaceChildren(battlefieldHost);
  const game = dependencies.createGame(battlefieldHost);
  const hud = dependencies.createHud(root, battlefieldHost);
  return startApplication({
    initialState,
    initialNowMs,
    rolls: dependencies.rolls,
    game,
    hud,
    persistence,
    onDispose: () => root.replaceChildren(),
    viewport: () => ({
      width: battlefieldHost.clientWidth,
      height: battlefieldHost.clientHeight,
    }),
    window: dependencies.window,
  });
};

export const startApplication = (dependencies: LifecycleDependencies): Application => {
  let frame: number | undefined;
  let disposed = false;
  let nowMs = dependencies.initialNowMs ?? 0;
  let nextEventId = 1;
  let state = dependencies.initialState;
  const newGame = (): CombatState =>
    dependencies.createInitialState?.() ?? dependencies.initialState;
  let events: readonly BattleEvent[] = [];
  const addEvent = (message: string): void => {
    events = [...events, { id: nextEventId, message }].slice(-6);
    nextEventId += 1;
  };
  const snapshot = (): BattleSnapshot =>
    createBattleSnapshot(
      state,
      nowMs,
      events,
      UPGRADES.map((upgrade) => ({
        cost: upgradeCost(state, upgrade.id),
        disabledReason: upgradeDisabledReason(state, upgrade.id),
        id: upgrade.id,
        label: upgrade.label,
        level: upgradeLevel(state, upgrade.id),
      })),
    );
  const render = (): void => {
    const current = snapshot();
    dependencies.game.render(current);
    dependencies.hud.render(current);
  };
  const performAttack = (source: "manual" | "automatic"): void => {
    const result = attack(state, {
      atMs: nowMs,
      enemyId: state.enemy.id,
      rolls: dependencies.rolls(),
      source,
    });
    state = result.state;
    if (result.event.type !== "hit") return;
    addEvent(
      result.event.defeated
        ? `${source === "manual" ? "Manual" : "Automatic"} kill: +${result.event.reward} coins`
        : `${source === "manual" ? "Manual" : "Automatic"} hit: ${result.event.damage} damage`,
    );
    dependencies.persistence.onStateChanged(state);
  };
  const purchase = (id: UpgradeId): void => {
    const result = purchaseUpgrade(state, id, nowMs);
    state = result.state;
    addEvent(
      result.reason === null
        ? `Purchased ${UPGRADES.find((entry) => entry.id === id)?.label ?? id}`
        : result.reason,
    );
    if (result.reason === null) dependencies.persistence.onStateChanged(state);
    render();
  };
  const resize = (): void => {
    const viewport = dependencies.viewport();
    dependencies.game.resize(viewport.width, viewport.height);
  };
  const draw = (timestamp: number): void => {
    nowMs = timestamp;
    if (state.automaticUnlocked && nowMs >= state.nextAutomaticAttackAtMs)
      performAttack("automatic");
    render();
    frame = dependencies.window.requestAnimationFrame(draw);
  };
  resize();
  dependencies.hud.onAttack(() => {
    performAttack("manual");
    render();
  });
  dependencies.hud.onUpgrade(purchase);
  dependencies.hud.onReset(() => {
    if (dependencies.window.confirm?.("Reset all saved progress?") !== true) return;
    dependencies.persistence.reset();
    state = newGame();
    events = [];
    nextEventId = 1;
    render();
  });
  dependencies.hud.setRestoreAvailable(dependencies.persistence.hasPreviousVersionSave());
  dependencies.hud.onRestore(() => {
    const restored = dependencies.persistence.restorePreviousVersion(nowMs);
    dependencies.hud.reportPersistence(restored.message);
    if (restored.state === undefined) return;
    state = restored.state;
    events = [];
    nextEventId = 1;
    render();
  });
  render();
  dependencies.window.addEventListener("resize", resize);
  frame = dependencies.window.requestAnimationFrame(draw);
  return {
    dispose: () => {
      if (disposed) return;
      disposed = true;
      if (frame !== undefined) dependencies.window.cancelAnimationFrame(frame);
      dependencies.window.removeEventListener("resize", resize);
      dependencies.persistence.dispose();
      dependencies.hud.dispose();
      dependencies.game.dispose();
      dependencies.onDispose();
    },
  };
};
