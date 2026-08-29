import { createCombatState, type AttackRolls, type CombatState } from "../domain/combat";
import { createBattlefield, type Battlefield } from "../game/battlefield";
import {
  createPersistenceBoundary,
  type PersistenceBoundary,
} from "../persistence/persistence-boundary";
import { createHud, type Hud } from "../ui/hud";
import type { HudIntent } from "../ui/hud/intents";
import { BattleController } from "./battle/controller";
import { battleCommands } from "./battle/commands";
import type { BattleControllerEvent } from "./battle/contracts";
import { presentBattleUpdate } from "./battle/presenter";

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
  const newGame = (): CombatState =>
    dependencies.createInitialState?.() ?? dependencies.initialState;
  const controller = new BattleController({
    createInitialState: newGame,
    initialNowMs: dependencies.initialNowMs ?? 0,
    initialState: dependencies.initialState,
    rolls: dependencies.rolls,
  });
  const render = (event?: BattleControllerEvent): void => {
    const current = presentBattleUpdate(controller.currentUpdate(), event);
    dependencies.game.render(current);
    dependencies.hud.render(current);
  };
  const unsubscribe = controller.subscribe((event) => {
    if (event.persistenceChanged) dependencies.persistence.onStateChanged(event.state);
    render(event);
  });
  const resize = (): void => {
    const viewport = dependencies.viewport();
    dependencies.game.resize(viewport.width, viewport.height);
  };
  const draw = (timestamp: number): void => {
    if (!controller.dispatch(battleCommands.frame(timestamp))) render();
    frame = dependencies.window.requestAnimationFrame(draw);
  };
  resize();
  const handleIntent = (intent: HudIntent): void => {
    if (intent.type === "rotate-camera") {
      dependencies.game.rotateCamera(intent.delta);
      return;
    }
    if (intent.type === "attack") {
      if (!controller.dispatch(battleCommands.attack("manual"))) render();
      return;
    }
    if (intent.type === "upgrade") {
      controller.dispatch(battleCommands.purchase(intent.id, intent.quantity));
      return;
    }
    if (intent.type === "reset") {
      if (dependencies.window.confirm?.("Reset all saved progress?") !== true) return;
      dependencies.persistence.reset();
      controller.dispatch(battleCommands.reset());
      return;
    }
    if (intent.type === "restore") {
      const restored = dependencies.persistence.restorePreviousVersion(
        controller.currentUpdate().nowMs,
      );
      dependencies.hud.reportPersistence(restored.message);
      if (restored.state !== undefined) controller.dispatch(battleCommands.restore(restored.state));
    }
  };
  const unsubscribeHud = dependencies.hud.subscribe(handleIntent);
  dependencies.hud.setRestoreAvailable(dependencies.persistence.hasPreviousVersionSave());
  render();
  dependencies.window.addEventListener("resize", resize);
  frame = dependencies.window.requestAnimationFrame(draw);
  return {
    dispose: () => {
      if (disposed) return;
      disposed = true;
      if (frame !== undefined) dependencies.window.cancelAnimationFrame(frame);
      dependencies.window.removeEventListener("resize", resize);
      unsubscribeHud();
      unsubscribe();
      controller.dispose();
      dependencies.persistence.dispose();
      dependencies.hud.dispose();
      dependencies.game.dispose();
      dependencies.onDispose();
    },
  };
};
