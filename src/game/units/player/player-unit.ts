import { Unit } from "../core";
import { PlayerUnitModel, type PlayerUnitSnapshot } from "./model";
import { PlayerUnitView } from "./view";

export class PlayerUnit extends Unit<PlayerUnitSnapshot> {
  constructor(snapshot?: PlayerUnitSnapshot) {
    super(new PlayerUnitModel(snapshot), new PlayerUnitView());
  }
}

export const createPlayerUnit = (snapshot?: PlayerUnitSnapshot): PlayerUnit =>
  new PlayerUnit(snapshot);
