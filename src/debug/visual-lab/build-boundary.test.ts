import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import config from "../../../vite.config";

describe("visual lab build and isolation boundaries", () => {
  it("keeps the lab out of normal builds and exposes it only in the explicit debug build", () => {
    const normal = config({
      command: "build",
      mode: "production",
      isSsrBuild: false,
      isPreview: false,
    });
    const debug = config({
      command: "build",
      mode: "visual-lab",
      isSsrBuild: false,
      isPreview: false,
    });
    expect(normal.build?.rollupOptions?.input).toEqual({ app: "index.html" });
    expect(debug.build?.rollupOptions?.input).toEqual({
      app: "index.html",
      visualLab: "visual-lab.html",
    });
  });

  it("publishes both app and lab entries in the Pages artifact without changing the normal build", () => {
    const workflow = readFileSync(
      new URL("../../../.github/workflows/pages.yml", import.meta.url),
      "utf8",
    );
    expect(workflow).toContain("pnpm build:visual-lab");
    expect(workflow).toContain("path: dist");
  });

  it("keeps the lab entrypoint outside saves, progression, and network clients", () => {
    const source = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/localStorage|fetch\(|XMLHttpRequest|leaderboard|createCombatState/);
  });

  it("keeps controls narrow-safe through a stable CSS contract", () => {
    const entry = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./visual-lab.css", import.meta.url), "utf8");
    expect(entry).toContain('host.className = "visual-lab-root"');
    expect(styles).toMatch(/flex-wrap: wrap/);
    expect(styles).toMatch(/min-height: 36px/);
    expect(styles).toMatch(/max-width: 100%/);
    expect(styles).toMatch(/@media \(max-width: 480px\)/);
  });

  it("refreshes the visible receipt at the same replacement seam as the canonical render", () => {
    const entry = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
    expect(entry).toMatch(/this\.refreshOverlays\(\);\s*this\.refreshReceipt\(\);/);
    expect(entry).toContain("case ${serializeLabCase(this.current)}");
  });
});
