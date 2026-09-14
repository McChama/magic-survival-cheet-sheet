import type { StatDefinition, StatKey } from "../types/game";

/**
 * Soft/hard caps are community-consensus diminishing-return thresholds, not values
 * datamined from the game client. Cooldown and Evasion are the two stats players most
 * commonly overinvest in past the point of real benefit, per the community's own
 * reverse-engineered curves — tune these two constants if a game update changes them.
 */
export const STAT_DEFINITIONS: Record<StatKey, StatDefinition> = {
  atk: {
    key: "atk",
    label: "ATK",
    category: "combat",
    unit: "flat",
    hasDiminishingReturns: false,
  },
  amplifyAtk: {
    key: "amplifyAtk",
    label: "Amplify ATK",
    category: "combat",
    unit: "%",
    hasDiminishingReturns: false,
  },
  critRate: {
    key: "critRate",
    label: "Critical Strike Rate",
    category: "combat",
    unit: "%",
    softCap: 100,
    hasDiminishingReturns: true,
  },
  critMultiplier: {
    key: "critMultiplier",
    label: "Crit. Multiplier",
    category: "combat",
    unit: "%",
    hasDiminishingReturns: false,
  },
  magicDamage: {
    key: "magicDamage",
    label: "All Magic Damage",
    category: "combat",
    unit: "%",
    hasDiminishingReturns: false,
  },
  magicSize: {
    key: "magicSize",
    label: "All Magic Size",
    category: "combat",
    unit: "%",
    softCap: 100,
    hasDiminishingReturns: true,
  },
  magicDuration: {
    key: "magicDuration",
    label: "All Magic Duration",
    category: "combat",
    unit: "%",
    hasDiminishingReturns: false,
  },
  cooldown: {
    key: "cooldown",
    label: "All Magic Cooldown",
    category: "combat",
    unit: "%",
    softCap: 50,
    hardCap: 60,
    hasDiminishingReturns: true,
  },
  hp: {
    key: "hp",
    label: "HP",
    category: "survival",
    unit: "%",
    hasDiminishingReturns: false,
  },
  hpRegen: {
    key: "hpRegen",
    label: "HP Regen per sec.",
    category: "survival",
    unit: "flat",
    hasDiminishingReturns: false,
  },
  lifeOrbRecovery: {
    key: "lifeOrbRecovery",
    label: "Life Orb HP Recovery",
    category: "survival",
    unit: "%",
    hasDiminishingReturns: false,
  },
  damageTaken: {
    key: "damageTaken",
    label: "Damage Taken",
    category: "survival",
    unit: "%",
    softCap: 70,
    hasDiminishingReturns: true,
  },
  evasion: {
    key: "evasion",
    label: "Evasion",
    category: "survival",
    unit: "%",
    softCap: 40,
    hardCap: 60,
    hasDiminishingReturns: true,
  },
  moveSpeed: {
    key: "moveSpeed",
    label: "Movement Speed",
    category: "survival",
    unit: "%",
    hasDiminishingReturns: false,
  },
  manaAcquisition: {
    key: "manaAcquisition",
    label: "Mana Acquisition",
    category: "survival",
    unit: "%",
    hasDiminishingReturns: false,
  },
  itemPickupRange: {
    key: "itemPickupRange",
    label: "Item Pickup Range",
    category: "survival",
    unit: "%",
    hasDiminishingReturns: false,
  },
  enemyMaxHp: {
    key: "enemyMaxHp",
    label: "Enemy Max HP",
    category: "combat",
    unit: "%",
    hasDiminishingReturns: false,
  },
};


export function emptyStatBlock(): Record<StatKey, number> {
  const block = {} as Record<StatKey, number>;
  for (const key of Object.keys(STAT_DEFINITIONS) as StatKey[]) {
    block[key] = 0;
  }
  return block;
}
