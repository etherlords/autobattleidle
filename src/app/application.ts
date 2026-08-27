import { createInitialSnapshot, type BattleSnapshot } from "../domain/snapshot";
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
};

export type Application = { dispose(): void };
export type ApplicationDependencies = {
  readonly window: AnimationFrameHost;
  readonly createGame: (host: HTMLElement) => Battlefield;
  readonly createHud: (host: HTMLElement) => Hud;
  readonly createPersistence: () => PersistenceBoundary;
  readonly snapshot: BattleSnapshot;
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
};

const browserDependencies = (): ApplicationDependencies => ({
  window,
  createGame: createBattlefield,
  createHud,
  createPersistence: createPersistenceBoundary,
  snapshot: createInitialSnapshot(),
});

export const createApplication = (
  root: HTMLElement,
  dependencies: ApplicationDependencies = browserDependencies(),
): Application => {
  const battlefieldHost = document.createElement("div");
  battlefieldHost.className = "battlefield";
  root.replaceChildren(battlefieldHost);
  const game = dependencies.createGame(battlefieldHost);
  const hud = dependencies.createHud(root);
  const persistence = dependencies.createPersistence();
  return startApplication({
    game,
    hud,
    persistence,
    onDispose: () => root.replaceChildren(),
    snapshot: dependencies.snapshot,
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
  const resize = (): void => {
    const viewport = dependencies.viewport();
    dependencies.game.resize(viewport.width, viewport.height);
  };
  const draw = (): void => {
    dependencies.game.render(dependencies.snapshot);
    frame = dependencies.window.requestAnimationFrame(draw);
  };
  resize();
  dependencies.hud.render(dependencies.snapshot);
  dependencies.persistence.onStateChanged(dependencies.snapshot);
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
