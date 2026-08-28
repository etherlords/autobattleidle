/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
async function deployedProof(page) {
  const url = "https://etherlords.github.io/autobattleidle/";
  const legacyKey = "etherlords.autobattleidle.save";
  const v1Key = "etherlords.autobattleidle.save.v1";
  const v2Key = "etherlords.autobattleidle.save.v2";
  const suppliedV2 =
    '{"automaticUnlocked":true,"coins":25,"enemy":{"armor":30,"encounter":30,"health":10793,"id":30,"maxHealth":19980,"reward":4860,"grade":"boss","modifier":null},"player":{"automaticSpeedLevel":4,"armorPenetrationLevel":7,"criticalChance":0.12,"criticalLevel":5,"damage":52,"damageLevel":14,"doubleRewardChance":0.13846153846153844,"doubleRewardLevel":6},"version":2}';
  const authenticV1 =
    '{"automaticUnlocked":true,"coins":7,"enemy":{"armor":0,"encounter":1,"grade":"normal","health":6,"id":1,"maxHealth":10,"modifier":null,"reward":1},"player":{"automaticSpeedLevel":1,"criticalChance":0.1,"damage":2,"doubleRewardChance":0.2},"version":1}';
  const consoleProblems = [];
  const canonicalJson = (raw) => {
    const sort = (value) =>
      Array.isArray(value)
        ? value.map(sort)
        : value !== null && typeof value === "object"
          ? Object.fromEntries(
              Object.entries(value)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, entry]) => [key, sort(entry)]),
            )
          : value;
    return JSON.stringify(sort(JSON.parse(raw)));
  };

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      consoleProblems.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => consoleProblems.push(`pageerror: ${error.message}`));
  await page.addInitScript(() => {
    window.requestAnimationFrame = () => 1;
    window.cancelAnimationFrame = () => undefined;
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay = 0, ...args) =>
      nativeSetTimeout(callback, delay === 250 ? 60000 : delay, ...args);
    const nativeSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (
        key === "etherlords.autobattleidle.save.v2" &&
        sessionStorage.getItem("abi013-fail-v2-once") === "1"
      ) {
        sessionStorage.setItem("abi013-fail-v2-once", "0");
        throw new DOMException("ABI-013 one-time publish failure", "QuotaExceededError");
      }
      return nativeSetItem.call(this, key, value);
    };
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(
    ({ legacyKey, suppliedV2, v1Key, v2Key }) => {
      localStorage.removeItem(v1Key);
      localStorage.removeItem(v2Key);
      localStorage.setItem(legacyKey, suppliedV2);
    },
    { legacyKey, suppliedV2, v1Key, v2Key },
  );
  await page.reload({ waitUntil: "networkidle" });
  const imported = await page.evaluate(
    ({ legacyKey, suppliedV2, v2Key }) => ({
      body: document.body.innerText,
      legacyBytesEqual: localStorage.getItem(legacyKey) === suppliedV2,
      v2Raw: localStorage.getItem(v2Key),
    }),
    { legacyKey, suppliedV2, v2Key },
  );
  if (
    !imported.legacyBytesEqual ||
    imported.v2Raw === null ||
    canonicalJson(imported.v2Raw) !== canonicalJson(suppliedV2)
  )
    throw new Error("Supplied V2 was not imported without data loss");
  if (!imported.body.includes("Coins: 25") || !imported.body.includes("Level 30"))
    throw new Error("Supplied V2 state is not visible");
  await page.screenshot({
    path: "output/playwright/abi013-deployed-v2-import.png",
    fullPage: true,
  });

  await page.reload({ waitUntil: "networkidle" });
  const stableV2 = await page.evaluate(
    ({ legacyKey, suppliedV2, v2Key }) => ({
      legacyBytesEqual: localStorage.getItem(legacyKey) === suppliedV2,
      v2Raw: localStorage.getItem(v2Key),
    }),
    { legacyKey, suppliedV2, v2Key },
  );
  if (!stableV2.legacyBytesEqual || stableV2.v2Raw !== imported.v2Raw)
    throw new Error("Supplied V2 was not reload-stable");

  const conflictingLegacy = suppliedV2.replace('"coins":25', '"coins":999');
  await page.evaluate(
    ({ conflictingLegacy, legacyKey }) => localStorage.setItem(legacyKey, conflictingLegacy),
    { conflictingLegacy, legacyKey },
  );
  await page.reload({ waitUntil: "networkidle" });
  const precedence = await page.evaluate(
    ({ v2Key }) => ({
      body: document.body.innerText,
      v2Raw: localStorage.getItem(v2Key),
    }),
    { v2Key },
  );
  if (precedence.v2Raw !== imported.v2Raw || !precedence.body.includes("Coins: 25"))
    throw new Error("Valid V2 precedence failed");

  await page.evaluate(
    ({ authenticV1, legacyKey, v1Key, v2Key }) => {
      localStorage.removeItem(legacyKey);
      localStorage.removeItem(v2Key);
      localStorage.setItem(v1Key, authenticV1);
    },
    { authenticV1, legacyKey, v1Key, v2Key },
  );
  await page.reload({ waitUntil: "networkidle" });
  const migrated = await page.evaluate(
    ({ authenticV1, v1Key, v2Key }) => {
      const v2 = JSON.parse(localStorage.getItem(v2Key) ?? "null");
      return {
        body: document.body.innerText,
        sourceBytesEqual: localStorage.getItem(v1Key) === authenticV1,
        v2,
      };
    },
    { authenticV1, v1Key, v2Key },
  );
  if (!migrated.sourceBytesEqual || migrated.v2?.version !== 2 || migrated.v2?.coins !== 7)
    throw new Error("Authentic V1 migration failed");
  if (!migrated.body.includes("Coins: 7")) throw new Error("Migrated V1 state is not visible");
  await page.screenshot({
    path: "output/playwright/abi013-deployed-v1-migration.png",
    fullPage: true,
  });

  await page.evaluate(
    ({ authenticV1, v1Key, v2Key }) => {
      localStorage.setItem(v1Key, authenticV1);
      localStorage.setItem(v2Key, "");
      sessionStorage.setItem("abi013-fail-v2-once", "1");
    },
    { authenticV1, v1Key, v2Key },
  );
  await page.reload({ waitUntil: "networkidle" });
  const restore = page.locator("button.restore-progress");
  if (!(await restore.isVisible()))
    throw new Error("Restore action is not available after failed publish");
  await restore.focus();
  if (!(await restore.evaluate((element) => element === document.activeElement)))
    throw new Error("Restore action cannot receive focus");
  await restore.press("Enter");
  const status = await page.locator(".persistence-status").textContent();
  if (status !== "Progress restored from the previous version.")
    throw new Error(`Unexpected Restore status: ${status}`);
  const restored = await page.evaluate(
    ({ authenticV1, v1Key, v2Key }) => ({
      sourceBytesEqual: localStorage.getItem(v1Key) === authenticV1,
      v2: JSON.parse(localStorage.getItem(v2Key) ?? "null"),
    }),
    { authenticV1, v1Key, v2Key },
  );
  if (!restored.sourceBytesEqual || restored.v2?.version !== 2 || restored.v2?.coins !== 7)
    throw new Error("Keyboard Restore did not safely publish V2");
  await page.screenshot({
    path: "output/playwright/abi013-deployed-restore-keyboard.png",
    fullPage: true,
  });

  await page.reload({ waitUntil: "networkidle" });
  const restoredReload = await page.evaluate(
    ({ authenticV1, v1Key, v2Key }) => ({
      body: document.body.innerText,
      sourceBytesEqual: localStorage.getItem(v1Key) === authenticV1,
      v2: JSON.parse(localStorage.getItem(v2Key) ?? "null"),
    }),
    { authenticV1, v1Key, v2Key },
  );
  if (
    !restoredReload.sourceBytesEqual ||
    restoredReload.v2?.coins !== 7 ||
    !restoredReload.body.includes("Coins: 7")
  )
    throw new Error("Restored V2 was not reload-stable");
  if (consoleProblems.length > 0)
    throw new Error(`Console problems: ${consoleProblems.join(" | ")}`);

  return {
    url,
    suppliedV2Import: imported,
    suppliedV2ReloadStable: stableV2,
    validV2Precedence: precedence,
    authenticV1Migration: {
      sourceBytesEqual: migrated.sourceBytesEqual,
      version: migrated.v2.version,
      coins: migrated.v2.coins,
      encounter: migrated.v2.enemy.encounter,
    },
    keyboardRestore: {
      status,
      sourceBytesEqual: restored.sourceBytesEqual,
      version: restored.v2.version,
      coins: restored.v2.coins,
    },
    restoredReloadStable: {
      sourceBytesEqual: restoredReload.sourceBytesEqual,
      version: restoredReload.v2.version,
      coins: restoredReload.v2.coins,
    },
    consoleProblems,
  };
}
