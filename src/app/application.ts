/* eslint-disable complexity -- lifecycle wires the bounded scheduler to controller events. */
import type { AudioPreferencesStorage } from "./audio/audio-preferences";
import { AudioService, type AudioServiceManifest } from "./audio/audio-service";
import musicManifest from "../../public/audio/manifest.json";
import { createCombatState, type AttackRolls, type CombatState } from "../domain/combat";
import { createBattlefield, type Battlefield } from "../game/battlefield";
import {
  createPersistenceBoundary,
  type PersistenceBoundary,
} from "../persistence/persistence-boundary";
import { createHud, type Hud } from "../ui/hud";
import { LeaderboardClient } from "../leaderboard/client";
import type { LeaderboardView } from "../leaderboard/contracts";
import { LeaderboardProgressSync } from "./leaderboard-progress-sync";
import type { HudIntent } from "../ui/hud/intents";
import { BattleController } from "./battle/controller";
import { battleCommands } from "./battle/commands";
import type { BattleControllerEvent } from "./battle/contracts";
import { battleVisualCues, presentBattleUpdate } from "./battle/presenter";

type AudioWindow = AnimationFrameHost & {
  AudioContext?: typeof AudioContext;
  addEventListener(
    type: "click" | "keydown",
    listener: EventListenerOrEventListenerObject,
    options?: { once: boolean },
  ): void;
  removeEventListener(
    type: "click" | "keydown",
    listener: EventListenerOrEventListenerObject,
    options?: { once: boolean },
  ): void;
  localStorage?: AudioPreferencesStorage;
  fetch?: typeof fetch;
};
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
  readonly createLeaderboard?: () => LeaderboardPort;
  readonly rolls: () => AttackRolls;
  readonly initialState: CombatState;
  readonly createInitialState?: () => CombatState;
  readonly now?: () => number;
};
type LeaderboardPort = {
  load(around?: boolean, mode?: "level" | "golden-bugs"): Promise<LeaderboardView>;
  rename(name: string): Promise<void>;
  reset(): Promise<void>;
  submit(level: number, goldenBugs?: number): Promise<void>;
};

type LifecycleDependencies = Omit<
  ApplicationDependencies,
  "createGame" | "createHud" | "createPersistence"
> & {
  readonly createLeaderboard?: () => LeaderboardPort;
  readonly game: Battlefield;
  readonly hud: Hud;
  readonly persistence: PersistenceBoundary;
  readonly viewport: () => { readonly width: number; readonly height: number };
  readonly onDispose: () => void;
  readonly initialNowMs?: number;
  readonly audioManifest?: AudioServiceManifest;
  readonly audioStorage?: AudioPreferencesStorage;
  readonly createAudioService?: (audioWindow: AudioWindow) => AudioService;
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
  const audioWindow = dependencies.window as AudioWindow;
  const audioService =
    dependencies.createAudioService?.(audioWindow) ??
    new AudioService({
      manifest: dependencies.audioManifest ?? {
        music: musicManifest.music.map((entry) => ({
          file: entry.file,
          ...(entry.title === undefined ? {} : { title: entry.title }),
        })),
      },
      ...(dependencies.audioStorage !== undefined || audioWindow.localStorage !== undefined
        ? { storage: dependencies.audioStorage ?? audioWindow.localStorage }
        : {}),
    });
  dependencies.hud.attachAudioSettings?.(audioService);
  let syncLeaderboard: LeaderboardProgressSync | undefined;
  if (dependencies.hud.onLeaderboardLoad !== undefined) {
    const leaderboard = dependencies.createLeaderboard?.() ?? new LeaderboardClient();
    let leaderboardLoadVersion = 0;
    syncLeaderboard = new LeaderboardProgressSync(leaderboard);
    const showLeaderboard = async (
      around: boolean,
      mode: "level" | "golden-bugs",
    ): Promise<void> => {
      if (disposed) return;
      const version = ++leaderboardLoadVersion;
      dependencies.hud.reportLeaderboard?.("Loading leaderboard…");
      try {
        const view = await leaderboard.load(around, mode);
        if (disposed || version !== leaderboardLoadVersion) return;
        dependencies.hud.renderLeaderboard?.(view);
      } catch (error) {
        if (disposed || version !== leaderboardLoadVersion) return;
        const rateLimited =
          typeof error === "object" &&
          error !== null &&
          "kind" in error &&
          error.kind === "rate-limited";
        dependencies.hud.reportLeaderboard?.(
          rateLimited
            ? "Leaderboard is rate limited. Try again shortly."
            : "Leaderboard is offline or not configured.",
        );
      }
    };
    dependencies.hud.onLeaderboardLoad((around, mode) => {
      void showLeaderboard(around, mode);
    });
    dependencies.hud.onLeaderboardRename?.(async (name) => {
      try {
        await leaderboard.rename(name);
        if (!disposed) await showLeaderboard(false, "level");
      } catch {
        if (!disposed) dependencies.hud.reportLeaderboard?.("Name could not be changed.");
      }
    });
    dependencies.hud.onLeaderboardReset?.(async () => {
      try {
        await leaderboard.reset();
        if (!disposed) dependencies.hud.reportLeaderboard?.("Leaderboard identity deleted.");
      } catch {
        if (!disposed) dependencies.hud.reportLeaderboard?.("Identity could not be deleted.");
      }
    });
  }
  const render = (event?: BattleControllerEvent): void => {
    const current = presentBattleUpdate(controller.currentUpdate(), event);
    dependencies.game.render(current);
    dependencies.hud.render(current);
  };
  const unsubscribe = controller.subscribe((event) => {
    if (event.persistenceChanged) dependencies.persistence.onStateChanged(event.state);
    syncLeaderboard?.observe({
      goldenBugs: event.state.goldenBugDefeats,
      level: event.state.enemy.encounter,
    });
    if (
      (event.type === "attack" &&
        event.outcome.type === "hit" &&
        event.outcome.defeated &&
        event.previousEnemy.grade === "boss") ||
      (event.type === "frame" &&
        event.automaticOutcome?.type === "hit" &&
        event.automaticOutcome.defeated &&
        event.previousEnemy?.grade === "boss")
    )
      syncLeaderboard?.defeatedBoss();
    if (event.type === "attack" || event.type === "frame")
      audioService.playBattleCues(battleVisualCues(event));
    if (event.type === "purchase")
      audioService.playUiCue(event.reason === null ? "click" : "error");
    if (event.type === "reset" || event.type === "restore") audioService.playUiCue("back");
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
    if (intent.type === "toggle-automatic-pause") {
      if (!controller.dispatch(battleCommands.toggleAutomaticPause())) render();
      return;
    }
    if (intent.type === "upgrade") {
      controller.dispatch(battleCommands.purchase(intent.id, intent.quantity));
      return;
    }
    if (intent.type === "reset") {
      if (dependencies.window.confirm?.("Reset all saved progress?") !== true) return;
      dependencies.persistence.reset();
      dependencies.game.resetCamera();
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
  const gestureUnlock = (): void => {
    void audioService.unlock().then((unlocked) => {
      if (!unlocked || disposed) return;
      audioWindow.removeEventListener("click", gestureUnlock);
      audioWindow.removeEventListener("keydown", gestureUnlock);
      audioService.startMusic();
    });
  };
  audioWindow.addEventListener("click", gestureUnlock);
  audioWindow.addEventListener("keydown", gestureUnlock);
  dependencies.window.addEventListener("resize", resize);
  frame = dependencies.window.requestAnimationFrame(draw);
  return {
    dispose: () => {
      if (disposed) return;
      disposed = true;
      if (frame !== undefined) dependencies.window.cancelAnimationFrame(frame);
      dependencies.window.removeEventListener("resize", resize);
      audioWindow.removeEventListener("click", gestureUnlock);
      audioWindow.removeEventListener("keydown", gestureUnlock);
      unsubscribeHud();
      unsubscribe();
      controller.dispose();
      audioService.dispose();
      syncLeaderboard?.dispose();
      dependencies.persistence.dispose();
      dependencies.hud.dispose();
      dependencies.game.dispose();
      dependencies.onDispose();
    },
  };
};
