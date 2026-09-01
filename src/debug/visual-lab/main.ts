import * as THREE from "three";
import "./visual-lab.css";

import type { EnemyFamily, EnemyGrade, EnemyPresentationModifier } from "../../domain/combat";
import { BATTLEFIELD_CONFIG } from "../../game/battlefield/config";
import { MAX_ACTIVE_EFFECTS, type EffectKind } from "../../game/battlefield/effects";
import { UNIT_FACTORIES } from "../../game/units/factories";
import type { EnemyUnit } from "../../game/units/enemy";
import {
  allLabCases,
  canonicalLabCase,
  effectForLabCue,
  inputForCase,
  LAB_CUES,
  LAB_FAMILIES,
  LAB_GRADES,
  LAB_MODIFIERS,
} from "./catalog";
import { parseLabCase, serializeLabCase, type LabView, type LabViewport } from "./case-url";
import { attachLabRecipe, LAB_RECIPES, type LabRecipe } from "./recipes";
import {
  createEffectHarness,
  observeResourceDisposal,
  resourceReceipt,
  resourceSnapshot,
  type ResourceReceipt,
} from "./resource-ledger";

type OverlayName = "axes" | "bounds" | "sockets";
type CameraPreset = LabView;
type LabVariant = 0 | 1 | 2;

const cueOptions = LAB_CUES.map((cue) => ({ label: cue, value: cue }));
const option = (value: string, label = value): HTMLOptionElement => new Option(label, value);
const select = (
  label: string,
  values: readonly { readonly label: string; readonly value: string }[],
): HTMLSelectElement => {
  const control = document.createElement("select");
  control.setAttribute("aria-label", label);
  values.forEach(({ label: text, value }) => control.add(option(value, text)));
  return control;
};
const button = (label: string): HTMLButtonElement => {
  const control = document.createElement("button");
  control.textContent = label;
  return control;
};
const checkbox = (label: string): HTMLInputElement => {
  const control = document.createElement("input");
  control.type = "checkbox";
  control.setAttribute("aria-label", label);
  return control;
};

class VisualLab {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly effects = createEffectHarness();
  private readonly overlays = new THREE.Group();
  private readonly receipt = document.createElement("output");
  private unit: EnemyUnit | undefined;
  private disposeRecipe: (() => void) | undefined;
  private lastReceipt: ResourceReceipt | undefined;
  private paused = false;
  private speed = 1;
  private fractionalFrames = 0;
  private zoom = 1;
  private azimuth = 0.55;
  private elevation = 0.32;
  private current = parseLabCase(window.location.search);
  private overlayState = new Set<OverlayName>();
  private pointerX: number | undefined;

  constructor(private readonly host: HTMLElement) {
    this.scene.background = new THREE.Color(BATTLEFIELD_CONFIG.backgroundColor);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.dataset.visualLab = "true";
    this.renderer.domElement.className = "visual-lab-canvas";
    this.renderer.domElement.addEventListener("pointerdown", (event) => {
      this.pointerX = event.clientX;
      this.renderer.domElement.setPointerCapture(event.pointerId);
    });
    this.renderer.domElement.addEventListener("pointermove", (event) => {
      if (this.pointerX === undefined) return;
      this.azimuth += (event.clientX - this.pointerX) * 0.01;
      this.pointerX = event.clientX;
    });
    this.renderer.domElement.addEventListener("pointerup", () => {
      this.pointerX = undefined;
    });
    this.host.append(this.controls(), this.renderer.domElement, this.receipt);
    this.scene.add(this.overlays, new THREE.HemisphereLight("#75c7ff", "#25120b", 1.5));
    const light = new THREE.DirectionalLight("#f8d28b", 2);
    light.position.set(2, 4, 3);
    this.scene.add(light);
    this.replace();
    window.addEventListener("resize", () => this.resize());
    this.resize();
    requestAnimationFrame(() => this.frame());
  }

  private controls(): HTMLElement {
    const controls = document.createElement("section");
    controls.className = "visual-lab-controls";
    const family = select(
      "Family",
      LAB_FAMILIES.map((value) => ({ label: value, value })),
    );
    const grade = select(
      "Grade",
      LAB_GRADES.map((value) => ({ label: value, value })),
    );
    const modifier = select(
      "Modifier",
      LAB_MODIFIERS.map((value) => ({ label: value ?? "none", value: value ?? "none" })),
    );
    const variant = select(
      "Variant",
      ["0", "1", "2"].map((value) => ({ label: value, value })),
    );
    const view = select(
      "View",
      ["orbit", "front", "side", "back", "top"].map((value) => ({ label: value, value })),
    );
    const viewport = select(
      "Viewport",
      ["desktop", "narrow"].map((value) => ({ label: value, value })),
    );
    const cue = select("Replay cue", cueOptions);
    const recipe = select(
      "Recipe",
      LAB_RECIPES.map((value) => ({ label: value, value })),
    );
    const golden = checkbox("Golden Bug");
    const motion = checkbox("Reduced motion");
    const overlays = ["axes", "sockets", "bounds"] as const;
    const pause = button("Pause");
    const step = button("Frame step");
    const replay = button("Replay");
    const speed = button("Speed ×1");
    const zoomIn = button("Zoom +");
    const zoomOut = button("Zoom −");
    const apply = (): void => {
      const visual = canonicalLabCase({
        family: family.value as EnemyFamily,
        grade: grade.value as EnemyGrade,
        modifier:
          modifier.value === "none"
            ? null
            : (modifier.value as Exclude<EnemyPresentationModifier, null>),
        variant: Number(variant.value) as LabVariant,
        goldenBug: golden.checked,
      });
      this.current = {
        ...visual,
        reducedMotion: motion.checked,
        view: view.value as LabView,
        viewport: viewport.value as LabViewport,
        recipe: recipe.value as LabRecipe,
      };
      history.replaceState(null, "", serializeLabCase(this.current));
      this.replace();
      this.resize();
    };
    family.value = this.current.family;
    grade.value = this.current.grade;
    modifier.value = this.current.modifier ?? "none";
    variant.value = String(this.current.variant);
    view.value = this.current.view;
    viewport.value = this.current.viewport;
    recipe.value = this.current.recipe;
    golden.checked = this.current.goldenBug;
    motion.checked = this.current.reducedMotion;
    [family, grade, modifier, variant, view, viewport, recipe].forEach((control) =>
      control.addEventListener("change", apply),
    );
    [golden, motion].forEach((control) => control.addEventListener("change", apply));
    overlays.forEach((name) => {
      const control = checkbox(name);
      control.addEventListener("change", () => {
        if (control.checked) this.overlayState.add(name);
        else this.overlayState.delete(name);
        this.refreshOverlays();
      });
      controls.append(name, control);
    });
    pause.addEventListener("click", () => {
      this.paused = !this.paused;
      pause.textContent = this.paused ? "Resume" : "Pause";
    });
    step.addEventListener("click", () => this.tick());
    replay.addEventListener("click", () => this.replay(cue.value));
    speed.addEventListener("click", () => {
      if (this.speed === 1) this.speed = 2;
      else if (this.speed === 2) this.speed = 0.5;
      else this.speed = 1;
      speed.textContent = `Speed ×${this.speed}`;
    });
    zoomIn.addEventListener("click", () => {
      this.zoom = Math.max(0.45, this.zoom - 0.15);
    });
    zoomOut.addEventListener("click", () => {
      this.zoom = Math.min(2.5, this.zoom + 0.15);
    });
    controls.append(
      family,
      grade,
      modifier,
      variant,
      golden,
      motion,
      view,
      viewport,
      recipe,
      cue,
      replay,
      pause,
      step,
      speed,
      zoomIn,
      zoomOut,
    );
    return controls;
  }

  private replace(): void {
    this.clearEffects();
    this.disposeUnit();
    this.unit = UNIT_FACTORIES.enemy.create({
      ...inputForCase(this.current),
      reducedMotion: this.current.reducedMotion,
    });
    this.unit.dispatchEnemy({ type: "spawn", parent: this.scene });
    this.disposeRecipe = attachLabRecipe(this.current.recipe, this.unit.view.group);
    this.setCameraPreset(this.current.view);
    this.refreshOverlays();
  }

  private setCameraPreset(preset: CameraPreset): void {
    if (preset === "front") {
      this.azimuth = 0;
      this.elevation = 0;
      return;
    }
    if (preset === "side") {
      this.azimuth = Math.PI / 2;
      this.elevation = 0;
      return;
    }
    if (preset === "back") {
      this.azimuth = Math.PI;
      this.elevation = 0;
      return;
    }
    if (preset === "top") {
      this.azimuth = 0;
      this.elevation = Math.PI / 2 - 0.02;
      return;
    }
    this.azimuth = 0.55;
    this.elevation = 0.32;
  }

  private replay(cue: string): void {
    if (cue === "idle") return;
    if (cue === "spawn") {
      this.unit?.dispatchEnemy({ type: "spawn", parent: this.scene });
      return;
    }
    if (cue === "hit" || cue === "critical" || cue === "death")
      this.unit?.dispatchEnemy({ type: cue });
    else {
      const effect = effectForLabCue(cue);
      if (effect !== undefined) this.addEffect(effect);
    }
  }

  private addEffect(kind: EffectKind): void {
    const origin = this.unit?.enemyView.combatSocketWorldPosition();
    this.effects.add(kind, this.current.reducedMotion, origin, this.scene);
  }

  private tick(): void {
    this.unit?.tick();
    this.effects.advance();
    this.refreshReceipt();
  }

  private refreshOverlays(): void {
    this.disposeOverlays();
    if (this.unit === undefined) return;
    if (this.overlayState.has("axes")) this.overlays.add(new THREE.AxesHelper(2));
    this.unit.view.group.updateMatrixWorld(true);
    if (this.overlayState.has("bounds"))
      this.overlays.add(
        new THREE.Box3Helper(new THREE.Box3().setFromObject(this.unit.view.group), 0xffcc66),
      );
    if (this.overlayState.has("sockets"))
      this.unit.view.group.traverse((node) => {
        if (node.name.startsWith("enemy-socket-")) {
          const marker = new THREE.AxesHelper(0.18);
          node.getWorldPosition(marker.position);
          node.getWorldQuaternion(marker.quaternion);
          this.overlays.add(marker);
        }
      });
  }

  private disposeOverlays(): void {
    this.overlays.traverse((node) => {
      if (node instanceof THREE.LineSegments) {
        node.geometry.dispose();
        const material = node.material;
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
        else material.dispose();
      }
    });
    this.overlays.clear();
  }

  private resize(): void {
    const narrow = this.current.viewport === "narrow";
    const width = narrow ? 390 : Math.max(640, Math.min(1080, this.host.clientWidth));
    const height = narrow ? 680 : 620;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private frame(): void {
    if (!this.paused) {
      this.fractionalFrames += this.speed;
      while (this.fractionalFrames >= 1) {
        this.tick();
        this.fractionalFrames -= 1;
      }
    }
    const distance = 7 * this.zoom;
    this.camera.position.set(
      Math.sin(this.azimuth) * distance,
      Math.sin(this.elevation) * distance + 1.4,
      Math.cos(this.azimuth) * distance,
    );
    this.camera.lookAt(0, 0.7, 0);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.frame());
  }

  private refreshReceipt(): void {
    const live = resourceSnapshot(this.scene, this.renderer.info);
    const last =
      this.lastReceipt === undefined ? "" : ` | last disposal ${resourceReceipt(this.lastReceipt)}`;
    this.receipt.textContent = `case ${serializeLabCase(this.current)} | live ${resourceReceipt(live)} | effects ${this.effects.size}/${MAX_ACTIVE_EFFECTS} | matrix ${allLabCases().length}${last}`;
  }

  private clearEffects(): void {
    const receipt = this.effects.dispose();
    if (receipt.expectedDisposals > 0) this.lastReceipt = receipt;
  }

  private disposeUnit(): void {
    if (this.unit === undefined) return;
    const receipt = observeResourceDisposal(this.unit.view.group);
    this.disposeRecipe?.();
    this.disposeRecipe = undefined;
    this.unit.dispatchEnemy({ type: "dispose" });
    this.lastReceipt = receipt();
    this.unit = undefined;
  }
}

const host = document.querySelector<HTMLElement>("#visual-lab");
if (host === null) throw new Error("Visual lab host is missing");
document.body.className = "visual-lab-page";
host.className = "visual-lab-root";
new VisualLab(host);
