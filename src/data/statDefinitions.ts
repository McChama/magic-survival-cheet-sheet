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

/**
 * How the dashboard prints each stat, matching the game's pause screen: bonus stats read "+N%"
 * (Amplify ATK +20%), rates read "N%" (Critical Strike Rate 3%), and the plain-number stats
 * (ATK, Movement Speed, Life Orb) carry no unit. HP is drawn "N/N" by the row itself. A stat where
 * more is a reduction (`reduction`: All Magic Cooldown, Damage Taken) reads "-N%" once it is above 0
 * (still "+0%" at zero), e.g. Cooldown -12%.
 */
export const STAT_DISPLAY: Record<StatKey, { plus?: boolean; percent?: boolean; reduction?: boolean }> = {
  hp: {},
  atk: {},
  hpRegen: { percent: true },
  amplifyAtk: { plus: true, percent: true },
  lifeOrbRecovery: {},
  magicDamage: { plus: true, percent: true },
  damageTaken: { plus: true, percent: true, reduction: true },
  magicSize: { plus: true, percent: true },
  evasion: { percent: true },
  magicDuration: { plus: true, percent: true },
  moveSpeed: {},
  cooldown: { plus: true, percent: true, reduction: true },
  critRate: { percent: true },
  critMultiplier: { percent: true },
  manaAcquisition: { plus: true, percent: true },
  itemPickupRange: { plus: true, percent: true },
  enemyMaxHp: { plus: true, percent: true },
};
