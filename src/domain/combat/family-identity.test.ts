import { describe, expect, it } from "vitest";

import { selectEnemyFamilyIdentity } from "./family-identity";

describe("enemy family identity", () => {
  it("maps every rendered family to its readable label and preserves Golden Bug identity", () => {
    const families = [
      selectEnemyFamilyIdentity({ grade: "normal", level: 1, modifier: null }),
      selectEnemyFamilyIdentity({ grade: "normal", level: 2, modifier: null }),
      selectEnemyFamilyIdentity({ grade: "normal", level: 3, modifier: null }),
      selectEnemyFamilyIdentity({ grade: "elite", level: 3, modifier: "hardened" }),
      selectEnemyFamilyIdentity({ grade: "elite", level: 3, modifier: "critical-guard" }),
      selectEnemyFamilyIdentity({ grade: "elite", level: 3, modifier: "manual-guard" }),
      selectEnemyFamilyIdentity({ grade: "boss", level: 35, modifier: null }),
      selectEnemyFamilyIdentity({ grade: "boss", level: 70, modifier: null }),
      selectEnemyFamilyIdentity({ grade: "boss", level: 105, modifier: null }),
      selectEnemyFamilyIdentity({ grade: "boss", level: 140, modifier: null }),
      selectEnemyFamilyIdentity({ grade: "boss", level: 175, modifier: null }),
    ];
    expect(families.map(({ family }) => family).sort()).toEqual([
      "beetle",
      "boss-catbug",
      "boss-colossus",
      "boss-evil-catbug",
      "boss-goose-hydra",
      "boss-hydra",
      "brute",
      "drake",
      "mantis",
      "sentinel",
      "wisp",
    ]);
    expect(families.map(({ label }) => label).sort()).toEqual([
      "Ash Beetle",
      "Ash Wisp",
      "Cinder Goose Hydra",
      "Ice Evil Catbug",
      "Ice Hydra",
      "Ice Mantis",
      "Magma Brute",
      "Tide Sentinel",
      "Toxic Catbug",
      "Verdant Colossus",
      "Volt Drake",
    ]);
    expect(
      selectEnemyFamilyIdentity({ goldenBug: true, grade: "elite", level: 51, modifier: null }),
    ).toMatchObject({ family: "beetle", label: "Golden Bug", variant: 0 });
  });
  it("preserves legacy boss order while threading custom cadence and normalizing zero", () => {
    expect(
      [35, 70, 105, 140, 175].map(
        (level) => selectEnemyFamilyIdentity({ grade: "boss", level, modifier: null }).family,
      ),
    ).toEqual([
      "boss-evil-catbug",
      "boss-catbug",
      "boss-hydra",
      "boss-colossus",
      "boss-goose-hydra",
    ]);
    expect(selectEnemyFamilyIdentity({ grade: "boss", level: 0, modifier: null }).family).toBe(
      "boss-evil-catbug",
    );
    expect(
      Array.from(
        { length: 10 },
        (_, index) =>
          selectEnemyFamilyIdentity({
            bossInterval: 10,
            grade: "boss",
            level: (index + 1) * 10,
            modifier: null,
          }).family,
      ),
    ).toEqual([
      "boss-evil-catbug",
      "boss-catbug",
      "boss-hydra",
      "boss-colossus",
      "boss-goose-hydra",
      "boss-evil-catbug",
      "boss-catbug",
      "boss-hydra",
      "boss-colossus",
      "boss-goose-hydra",
    ]);
  });
});
