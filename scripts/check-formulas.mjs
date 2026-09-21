// Regression guard for the stat/magic formulas: every case below is a number a real screen of the game
// showed (see CLAUDE.md's Owned Magic section and reference/game-data-sources.md for how each was found).
// Fails if a change to src/engine or src/data makes the app disagree with the game again.
//
//   npm run check:formulas

import { MAGIC_BASE_STATS, MAGIC_STATS, formatMagicStat } from "../src/data/magicStats.ts";
import { RESEARCH_BY_ID } from "../src/data/research.ts";
import { emptyStatBlock } from "../src/data/statDefinitions.ts";
import { magicDamageMultiplier } from "../src/engine/magicDamage.ts";
import { applyMagicEffects, collectMagicEffects } from "../src/engine/magicEffects.ts";
import { getRunStats } from "../src/engine/runStats.ts";

/** A run with only what a case sets; everything else is the empty default. */
function makeRun(o = {}) {
  return {
    meta: { characterClass: o.cls ?? null, classLevels: o.classLevels ?? {}, subject: o.subject ?? "Wizard", unlockedSubjects: o.unlocked ?? [], researchPoints: 0, startedAt: null },
    fusionTargets: [],
    statAdjustments: emptyStatBlock(),
    equipped: o.equipped ?? [],
    acquiredMagicIds: [],
    magicLevels: {},
    magicTalents: {},
    elapsedMinutes: 0,
    currentLevel: o.level ?? 1,
    enemiesKilled: 0,
    magicCircleActive: o.circle ?? false,
    researchLevels: o.research ?? {},
  };
}

/** The rows the Owned Magic modal shows for a magic at a level, as text. */
function rows(magicId, level, run) {
  const effects = collectMagicEffects(magicId, level, run);
  const stats = getRunStats(run);
  const multiplier = magicDamageMultiplier(magicId, level, run);
  return Object.fromEntries(
    (MAGIC_STATS[magicId] ?? []).map((stat) => [stat, formatMagicStat(applyMagicEffects(MAGIC_BASE_STATS[magicId]?.[stat], stat, effects, stats, magicId), multiplier)]),
  );
}

const RESEARCH_GLOBALS = { arcaneeffuse: 4, fastcasting: 6, concentration: 4 }; // Size +12%, Cooldown -12%, Duration +20%
let failures = 0;
let checks = 0;

function expectEqual(name, actual, expected) {
  checks += 1;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.error(`FAIL ${name}\n  expected ${e}\n  actual   ${a}`);
  }
}

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

// ---- Dashboard ----
const wizard = getRunStats(makeRun({ cls: "Wizard", classLevels: { Wizard: 3 } }));
expectEqual("dashboard baseline", pick(wizard, ["atk", "hp", "lifeOrbRecovery", "critRate", "critMultiplier", "moveSpeed", "amplifyAtk", "manaAcquisition", "itemPickupRange"]), {
  atk: 100, hp: 200, lifeOrbRecovery: 30, critRate: 3, critMultiplier: 200, moveSpeed: 100, amplifyAtk: 0, manaAcquisition: 0, itemPickupRange: 0,
});
expectEqual(
  "dashboard Bishop Lv3, Archaeologist unlocked, Vitality 3 / Mana 1 / Explorer 4",
  pick(getRunStats(makeRun({ cls: "Bishop", classLevels: { Bishop: 3 }, unlocked: ["Archaeologist"], research: { vitality: 3, manarefining: 1, explorer: 4 } })), ["hp", "lifeOrbRecovery", "amplifyAtk", "manaAcquisition", "itemPickupRange"]),
  { hp: 340, lifeOrbRecovery: 61, amplifyAtk: 20, manaAcquisition: 5, itemPickupRange: 55 },
);
expectEqual("Vitality 3", pick(getRunStats(makeRun({ research: { vitality: 3 } })), ["hp", "lifeOrbRecovery"]), { hp: 280, lifeOrbRecovery: 50 });
expectEqual("Vitality 6", pick(getRunStats(makeRun({ research: { vitality: 6 } })), ["hp", "lifeOrbRecovery"]), { hp: 340, lifeOrbRecovery: 69 });
expectEqual("Explorer levels", RESEARCH_BY_ID.explorer.valuesByLevel, [0, 20, 30, 40, 50]);
expectEqual("Mana Refining levels", RESEARCH_BY_ID.manarefining.valuesByLevel, [0, 5, 8, 11, 14, 17, 20]);
expectEqual("global research on the dashboard", pick(getRunStats(makeRun({ research: RESEARCH_GLOBALS })), ["magicSize", "magicDuration", "cooldown"]), { magicSize: 12, magicDuration: 20, cooldown: 12 });

// ---- Magic Bolt ----
const bishop = makeRun({ cls: "Bishop", classLevels: { Bishop: 1 }, subject: "Archaeologist" });
expectEqual("Magic Bolt Lv1, Bishop (Amplify 20%)", rows("magicBolt", 1, bishop).damage, "630");
const wizardRun = (level, research) => makeRun({ cls: "Wizard", classLevels: { Wizard: 3 }, level, research });
expectEqual("Magic Bolt Lv2, Wizard Lv3", rows("magicBolt", 2, wizardRun(1)), { damage: "1,025", explosionRange: "x 1", number: "2", cooldown: "0.6 s" });
expectEqual("Magic Bolt Lv2 + global Size/Cooldown", rows("magicBolt", 2, wizardRun(1, RESEARCH_GLOBALS)), { damage: "1,025", explosionRange: "x 1.1", number: "2", cooldown: "0.53 s" });
expectEqual("Magic Bolt at character level 5", rows("magicBolt", 2, wizardRun(5)).damage, "1,056");
expectEqual("Magic Bolt at character level 6-9", rows("magicBolt", 2, wizardRun(9)).damage, "1,056");
expectEqual("Magic Bolt at character level 11 (float32 factor)", rows("magicBolt", 2, wizardRun(11)).damage, "1,086");

// ---- Other magics ----
const druid = makeRun({ cls: "Druid", classLevels: { Druid: 3 }, research: RESEARCH_GLOBALS });
expectEqual("Cyclone Lv2, Druid Lv3", rows("cyclone", 2, druid), { damage: "500", damageInterval: "0.3 s", size: "x 1.1", duration: "2.4 s", number: "2", cooldown: "2.5 s" });
const astronomer = makeRun({ cls: "Astronomer", classLevels: { Astronomer: 3 }, research: RESEARCH_GLOBALS });
expectEqual("Satellite Lv2, Astronomer Lv3", rows("satellite", 2, astronomer), { damage: "630", rotationSpeed: "x 1.5", size: "x 1.1", number: "2" });
const globals = wizardRun(8, RESEARCH_GLOBALS);
expectEqual("Satellite Lv1", rows("satellite", 1, globals), { damage: "540", rotationSpeed: "x 1", size: "x 1.1", number: "1" });
expectEqual("Satellite Lv3", rows("satellite", 3, globals).damage, "720");
for (const [level, damage, cooldown] of [[1, "780", "0.66 s"], [2, "910", "0.67 s"], [3, "1,040", "0.67 s"], [4, "1,170", "0.68 s"]]) {
  expectEqual(`Spirit Lv${level}`, rows("spirit", level, globals), { damage, size: "x 1.1", number: String(level), cooldown });
}
for (const [level, amplification, duration] of [[1, "25%", "6 s"], [2, "30%", "7 s"], [3, "35%", "8 s"]]) {
  expectEqual(`Magic Circle Lv${level}`, rows("magicCircle", level, globals), { amplificationEffect: amplification, duration, cooldown: "18 s" });
}

// ---- Magic Circle's buff acts as Amplify ATK ----
const circleRun = (level) => ({ ...globals, acquiredMagicIds: ["magicCircle"], magicLevels: { magicCircle: level }, magicCircleActive: true });
expectEqual("Spirit Lv4 with Magic Circle Lv2 active", rows("spirit", 4, circleRun(2)).damage, "1,521");
expectEqual("Spirit Lv4 with Magic Circle Lv3 active", rows("spirit", 4, circleRun(3)).damage, "1,580");

if (failures > 0) {
  console.error(`\n${failures} of ${checks} formula checks failed.`);
  process.exit(1);
}
console.log(`All ${checks} formula checks match the real game screens.`);
