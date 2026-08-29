/* ABI-026 candidate-specific visual QA harness; no product mutation. */
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
const {
  chromium,
} = require("C:/Users/Asfel/AppData/Local/OpenAI/Codex/runtimes/cua_node/e4d75eceaa042f20/bin/node_modules/playwright");
const { createHash } = require("crypto");
const { execFileSync } = require("child_process");
const fs = require("fs");

const base = process.env.ABI026_BASE_URL ?? "http://127.0.0.1:4173/autobattleidle/";
const out = "output/playwright/abi026-";
const saveKey = "etherlords.autobattleidle.save.v3";
const candidatePaths = ["src/game/enemy-visual", "src/game/battlefield/effects.ts"];
const sourceFiles = [
  "src/game/enemy-visual/bodies.ts",
  "src/game/enemy-visual/builder.ts",
  "src/game/enemy-visual/components.ts",
  "src/game/enemy-visual/decorators/grade-cue-decorator.ts",
  "src/game/enemy-visual/decorators/modifier-cue-decorator.ts",
  "src/game/enemy-visual/decorators/seeded-decoration-decorator.ts",
  "src/game/battlefield/effects.ts",
];
const fixture = (name) => JSON.parse(fs.readFileSync(`${out}${name}.json`, "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const binding = () => {
  const diff = execFileSync("git", ["diff", "--binary", "HEAD", "--", ...candidatePaths], {
    encoding: "utf8",
  });
  return {
    candidateDiffSha256: sha256(diff),
    currentHead: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    generatedAt: new Date().toISOString(),
    sourceMtimesUtc: Object.fromEntries(
      sourceFiles.map((path) => [path, fs.statSync(path).mtime.toISOString()]),
    ),
    base,
  };
};

const canvasReceipt = async (page) => {
  const receipt = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    return {
      count: document.querySelectorAll("canvas").length,
      dataset: { ...(canvas?.dataset ?? {}) },
    };
  });
  if (receipt.count !== 1) throw new Error(`Expected one canvas, got ${receipt.count}`);
  if (Number(receipt.dataset.activeEffectCount ?? 0) > 12) throw new Error("Effect bound exceeded");
  return receipt.dataset;
};

const installEffectTrace = (page) =>
  page.evaluate(() => {
    window.__abi026EffectTrace = [];
    const canvas = document.querySelector("canvas");
    new MutationObserver(() => {
      const kinds = canvas?.dataset.lastEffectKinds?.split(",").filter(Boolean) ?? [];
      if (kinds.length > 0) window.__abi026EffectTrace.push(kinds);
    }).observe(canvas, { attributes: true, attributeFilter: ["data-last-effect-kinds"] });
  });

const assets = async (page) => {
  const urls = await page.evaluate(() =>
    [...document.querySelectorAll("script[src], link[href]")]
      .map((element) => element.src || element.href)
      .filter((url) => /\.(?:js|ts|css)(?:\?|$)/.test(url)),
  );
  return Promise.all(
    [...new Set(urls)].map(async (url) => ({
      kind: /\/assets\//.test(url) ? "production-asset" : "development-module",
      url,
      sha256: sha256(Buffer.from(await (await fetch(url)).arrayBuffer())),
    })),
  );
};

async function withPage(save, viewport, reducedMotion, visit) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const context = await browser.newContext({
    viewport,
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  const errors = [];
  const failed = [];
  try {
    await context.addInitScript(
      ({ key, value }) => {
        localStorage.clear();
        localStorage.setItem(key, JSON.stringify(value));
        Math.random = () => 0;
      },
      { key: saveKey, value: save },
    );
    const page = await context.newPage();
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        errors.push(`${message.type()}: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("requestfailed", (request) =>
      failed.push(`${request.url()} ${request.failure()?.errorText ?? "unknown"}`),
    );
    await page.goto(base, { waitUntil: "networkidle" });
    await installEffectTrace(page);
    return await visit(page, { errors, failed });
  } finally {
    await context.close();
    await browser.close();
  }
}

const health = (page) => page.locator(".enemy-health").getAttribute("aria-valuenow");
const attack = async (page) => {
  await page.locator(".battlefield").focus();
  await page.keyboard.press("Enter");
};

async function motionCase(name, fixtureName, expectedFamily, viewport, reducedMotion) {
  const result = await withPage(
    fixture(fixtureName),
    viewport,
    reducedMotion,
    async (page, healthState) => {
      const idle = await canvasReceipt(page);
      if (idle.enemyFamily !== expectedFamily)
        throw new Error(`Expected ${expectedFamily}, got ${idle.enemyFamily}`);
      const beforeHealth = await health(page);
      await page.screenshot({ path: `${out}${name}-idle.png` });
      await attack(page);
      await page.waitForTimeout(75);
      const mid = await canvasReceipt(page);
      await page.screenshot({ path: `${out}${name}-mid.png` });
      await page.waitForTimeout(125);
      const final = await canvasReceipt(page);
      await page.screenshot({ path: `${out}${name}-final.png` });
      await page.waitForTimeout(225);
      const nextIdle = await canvasReceipt(page);
      await page.screenshot({ path: `${out}${name}-next-idle.png` });
      const effects = await page.evaluate(() => window.__abi026EffectTrace ?? []);
      const expectedCue = fixtureName.endsWith("critical") ? "critical" : "hit";
      if (!effects.some((kinds) => kinds.includes(expectedCue)))
        throw new Error(`Missing ${expectedCue} cue`);
      if (Number(await health(page)) >= Number(beforeHealth))
        throw new Error("Attack did not change health");
      const layout = await page.evaluate(() => ({
        canvasCount: document.querySelectorAll("canvas").length,
        overflow: document.body.scrollWidth !== innerWidth,
        resources: performance.getEntriesByType("resource").length,
      }));
      if (healthState.errors.length !== 0 || healthState.failed.length !== 0 || layout.overflow)
        throw new Error(`Health failure: ${JSON.stringify({ ...healthState, layout })}`);
      return { beforeHealth, idle, mid, final, nextIdle, effects, layout, ...healthState };
    },
  );
  fs.writeFileSync(`${out}${name}.json`, JSON.stringify(result, null, 2));
  return result;
}

async function familyReload(name, expectedFamily) {
  const result = await withPage(
    fixture(name),
    { width: 1280, height: 800 },
    false,
    async (page, healthState) => {
      const before = await canvasReceipt(page);
      if (before.enemyFamily !== expectedFamily)
        throw new Error(`Expected ${expectedFamily}, got ${before.enemyFamily}`);
      await page.screenshot({ path: `${out}family-${expectedFamily}-before.png` });
      await page.reload({ waitUntil: "networkidle" });
      const after = await canvasReceipt(page);
      await page.screenshot({ path: `${out}family-${expectedFamily}-after.png` });
      if (
        before.enemyFamily !== after.enemyFamily ||
        before.enemyVariant !== after.enemyVariant ||
        before.enemySeed !== after.enemySeed
      )
        throw new Error(`Identity changed after reload for ${expectedFamily}`);
      if (healthState.errors.length !== 0 || healthState.failed.length !== 0)
        throw new Error(`Health failure for ${expectedFamily}`);
      return { before, after, ...healthState };
    },
  );
  fs.writeFileSync(`${out}family-${expectedFamily}.json`, JSON.stringify(result, null, 2));
  return result;
}

(async () => {
  const candidate = binding();
  const cases = [];
  cases.push(
    await motionCase(
      "hydra-desktop-hit",
      "body-boss-hydra",
      "boss-hydra",
      { width: 1280, height: 800 },
      false,
    ),
  );
  cases.push(
    await motionCase(
      "hydra-desktop-critical",
      "hydra-critical",
      "boss-hydra",
      { width: 1280, height: 800 },
      false,
    ),
  );
  cases.push(
    await motionCase(
      "hydra-narrow-reduced",
      "hydra-critical",
      "boss-hydra",
      { width: 390, height: 844 },
      true,
    ),
  );
  cases.push(
    await motionCase(
      "colossus-desktop-hit",
      "body-boss-colossus",
      "boss-colossus",
      { width: 1280, height: 800 },
      false,
    ),
  );
  cases.push(
    await motionCase(
      "colossus-desktop-critical",
      "colossus-critical",
      "boss-colossus",
      { width: 1280, height: 800 },
      false,
    ),
  );
  cases.push(
    await motionCase(
      "colossus-narrow-reduced",
      "colossus-critical",
      "boss-colossus",
      { width: 390, height: 844 },
      true,
    ),
  );
  cases.push(
    await motionCase("armor-shield", "armor-shield", "brute", { width: 1280, height: 800 }, false),
  );
  const families = await Promise.all(
    [
      ["body-beetle", "beetle"],
      ["body-brute", "brute"],
      ["body-wisp", "wisp"],
      ["body-mantis", "mantis"],
      ["body-sentinel", "sentinel"],
      ["body-drake", "drake"],
      ["body-boss-hydra", "boss-hydra"],
      ["body-boss-colossus", "boss-colossus"],
    ].map(([name, family]) => familyReload(name, family)),
  );
  const assetProbe = await withPage(
    fixture("body-boss-hydra"),
    { width: 1280, height: 800 },
    false,
    async (page) => assets(page),
  );
  const summary = {
    candidate,
    assetBinding: {
      entries: assetProbe,
      mode: assetProbe.every((asset) => asset.kind === "production-asset")
        ? "production-assets"
        : "development-modules",
    },
    cases,
    families,
  };
  fs.writeFileSync(`${out}candidate-summary.json`, JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify({ head: candidate.currentHead, cases: cases.length, families: families.length }),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
