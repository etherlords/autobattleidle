import { BATTLEFIELD_CONFIG } from "../../battlefield/config";
import { UnitModel } from "../core";

export type PlayerUnitSnapshot = {
  readonly level: number;
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
};

const [x, y, z] = BATTLEFIELD_CONFIG.player.position;

export const createPlayerUnitSnapshot = (level = 1): PlayerUnitSnapshot => ({
  level,
  position: { x, y, z },
});

export class PlayerUnitModel extends UnitModel<PlayerUnitSnapshot> {
  constructor(snapshot: PlayerUnitSnapshot = createPlayerUnitSnapshot()) {
    super(snapshot);
  }

  protected sameIdentity(): boolean {
    return true;
  }
}
