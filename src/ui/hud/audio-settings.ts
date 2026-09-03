export type AudioSliderName = "master" | "ui" | "combat" | "music";

/** Port implemented by the application-owned audio service; UI never imports app. */
export type AudioSettingsPort = {
  readonly preferences: {
    readonly master: number;
    readonly ui: number;
    readonly combat: number;
    readonly music: number;
    readonly muted: boolean;
  };
  readonly currentState: string;
  setPreferences(preferences: {
    readonly master: number;
    readonly ui: number;
    readonly combat: number;
    readonly music: number;
    readonly muted: boolean;
  }): void;
  setMuted(muted: boolean): void;
};

import { button, makeText } from "./elements";

const SLIDERS: readonly {
  readonly key: AudioSliderName;
  readonly label: string;
}[] = [
  { key: "master", label: "Master volume" },
  { key: "ui", label: "UI volume" },
  { key: "combat", label: "Combat volume" },
  { key: "music", label: "Music volume" },
];

const toPercent = (gain: number): string => `${Math.round(gain * 100)}%`;

export class AudioSettingsDialog {
  readonly launcher = button("audio-settings-launcher", "Sound settings");
  readonly modal = document.createElement("section");
  private readonly dialog = document.createElement("section");
  private readonly close = button("audio-settings-close", "Close sound settings");
  private readonly status = makeText("p", "");
  private readonly mute = document.createElement("input");
  private readonly sliders = new Map<
    AudioSliderName,
    { readonly input: HTMLInputElement; readonly value: HTMLElement }
  >();
  constructor(service: AudioSettingsPort) {
    this.launcher.setAttribute("aria-haspopup", "dialog");
    this.modal.className = "audio-settings-modal";
    this.modal.hidden = true;
    this.dialog.className = "audio-settings-dialog";
    this.dialog.setAttribute("aria-label", "Sound settings");
    this.dialog.setAttribute("aria-modal", "true");
    this.dialog.setAttribute("role", "dialog");
    this.status.className = "audio-settings-status";
    this.status.setAttribute("aria-live", "polite");
    this.mute.type = "checkbox";
    this.mute.id = "audio-settings-mute";
    const muteLabel = document.createElement("label");
    muteLabel.className = "audio-settings-mute-label";
    muteLabel.setAttribute("for", this.mute.id);
    muteLabel.textContent = "Mute all sound";
    this.mute.checked = service.preferences.muted;
    this.mute.addEventListener("change", () => service.setMuted(this.mute.checked));
    this.dialog.append(this.close);
    for (const slider of SLIDERS) {
      const row = document.createElement("div");
      row.className = "audio-settings-row";
      const label = document.createElement("label");
      label.className = "audio-settings-label";
      const input = document.createElement("input");
      input.type = "range";
      input.min = "0";
      input.max = "100";
      input.step = "1";
      input.id = `audio-settings-${slider.key}`;
      const value = document.createElement("span");
      value.className = "audio-settings-value";
      value.textContent = toPercent(service.preferences[slider.key]);
      input.value = String(Math.round(service.preferences[slider.key] * 100));
      label.setAttribute("for", input.id);
      label.textContent = slider.label;
      input.addEventListener("input", () => {
        const gain = Number(input.value) / 100;
        value.textContent = toPercent(gain);
        service.setPreferences({ ...service.preferences, [slider.key]: gain });
      });
      this.sliders.set(slider.key, { input, value });
      row.append(label, input, value);
      this.dialog.append(row);
    }
    this.dialog.append(this.mute, muteLabel, this.status);
    this.modal.append(this.dialog);
    this.launcher.addEventListener("click", this.open);
    this.close.addEventListener("click", this.closeFromButton);
    this.modal.addEventListener("pointerup", this.closeFromBackdrop);
    this.reportState(service.currentState);
  }

  reportState(state: string): void {
    if (state === "blocked") this.status.textContent = "Audio blocked until first interaction.";
    else if (state === "error") this.status.textContent = "Audio error.";
    else this.status.textContent = "";
  }

  dispose(): void {
    this.closeModal();
    this.launcher.removeEventListener("click", this.open);
    this.close.removeEventListener("click", this.closeFromButton);
    this.modal.removeEventListener("pointerup", this.closeFromBackdrop);
  }

  private readonly closeFromButton = (): void => this.closeModal();
  private readonly open = (): void => {
    if (!this.modal.hidden) return;
    this.modal.hidden = false;
    document.addEventListener("keydown", this.modalKeydown);
    this.close.focus();
  };
  private readonly closeModal = (restoreFocus = true): void => {
    if (this.modal.hidden) return;
    this.modal.hidden = true;
    document.removeEventListener("keydown", this.modalKeydown);
    if (restoreFocus) this.launcher.focus();
  };
  private readonly closeFromBackdrop = (event: PointerEvent): void => {
    if (event.target === this.modal) this.closeModal();
  };
  private readonly modalKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusables: (HTMLButtonElement | HTMLInputElement)[] = [
      this.close,
      ...[...this.sliders.values()].map(({ input }) => input),
      this.mute,
    ];
    const current = focusables.indexOf(
      document.activeElement as HTMLButtonElement | HTMLInputElement,
    );
    const next = (current + (event.shiftKey ? focusables.length - 1 : 1)) % focusables.length;
    event.preventDefault();
    focusables[next]?.focus();
  };
}
