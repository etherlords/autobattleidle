import type { UpgradeId } from "../domain/combat";
import type { BattleSnapshot } from "../domain/snapshot";
import type { AudioSettingsPort } from "./hud/audio-settings";
import { button, makeText } from "./hud/elements";
import { BattleStatus } from "./hud/battle-status";
import { EventLog } from "./hud/event-log";

import { UpgradeDialog } from "./hud/upgrade-dialog";
import { LeaderboardDialog } from "./hud/leaderboard-dialog";
import { AudioSettingsDialog } from "./hud/audio-settings";
import type { LeaderboardView, RankingMode } from "../leaderboard/contracts";
import type { HudIntent, HudIntentListener, HudUnsubscribe } from "./hud/intents";

export type Hud = {
  render(snapshot: BattleSnapshot): void;
  onUpgrade(listener: (id: UpgradeId, quantity?: 1 | 10 | 100) => void): void;
  attachAudioSettings?(service: AudioSettingsPort): void;
  subscribe(listener: HudIntentListener): HudUnsubscribe;
  onAttack(listener: () => void): void;
  onReset(listener: () => void): void;
  onRestore(listener: () => void): void;
  setRestoreAvailable(available: boolean): void;
  reportPersistence(message: string): void;
  onLeaderboardLoad?(listener: (around: boolean, mode: RankingMode) => void): void;
  onLeaderboardRename?(listener: (name: string) => void): void;
  onLeaderboardReset?(listener: () => void): void;
  renderLeaderboard?(view: LeaderboardView, status?: string): void;
  reportLeaderboard?(message: string): void;
  dispose(): void;
};
export const createHud = (host: HTMLElement, battlefield: HTMLElement): Hud => {
  const panel = document.createElement("section");
  panel.className = "hud";
  panel.setAttribute("aria-label", "Battle status");
  const status = new BattleStatus();
  const trackStatus = makeText("p", "");
  trackStatus.className = "hud-track-status";
  const muteToggle = button("hud-mute-toggle", "Mute");
  const dialog = new UpgradeDialog();
  let audioSettings: AudioSettingsDialog | undefined;
  let audioService: AudioSettingsPort | undefined;
  let unsubscribeAudioState: (() => void) | undefined;
  const leaderboard = new LeaderboardDialog();
  const log = new EventLog();
  const actions = document.createElement("div");
  actions.className = "hud-actions";
  actions.append(dialog.launcher, leaderboard.launcher);
  panel.append(
    status.element,
    trackStatus,
    actions,
    muteToggle,
    dialog.modal,
    leaderboard.modal,
    log.element,
  );
  host.append(panel);
  muteToggle.hidden = true;
  const renderAudioChrome = (): void => {
    const service = audioService;
    const playlist = service?.playlist;
    trackStatus.textContent =
      playlist === null || playlist === undefined
        ? ""
        : `♪ ${playlist.current} · Next: ${playlist.next}`;
    if (service !== undefined) {
      const muted = service.preferences.muted;
      muteToggle.textContent = muted ? "Unmute" : "Mute";
      muteToggle.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
      muteToggle.title = muted ? "Unmute sound" : "Mute sound";
    }
  };
  const toggleMute = (): void => {
    if (audioService === undefined) return;
    audioService.setMuted(!audioService.preferences.muted);
    renderAudioChrome();
  };
  muteToggle.addEventListener("click", toggleMute);

  battlefield.tabIndex = 0;
  battlefield.setAttribute(
    "aria-label",
    "Battlefield. Press Enter or Space to attack; use Left and Right arrows to rotate the camera.",
  );
  let disposed = false;
  const listeners = new Set<HudIntentListener>();
  const emit = (intent: HudIntent): void => {
    for (const listener of [...listeners]) listener(intent);
  };
  const attack = (): void => emit({ type: "attack" });
  const rotate = (delta: number): void => emit({ delta, type: "rotate-camera" });
  let pointer: { id: number; x: number; dragged: boolean } | undefined;
  const pointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = { dragged: false, id: event.pointerId, x: event.clientX };
    battlefield.setPointerCapture?.(event.pointerId);
  };
  const pointerMove = (event: PointerEvent): void => {
    if (pointer?.id !== event.pointerId) return;
    const deltaX = event.clientX - pointer.x;
    if (Math.abs(deltaX) < 4 && !pointer.dragged) return;
    pointer.dragged = true;
    pointer.x = event.clientX;
    if (deltaX !== 0) rotate(-deltaX * 0.012);
  };
  const clearPointer = (event: PointerEvent): { readonly dragged: boolean } | undefined => {
    if (pointer?.id !== event.pointerId) return undefined;
    const current = pointer;
    pointer = undefined;
    if (battlefield.hasPointerCapture?.(event.pointerId))
      battlefield.releasePointerCapture(event.pointerId);
    return current;
  };
  const pointerUp = (event: PointerEvent): void => {
    const current = clearPointer(event);
    if (current !== undefined && !current.dragged) attack();
  };
  const pointerCancel = (event: PointerEvent): void => {
    clearPointer(event);
  };
  const keyboardAttack = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      rotate(event.key === "ArrowLeft" ? 0.12 : -0.12);
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    attack();
  };
  battlefield.addEventListener("pointerdown", pointerDown);
  battlefield.addEventListener("pointermove", pointerMove);
  battlefield.addEventListener("pointerup", pointerUp);
  battlefield.addEventListener("pointercancel", pointerCancel);
  battlefield.addEventListener("keydown", keyboardAttack);
  dialog.onUpgrade((id, quantity) => emit({ id, quantity, type: "upgrade" }));
  status.onToggleAutomaticPause(() => emit({ type: "toggle-automatic-pause" }));
  dialog.onReset(() => emit({ type: "reset" }));
  dialog.onRestore(() => emit({ type: "restore" }));
  const closeLeaderboard = (): void => leaderboard.dismissForHandoff();
  const closeUpgrades = (): void => dialog.dismissForHandoff();
  dialog.launcher.addEventListener("click", closeLeaderboard);
  leaderboard.launcher.addEventListener("click", closeUpgrades);
  const toggleUpgradeShortcut = (event: KeyboardEvent): void => {
    if (event.repeat || event.key.toLowerCase() !== "u") return;
    event.preventDefault();
    leaderboard.dismissForHandoff();
    dialog.toggleShortcut();
  };
  document.addEventListener("keydown", toggleUpgradeShortcut);

  const subscribe = (listener: HudIntentListener): HudUnsubscribe => {
    if (disposed) return () => undefined;
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    render: (snapshot) => {
      status.render(snapshot);
      dialog.render(snapshot);
      log.render(snapshot.events);
    },
    subscribe,
    onAttack: (listener) =>
      subscribe((intent) => {
        if (intent.type === "attack") listener();
      }),
    onUpgrade: (listener) =>
      subscribe((intent) => {
        if (intent.type === "upgrade") listener(intent.id, intent.quantity);
      }),
    onReset: (listener) =>
      subscribe((intent) => {
        if (intent.type === "reset") listener();
      }),
    onRestore: (listener) =>
      subscribe((intent) => {
        if (intent.type === "restore") listener();
      }),
    setRestoreAvailable: (available) => dialog.setRestoreAvailable(available),
    attachAudioSettings: (service) => {
      audioSettings?.dispose();
      unsubscribeAudioState?.();
      audioService = service;
      audioSettings = new AudioSettingsDialog(service);
      actions.append(audioSettings.launcher);
      panel.append(audioSettings.modal, audioSettings.startGate);
      muteToggle.hidden = false;
      renderAudioChrome();
      unsubscribeAudioState = service.subscribeState(renderAudioChrome);
    },
    reportPersistence: (message) => dialog.reportPersistence(message),
    onLeaderboardLoad: (listener) => leaderboard.onLoad(listener),
    onLeaderboardRename: (listener) => leaderboard.onRename(listener),
    onLeaderboardReset: (listener) => leaderboard.onReset(listener),
    renderLeaderboard: (view, message) => leaderboard.render(view, message),
    reportLeaderboard: (message) => leaderboard.report(message),
    dispose: () => {
      if (disposed) return;
      disposed = true;
      listeners.clear();
      battlefield.removeEventListener("pointerdown", pointerDown);
      battlefield.removeEventListener("pointermove", pointerMove);
      battlefield.removeEventListener("pointerup", pointerUp);
      battlefield.removeEventListener("pointercancel", pointerCancel);
      battlefield.removeEventListener("keydown", keyboardAttack);
      audioSettings?.dispose();
      unsubscribeAudioState?.();
      unsubscribeAudioState = undefined;
      muteToggle.removeEventListener("click", toggleMute);
      dialog.launcher.removeEventListener("click", closeLeaderboard);
      leaderboard.launcher.removeEventListener("click", closeUpgrades);
      document.removeEventListener("keydown", toggleUpgradeShortcut);
      dialog.dispose();
      status.dispose();
      leaderboard.dispose();
      panel.remove();
    },
  };
};
