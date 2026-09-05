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
      selectEnemyFamilyIdentity({ grade: "boss", level: 1, modifier: null }),
      selectEnemyFamilyIdentity({ grade: "boss", level: 2, modifier: null }),
      selectEnemyFamilyIdentity({ grade: "boss", level: 3, modifier: null }),
      selectEnemyFamilyIdentity({ grade: "boss", level: 4, modifier: null }),
    ];
    expect(families.map(({ family }) => family).sort()).toEqual([
      "beetle",
      "boss-catbug",
      "boss-colossus",
      "boss-evil-catbug",
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
      "Cinder Catbug",
      "Cinder Colossus",
      "Ice Mantis",
      "Magma Brute",
      "Tide Sentinel",
      "Volt Drake",
      "Volt Evil Catbug",
      "Volt Hydra",
    ]);
    expect(
      selectEnemyFamilyIdentity({ goldenBug: true, grade: "elite", level: 51, modifier: null }),
    ).toMatchObject({ family: "beetle", label: "Golden Bug", variant: 0 });
  });
});
