import * as THREE from "three";
import "./visual-lab.css";

import {
  ENEMY_AFFINITIES,
  type EnemyAffinity,
  type EnemyFamily,
  type EnemyGrade,
  type EnemyPresentationModifier,
} from "../../domain/combat";
import { BATTLEFIELD_CONFIG } from "../../game/battlefield/config";
import { MAX_ACTIVE_EFFECTS, type EffectKind } from "../../game/battlefield/effects";
import { UNIT_FACTORIES } from "../../game/units/factories";
import type { EnemyUnit } from "../../game/units/enemy";
import {
  allLabCases,
  canonicalLabCase,
  compositionReceiptForCase,
  effectForLabCue,
  inputForCase,
  LAB_AFFINITIES,
  LAB_CUES,
  LAB_FAMILIES,
  LAB_GRADES,
  LAB_MODIFIERS,
  reachableLabCases,
  reconcileLabFamily,
  toggleGoldenLabCase,
  type LabCase,
} from "./catalog";
import { parseLabCase, serializeLabCase, type LabView, type LabViewport } from "./case-url";
import {
  advanceLabRecipe,
  attachLabRecipe,
  LAB_RECIPES,
  type LabRecipe,
  validateLabRecipe,
} from "./recipes";
import { LabPlayerEvolution, PLAYER_LAB_LEVELS } from "./player-evolution";
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
  private readonly correction = document.createElement("output");
  private unit: EnemyUnit | LabPlayerEvolution | undefined;
  private disposeRecipe: (() => void) | undefined;
  private lastReceipt: ResourceReceipt | undefined;
  private paused = false;
  private speed = 1;
  private fractionalFrames = 0;
  private zoom = 1;
  private cameraDistance = 7;
  private readonly cameraFocus = new THREE.Vector3(0, 0.7, 0);
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
    this.correction.className = "visual-lab-correction";
    this.host.append(this.controls(), this.correction, this.renderer.domElement, this.receipt);
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
    const affinity = select(
      "Affinity",
      LAB_AFFINITIES.map((value) => ({
        label: `${ENEMY_AFFINITIES[value].label} — ${value}`,
        value,
      })),
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
    const subject = select(
      "Subject",
      ["enemy", "player"].map((value) => ({ label: value, value })),
    );
    const playerLevels = [...new Set([...PLAYER_LAB_LEVELS, this.current.playerLevel])].sort(
      (left, right) => left - right,
    );
    const playerLevel = select(
      "Player milestone level",
      playerLevels.map((level) => ({
        label: `level ${level}`,
        value: String(level),
      })),
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
    const selectedCase = (): {
      readonly affinity: EnemyAffinity;
      readonly family: EnemyFamily;
      readonly grade: EnemyGrade;
      readonly modifier: EnemyPresentationModifier;
      readonly variant: LabVariant;
      readonly goldenBug: boolean;
    } => ({
      affinity: affinity.value as EnemyAffinity,
      family: family.value as EnemyFamily,
      grade: grade.value as EnemyGrade,
      modifier:
        modifier.value === "none"
          ? null
          : (modifier.value as Exclude<EnemyPresentationModifier, null>),
      variant: Number(variant.value) as LabVariant,
      goldenBug: golden.checked,
    });
    const apply = (): void => {
      const visual = canonicalLabCase(selectedCase());
      this.current = parseLabCase(
        serializeLabCase({
          ...visual,
          reducedMotion: motion.checked,
          view: view.value as LabView,
          viewport: viewport.value as LabViewport,
          recipe: recipe.value as LabRecipe,
          subject: subject.value as "enemy" | "player",
          playerStage: this.current.playerStage,
          playerDetailLevel: this.current.playerDetailLevel,
          playerLevel: Number(playerLevel.value),
        }),
      );
      selectCase(this.current);
      syncCompositionControls();
      history.replaceState(null, "", serializeLabCase(this.current));
      this.replace();
      this.resize();
    };
    const setOptions = (
      control: HTMLSelectElement,
      values: readonly string[],
      selected: string,
    ): void => {
      control.replaceChildren(...values.map((value) => option(value)));
      control.value = values.includes(selected) ? selected : (values[0] ?? "");
    };
    const selectCase = (match: LabCase): void => {
      affinity.value = match.affinity;
      family.value = match.family;
      grade.value = match.grade;
      modifier.value = match.modifier ?? "none";
      variant.value = String(match.variant);
      golden.checked = match.goldenBug;
      setOptions(
        family,
        [...new Set(reachableLabCases({}).map((entry) => entry.family))],
        match.family,
      );
      setOptions(
        grade,
        [...new Set(reachableLabCases({ family: match.family }).map((entry) => entry.grade))],
        match.grade,
      );
      setOptions(
        modifier,
        [
          ...new Set(
            reachableLabCases({ family: match.family, grade: match.grade }).map(
              (entry) => entry.modifier ?? "none",
            ),
          ),
        ],
        match.modifier ?? "none",
      );
      setOptions(
        variant,
        [
          ...new Set(
            reachableLabCases({
              family: match.family,
              grade: match.grade,
              modifier: match.modifier,
            }).map((entry) => String(entry.variant)),
          ),
        ],
        String(match.variant),
      );
      syncCompositionOptions(match);
    };
    const syncCompositionOptions = (match: LabCase): void => {
      const reachable = (candidate: LabCase): boolean => reachableLabCases(candidate).length > 0;
      for (const entry of affinity.options) {
        entry.disabled = !reachable({ ...match, affinity: entry.value as EnemyAffinity });
      }
      for (const entry of family.options) {
        entry.disabled =
          reachableLabCases({ family: entry.value as EnemyFamily, goldenBug: false }).length === 0;
      }
      for (const entry of grade.options) {
        entry.disabled = !reachable({ ...match, grade: entry.value as EnemyGrade });
      }
      for (const entry of modifier.options) {
        entry.disabled = !reachable({
          ...match,
          modifier:
            entry.value === "none"
              ? null
              : (entry.value as Exclude<EnemyPresentationModifier, null>),
        });
      }
      for (const entry of variant.options) {
        entry.disabled = !reachable({ ...match, variant: Number(entry.value) as LabVariant });
      }
    };
    const syncCompositionControls = (): void => {
      const fixed = this.current.goldenBug;
      for (const control of [affinity, family, grade, modifier, variant]) {
        control.disabled = fixed;
      }
    };
    const selectReachable = (
      candidate: Partial<{
        readonly affinity: EnemyAffinity;
        readonly family: EnemyFamily;
        readonly grade: EnemyGrade;
        readonly modifier: EnemyPresentationModifier;
        readonly variant: LabVariant;
        readonly goldenBug: boolean;
      }>,
    ): void => {
      const match =
        candidate.family !== undefined && candidate.family !== this.current.family
          ? reconcileLabFamily(this.current, candidate.family)
          : (reachableLabCases(candidate)[0] ?? this.current);
      selectCase(match);
    };
    affinity.value = this.current.affinity;
    family.value = this.current.family;
    grade.value = this.current.grade;
    modifier.value = this.current.modifier ?? "none";
    variant.value = String(this.current.variant);
    view.value = this.current.view;
    viewport.value = this.current.viewport;
    recipe.value = this.current.recipe;
    subject.value = this.current.subject;
    playerLevel.value = String(this.current.playerLevel);
    golden.checked = this.current.goldenBug;
    motion.checked = this.current.reducedMotion;
    selectReachable(this.current);
    syncCompositionControls();
    affinity.addEventListener("change", () => {
      selectReachable({ ...selectedCase(), affinity: affinity.value as EnemyAffinity });
      apply();
    });
    family.addEventListener("change", () => {
      selectReachable({ ...selectedCase(), family: family.value as EnemyFamily });
      apply();
    });
    grade.addEventListener("change", () => {
      selectReachable({ ...selectedCase(), grade: grade.value as EnemyGrade });
      apply();
    });
    modifier.addEventListener("change", () => {
      selectReachable({
        ...selectedCase(),
        modifier:
          modifier.value === "none"
            ? null
            : (modifier.value as Exclude<EnemyPresentationModifier, null>),
      });
      apply();
    });
    variant.addEventListener("change", () => {
      selectReachable({ ...selectedCase(), variant: Number(variant.value) as LabVariant });
      apply();
    });
    [view, viewport, recipe, subject, playerLevel].forEach((control) =>
      control.addEventListener("change", apply),
    );
    golden.addEventListener("change", () => {
      selectCase(
        toggleGoldenLabCase(
          canonicalLabCase({ ...selectedCase(), goldenBug: !golden.checked }),
          golden.checked,
        ),
      );
      apply();
    });
    motion.addEventListener("change", apply);
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
      affinity,
      grade,
      modifier,
      variant,
      golden,
      motion,
      view,
      viewport,
      recipe,
      subject,
      playerLevel,
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
    if (this.current.subject === "player") {
      this.unit = new LabPlayerEvolution(
        this.current.playerStage,
        this.current.reducedMotion,
        this.current.playerDetailLevel,
        this.current.playerLevel,
      );
      this.scene.add(this.unit.group);
    } else {
      this.unit = UNIT_FACTORIES.enemy.create(
        {
          ...inputForCase(this.current),
          reducedMotion: this.current.reducedMotion,
        },
        {
          compositionMode:
            this.current.recipe === "production" ? "production" : "legacy/no-overlay",
        },
      );
      this.unit.dispatchEnemy({ type: "spawn", parent: this.scene });
      this.disposeRecipe = attachLabRecipe(this.current.recipe, this.unit.view.group);
    }
    this.fitCameraToUnit();
    this.setCameraPreset(this.current.view);
    this.refreshOverlays();
    this.refreshReceipt();
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
    if (this.unit instanceof LabPlayerEvolution) {
      this.replayPlayer(cue);
      return;
    }
    this.replayEnemy(cue);
  }

  private replayPlayer(cue: string): void {
    if (!(this.unit instanceof LabPlayerEvolution)) return;
    if (cue === "hit" || cue === "critical") this.unit.replay("hit");
    if (cue === "attack" || cue.startsWith("effect-")) this.unit.replay("attack");
  }

  private replayEnemy(cue: string): void {
    if (this.unit === undefined || this.unit instanceof LabPlayerEvolution) return;
    if (cue === "idle") return;
    if (cue === "spawn") {
      this.unit.dispatchEnemy({ type: "spawn", parent: this.scene });
      return;
    }
    if (cue === "hit" || cue === "critical" || cue === "death")
      this.unit.dispatchEnemy({ type: cue });
    else {
      const effect = effectForLabCue(cue);
      if (effect !== undefined) this.addEffect(effect);
    }
  }

  private addEffect(kind: EffectKind): void {
    const origin =
      this.unit instanceof LabPlayerEvolution
        ? this.unit.group
            .getObjectByName("lab-player-socket-attack")
            ?.getWorldPosition(new THREE.Vector3())
        : this.unit?.enemyView.combatSocketWorldPosition();
    this.effects.add(kind, this.current.reducedMotion, origin, this.scene);
  }

  private tick(): void {
    this.unit?.tick();
    if (!(this.unit instanceof LabPlayerEvolution))
      advanceLabRecipe(this.current.recipe, this.unit?.view.group, this.current.reducedMotion);
    this.effects.advance();
    this.refreshReceipt();
  }

  private refreshOverlays(): void {
    this.disposeOverlays();
    if (this.unit === undefined) return;
    if (this.overlayState.has("axes")) this.overlays.add(new THREE.AxesHelper(2));
    const group = this.unit instanceof LabPlayerEvolution ? this.unit.group : this.unit.view.group;
    group.updateMatrixWorld(true);
    if (this.overlayState.has("bounds"))
      this.overlays.add(new THREE.Box3Helper(new THREE.Box3().setFromObject(group), 0xffcc66));
    if (this.overlayState.has("sockets"))
      group.traverse((node) => {
        if (node.name.startsWith("enemy-socket-") || node.name.startsWith("lab-player-socket-")) {
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
    this.fitCameraToUnit();
  }

  private fitCameraToUnit(): void {
    if (this.unit === undefined) return;
    const group = this.unit instanceof LabPlayerEvolution ? this.unit.group : this.unit.view.group;
    group.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(group);
    if (bounds.isEmpty()) return;
    const radius = bounds.getSize(new THREE.Vector3()).length() / 2;
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
    const limitingFov = Math.min(verticalFov, horizontalFov);
    this.cameraFocus.copy(bounds.getCenter(new THREE.Vector3()));
    this.cameraDistance = Math.max(4, (radius / Math.sin(limitingFov / 2)) * 1.1);
  }

  private frame(): void {
    if (!this.paused) {
      this.fractionalFrames += this.speed;
      while (this.fractionalFrames >= 1) {
        this.tick();
        this.fractionalFrames -= 1;
      }
    }
    const distance = this.cameraDistance * this.zoom;
    this.camera.position.set(
      this.cameraFocus.x + Math.sin(this.azimuth) * distance,
      this.cameraFocus.y + Math.sin(this.elevation) * distance,
      this.cameraFocus.z + Math.cos(this.azimuth) * distance,
    );
    this.camera.lookAt(this.cameraFocus);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.frame());
  }

  private refreshReceipt(): void {
    const live = resourceSnapshot(this.scene, this.renderer.info);
    const last =
      this.lastReceipt === undefined ? "" : ` | last disposal ${resourceReceipt(this.lastReceipt)}`;
    const playerDetail =
      this.current.subject === "player"
        ? ` | player level ${this.current.playerLevel} milestone ${this.unit instanceof LabPlayerEvolution ? this.unit.identity.milestoneLevel : this.current.playerLevel}`
        : "";
    const composition =
      this.current.subject === "enemy" ? compositionReceiptForCase(this.current) : undefined;
    const enemyReceipt =
      composition === undefined
        ? ""
        : ` | input ${JSON.stringify(composition.input)} seed ${composition.seed} identity ${composition.family}/body-${composition.bodyVariant}/${composition.affinity} grade ${composition.grade} modifier ${composition.modifierCue ?? "none"} palette ${composition.spec.affinity.palette.core}/${composition.spec.affinity.palette.accent} cue ${composition.spec.affinity.cue} reward ×${composition.spec.affinity.rewardMultiplier} geometry ${composition.geometryProfiles.join(",")}`;
    this.receipt.textContent = `case ${serializeLabCase(this.current)}${enemyReceipt}${playerDetail} | live ${resourceReceipt(live)} | effects ${this.effects.size}/${MAX_ACTIVE_EFFECTS} | matrix ${allLabCases().length}${last}`;
    const correction: string[] = [];
    if (this.current.correction !== undefined)
      correction.push(
        `Corrected visual-lab case: requested ${this.current.correction.requested}; canonical ${this.current.correction.canonical}`,
      );
    if (composition !== undefined) {
      const validation = validateLabRecipe(this.current.recipe, composition.family);
      if (!validation.valid)
        correction.push(`Invalid recipe: ${validation.reason ?? "unsupported"}`);
    }
    this.correction.textContent = correction.join(" | ");
  }

  private clearEffects(): void {
    const receipt = this.effects.dispose();
    if (receipt.expectedDisposals > 0) this.lastReceipt = receipt;
  }

  private disposeUnit(): void {
    if (this.unit === undefined) return;
    const group = this.unit instanceof LabPlayerEvolution ? this.unit.group : this.unit.view.group;
    const receipt = observeResourceDisposal(group);
    this.disposeRecipe?.();
    this.disposeRecipe = undefined;
    if (this.unit instanceof LabPlayerEvolution) this.unit.dispose();
    else this.unit.dispatchEnemy({ type: "dispose" });
    this.lastReceipt = receipt();
    this.unit = undefined;
  }
}

const host = document.querySelector<HTMLElement>("#visual-lab");
if (host === null) throw new Error("Visual lab host is missing");
document.body.className = "visual-lab-page";
host.className = "visual-lab-root";
new VisualLab(host);
