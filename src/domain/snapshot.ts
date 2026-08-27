export type BattleSnapshot = {
  readonly encounter: string;
  readonly player: { readonly name: string; readonly health: number };
  readonly enemy: { readonly name: string; readonly health: number };
};

export const createInitialSnapshot = (): BattleSnapshot => ({
  encounter: "Scout the Emberfields",
  player: { name: "Warden", health: 100 },
  enemy: { name: "Ash Wisp", health: 100 },
});
