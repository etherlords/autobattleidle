/* ABI-007 independent pre-closure QA; production-valid ABI-011 codec fixtures. */
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
const {
  chromium,
} = require("C:/Users/Asfel/AppData/Local/OpenAI/Codex/runtimes/cua_node/e4d75eceaa042f20/bin/node_modules/playwright");
const fs = require("fs");
const base = process.env.ABI007_BASE_URL ?? "https://etherlords.github.io/autobattleidle/";
const key = "etherlords.autobattleidle.save.v3";
const v1Fixture = fs.readFileSync("src/persistence/fixtures/save-v1.json", "utf8");
const v2Fixture = fs.readFileSync("src/persistence/fixtures/save-v2.json", "utf8");
const abi007Fixtures = new Set([
  "armor-effect",
  "auto-unlocked",
  "auto-slow",
  "boss-fixture-70",
  "boss-fixture-105",
]);
const load = (name) =>
  JSON.parse(
    fs.readFileSync(
      `output/playwright/${name.startsWith("body-") || abi007Fixtures.has(name) ? "abi007" : "abi011"}-${name}.json`,
      "utf8",
    ),
  );
const out = "output/playwright/abi007-";

const canvasReceipt = async (page) => {
  const receipt = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll("canvas")];
    return { count: canvases.length, dataset: { ...(canvases[0]?.dataset ?? {}) } };
  });
  if (receipt.count !== 1) throw new Error(`Expected one canvas, got ${receipt.count}`);
  if (Number(receipt.dataset.activeEffectCount ?? 0) > 12)
    throw new Error(`Effect count exceeded bound: ${receipt.dataset.activeEffectCount}`);
  return receipt.dataset;
};

const canvasIdentity = async (page, expectedFamily) => {
  const identity = await canvasReceipt(page);
  if (identity.enemyFamily !== expectedFamily)
    throw new Error(
      `Expected rendered ${expectedFamily}, got ${identity.enemyFamily ?? "missing"}`,
    );
  if (!/^\d+$/.test(identity.enemyVariant ?? "") || !/^\d+$/.test(identity.enemySeed ?? ""))
    throw new Error(`Missing stable canvas variant/seed for ${expectedFamily}`);
  return identity;
};

const expectEffects = async (page, ...expected) => {
  await page.waitForFunction(
    (kinds) => {
      const trace = window.__abi007EffectTrace ?? [];
      return trace.some((observed) => kinds.every((kind) => observed.includes(kind)));
    },
    expected,
    { timeout: 1_000 },
  );
  const kinds = await page.evaluate((expectedKinds) => {
    const trace = window.__abi007EffectTrace ?? [];
    return trace.find((observed) => expectedKinds.every((kind) => observed.includes(kind))) ?? [];
  }, expected);
  for (const kind of expected) {
    if (!kinds.includes(kind))
      throw new Error(`Expected canvas effect ${kind}, got ${kinds.join(",")}`);
  }
  return kinds;
};

const health = (page) => page.locator(".enemy-health").getAttribute("aria-valuenow");
const automatic = (page) =>
  page.locator(".automatic-progress").evaluate((element) => ({
    fill: element.querySelector(".automatic-progress-fill")?.style.width,
    max: element.getAttribute("aria-valuemax"),
    now: element.getAttribute("aria-valuenow"),
  }));

async function scenario(name, save, viewport, action, options = {}) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const context = await browser.newContext({
    viewport,
    reducedMotion: options.reduce ? "reduce" : "no-preference",
  });
  await context.addInitScript(
    ({ save: value, key: storageKey, extra }) => {
      localStorage.clear();
      if (value !== null) localStorage.setItem(storageKey, JSON.stringify(value));
      for (const [k, v] of Object.entries(extra ?? {}))
        localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
      Math.random = () => 0;
    },
    { save, key, extra: options.extraStorage },
  );
  const page = await context.newPage();
  const errors = [],
    failed = [];
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => failed.push(`${r.url()} ${r.failure()?.errorText ?? "unknown"}`));
  await page.goto(base, { waitUntil: "networkidle" });
  const initialCanvas = await canvasReceipt(page);
  await page.evaluate(() => {
    window.__abi007EffectTrace = [];
    const canvas = document.querySelector("canvas");
    new MutationObserver(() => {
      const effects = canvas?.dataset.lastEffectKinds?.split(",").filter(Boolean) ?? [];
      if (effects.length > 0) window.__abi007EffectTrace.push(effects);
    }).observe(canvas, { attributes: true, attributeFilter: ["data-last-effect-kinds"] });
  });
  if (options.expectedFamily !== undefined) await canvasIdentity(page, options.expectedFamily);
  const initial = await page.locator(".hud-status").innerText();
  const before = await page.evaluate(() => ({
    text: document.body.innerText,
    width: document.body.scrollWidth,
    height: document.body.scrollHeight,
    innerWidth: innerWidth,
    canvases: document.querySelectorAll("canvas").length,
  }));
  const actionResult = await action(page);
  await page.waitForTimeout(options.wait ?? 300);
  const result = await page.locator(".hud-status").innerText();
  const after = await page.evaluate(() => ({
    text: document.body.innerText,
    width: document.body.scrollWidth,
    height: document.body.scrollHeight,
    innerWidth: innerWidth,
    canvases: document.querySelectorAll("canvas").length,
    resources: performance
      .getEntriesByType("resource")
      .map((r) => ({ name: r.name, duration: Math.round(r.duration) })),
  }));
  const resultCanvas = await canvasReceipt(page);
  if (options.expectedFamily !== undefined) await canvasIdentity(page, options.expectedFamily);
  await page.screenshot({ path: `${out}${name}.png`, fullPage: true });
  const receipt = {
    name,
    url: page.url(),
    viewport,
    reducedMotion: Boolean(options.reduce),
    initial,
    result,
    before,
    after,
    initialCanvas,
    resultCanvas,
    actionResult,
    errors,
    failed,
    storage: await page.evaluate((storageKey) => localStorage.getItem(storageKey), key),
  };
  fs.writeFileSync(`${out}${name}.json`, JSON.stringify(receipt, null, 2));
  await context.close();
  await browser.close();
  return receipt;
}

const attack = async (page, key = "Enter") => {
  await page.locator(".battlefield").focus();
  await page.keyboard.press(key);
};
const all = [];
(async () => {
  all.push(
    await scenario(
      "input-desktop",
      load("armor-effect"),
      { width: 1280, height: 800 },
      async (p) => {
        const before = await health(p);
        const field = p.locator(".battlefield");
        const box = await field.boundingBox();
        if (box === null) throw new Error("Battlefield is not visible for pointer input");
        await p.mouse.move(box.x + 10, box.y + 10);
        await p.mouse.down();
        await p.mouse.move(box.x + 30, box.y + 10);
        await p.mouse.up();
        await p.mouse.move(box.x + 10, box.y + 10);
        await p.mouse.down();
        await field.dispatchEvent("pointercancel", { isPrimary: true, pointerId: 1 });
        await p.mouse.up();
        if ((await health(p)) !== before) throw new Error("Drag or cancel caused an attack");
        await p.mouse.click(box.x + 10, box.y + 10);
        const afterTap = await health(p);
        if (Number(afterTap) >= Number(before))
          throw new Error("Stationary pointer did not attack");
        return { afterTap, before, effects: await expectEffects(p, "armor") };
      },
    ),
  );
  all.push(
    await scenario(
      "hud-modal-narrow",
      load("critical-hit"),
      { width: 390, height: 844 },
      async (p) => {
        await p.getByRole("button", { name: "Upgrades" }).click();
        await p.keyboard.press("Escape");
        await attack(p);
        return { effects: await expectEffects(p, "critical") };
      },
    ),
  );
  all.push(
    await scenario(
      "automatic-normal",
      load("auto-unlocked"),
      { width: 1280, height: 800 },
      async (p) => {
        const before = await automatic(p);
        await p.waitForTimeout(150);
        const mid = await automatic(p);
        const healthBeforeManual = await health(p);
        await attack(p);
        const afterManual = await automatic(p);
        if ((await health(p)) === healthBeforeManual)
          throw new Error("Manual attack did not change health");
        if (Number(afterManual.now) > Number(mid.now))
          throw new Error("Manual attack reset automatic cooldown");
        await p.getByRole("button", { name: "Upgrades" }).click();
        await p.getByRole("button", { name: /Damage/ }).click();
        if (!(await p.locator(".upgrades").innerText()).includes("Damage - 1"))
          throw new Error("Damage upgrade did not apply");
        await p.evaluate(() => {
          window.__abi007EffectTrace = [];
        });
        await p.waitForTimeout(1_100);
        const afterAuto = await automatic(p);
        if (Number(mid.now) >= Number(before.now))
          throw new Error("Automatic fill did not count down");
        if (Number(afterAuto.now) >= Number(afterAuto.max))
          throw new Error("Automatic cooldown did not restart");
        return { afterAuto, afterManual, before, effects: await expectEffects(p, "hit"), mid };
      },
    ),
  );
  all.push(
    await scenario("automatic-slow", load("auto-slow"), { width: 1280, height: 800 }, async (p) => {
      const before = await automatic(p);
      if (Number(before.max) <= 1_000) throw new Error("Automatic-slow did not extend cooldown");
      const healthBeforeManual = await health(p);
      await attack(p);
      if ((await health(p)) === healthBeforeManual)
        throw new Error("Manual attack did not remain active");
      return { before, modifier: (await canvasReceipt(p)).enemyModifier };
    }),
  );
  all.push(
    await scenario(
      "boss-transition",
      load("boss-transition"),
      { width: 1280, height: 800 },
      async (p) => {
        await attack(p);
        return { effects: await expectEffects(p, "death", "coin", "boss") };
      },
    ),
  );
  for (const encounter of [70, 105]) {
    all.push(
      await scenario(
        `boss-${encounter}`,
        load(`boss-fixture-${encounter}`),
        { width: 1280, height: 800 },
        async (p) => {
          const before = await p.locator(".hud-status h1").innerText();
          await attack(p);
          await p.waitForFunction(
            (expected) => document.querySelector(".hud-status h1")?.textContent !== expected,
            before,
            { timeout: 1_000 },
          );
          const after = await p.locator(".hud-status h1").innerText();
          if (before === after) throw new Error(`Boss ${encounter} did not progress`);
          return { after, before, effects: await expectEffects(p, "death", "coin", "boss") };
        },
      ),
    );
  }
  all.push(
    await scenario(
      "golden-kill",
      load("golden-bug-kill"),
      { width: 1280, height: 800 },
      async (p) => {
        await attack(p);
        return { effects: await expectEffects(p, "death", "coin", "golden-kill") };
      },
      { expectedFamily: "beetle" },
    ),
  );
  all.push(
    await scenario(
      "golden-escape-reduced",
      load("golden-bug-escape"),
      { width: 390, height: 844 },
      async (p) => {
        await p.waitForTimeout(10_500);
        return { effects: await expectEffects(p, "golden-escape") };
      },
      { wait: 0, reduce: true },
    ),
  );
  all.push(
    await scenario(
      "golden-reload",
      load("golden-bug-escape"),
      { width: 1280, height: 800 },
      async (p) => {
        const initialCanvas = await canvasIdentity(p, "beetle");
        const before = await p.locator(".hud-status").innerText();
        await p.reload({ waitUntil: "networkidle" });
        const afterCanvas = await canvasIdentity(p, "beetle");
        if (
          initialCanvas.enemyVariant !== afterCanvas.enemyVariant ||
          initialCanvas.enemySeed !== afterCanvas.enemySeed
        )
          throw new Error("Golden Bug canvas identity changed after reload");
        await p.waitForTimeout(150);
        const after = await p.locator(".hud-status").innerText();
        await p.screenshot({ path: `${out}golden-reload-after.png` });
        fs.writeFileSync(
          `${out}golden-reload-transition.json`,
          JSON.stringify(
            { before, after, persisted: await p.evaluate((k) => localStorage.getItem(k), key) },
            null,
            2,
          ),
        );
      },
      { expectedFamily: "beetle" },
    ),
  );
  all.push(
    await scenario(
      "persistence-recovery",
      null,
      { width: 1280, height: 800 },
      async (p) => {
        await p.waitForTimeout(200);
        const slots = await p.evaluate(() => ({
          v1: localStorage.getItem("etherlords.autobattleidle.save.v1"),
          v2: localStorage.getItem("etherlords.autobattleidle.save.v2"),
          v3: localStorage.getItem("etherlords.autobattleidle.save.v3"),
        }));
        if (slots.v1 !== v1Fixture || slots.v2 !== v2Fixture || slots.v3 === null)
          throw new Error("Historical save bytes were not preserved during recovery");
        return slots;
      },
      {
        extraStorage: {
          "etherlords.autobattleidle.save.v3": "{bad",
          "etherlords.autobattleidle.save.v2": v2Fixture,
          "etherlords.autobattleidle.save.v1": v1Fixture,
        },
      },
    ),
  );
  all.push(
    await scenario(
      "persistence-v1-migration",
      null,
      { width: 1280, height: 800 },
      async (p) => {
        await p.waitForTimeout(200);
        const slots = await p.evaluate(() => ({
          v1: localStorage.getItem("etherlords.autobattleidle.save.v1"),
          v3: localStorage.getItem("etherlords.autobattleidle.save.v3"),
        }));
        if (slots.v1 !== v1Fixture || slots.v3 === null)
          throw new Error("V1 migration did not preserve source bytes and publish V3");
        return slots;
      },
      {
        extraStorage: { "etherlords.autobattleidle.save.v1": v1Fixture },
      },
    ),
  );
  all.push(
    await scenario(
      "persistence-future-reset",
      null,
      { width: 1280, height: 800 },
      async (p) => {
        const future = JSON.stringify({ version: 99 });
        if ((await p.evaluate((k) => localStorage.getItem(k), key)) !== future)
          throw new Error("Future save was not preserved before explicit reset");
        await p.getByRole("button", { name: "Upgrades" }).click();
        let confirmCalls = 0;
        p.on("dialog", (dialog) => {
          confirmCalls += 1;
          void dialog.dismiss();
        });
        await p.getByRole("button", { name: "Reset progress" }).click();
        await p.waitForTimeout(100);
        if ((await p.evaluate((k) => localStorage.getItem(k), key)) !== future)
          throw new Error("Cancelled reset changed future save");
        p.removeAllListeners("dialog");
        p.on("dialog", (dialog) => void dialog.accept());
        await p.getByRole("button", { name: "Reset progress" }).click();
        await p.waitForTimeout(100);
        const finalStorage = await p.evaluate((k) => localStorage.getItem(k), key);
        if (finalStorage !== null) throw new Error("Confirmed reset did not clear current save");
        fs.writeFileSync(
          `${out}future-reset-transition.json`,
          JSON.stringify(
            {
              cancelConfirmCalls: confirmCalls,
              finalStorage,
            },
            null,
            2,
          ),
        );
      },
      { extraStorage: { "etherlords.autobattleidle.save.v3": JSON.stringify({ version: 99 }) } },
    ),
  );
  for (const body of [
    "beetle",
    "brute",
    "wisp",
    "mantis",
    "sentinel",
    "drake",
    "boss-hydra",
    "boss-colossus",
  ]) {
    all.push(
      await scenario(
        `visual-${body}`,
        load(`body-${body}`),
        { width: 1280, height: 800 },
        async (p) => {
          await canvasIdentity(p, body);
          await p.locator("canvas").screenshot({ path: `${out}visual-${body}-before.png` });
          await p.reload({ waitUntil: "networkidle" });
          await canvasIdentity(p, body);
          await p.locator("canvas").screenshot({ path: `${out}visual-${body}-after.png` });
        },
        { expectedFamily: body },
      ),
    );
  }
  fs.writeFileSync(
    `${out}summary.json`,
    JSON.stringify(
      {
        base,
        observedAt: new Date().toISOString(),
        publishedSha: "5a1b1eaec70a64e7906795886e44f557b9c09665",
        cases: all,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      all.map(({ name, initial, result, errors, failed, after }) => ({
        name,
        initial,
        result,
        errors,
        failed,
        overflow: after.width !== after.innerWidth,
      })),
    ),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
