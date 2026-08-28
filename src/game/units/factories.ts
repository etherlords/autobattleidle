import type { UnitKind } from "./core";
import { EnemyUnitFactory } from "./enemy/factory";
import { PlayerUnitFactory } from "./player/factory";

export const UNIT_FACTORIES = {
  enemy: new EnemyUnitFactory(),
  player: new PlayerUnitFactory(),
} satisfies Record<UnitKind, unknown>;
