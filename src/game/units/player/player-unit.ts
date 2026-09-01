import { Unit } from "../core";
import { PlayerUnitModel, type PlayerUnitSnapshot } from "./model";
import { PlayerUnitView } from "./view";

export class PlayerUnit extends Unit<PlayerUnitSnapshot> {
  readonly playerView: PlayerUnitView;

  constructor(snapshot?: PlayerUnitSnapshot) {
    const view = new PlayerUnitView();
    super(new PlayerUnitModel(snapshot), view);
    this.playerView = view;
  }
}

export const createPlayerUnit = (snapshot?: PlayerUnitSnapshot): PlayerUnit =>
  new PlayerUnit(snapshot);
