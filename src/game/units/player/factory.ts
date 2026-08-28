import type { PlayerUnitSnapshot } from "./model";
import { PlayerUnit } from "./player-unit";

export class PlayerUnitFactory {
  create(snapshot?: PlayerUnitSnapshot): PlayerUnit {
    return new PlayerUnit(snapshot);
  }
}
