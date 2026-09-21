import { synergyImage } from "../config/assets";
import { getEquippedItems, ITEM_BY_ID } from "../engine/tierAdaptive";
import type { CurrentRunState, SynergyDefinition } from "../types/game";

/**
 * Real in-game "Synergy" data — own all of a Synergy's `requiredItemIds` (artifacts/
 * passives) at once to unlock its named bonus. Extracted from `eng_Dictionary_Synergy.txt`
 * (English, this project's source-priority #1 — see reference/game-data-sources.md), the
 * same dictionary family as `eng_Dictionary_Class.txt`/`eng_Dictionary_Ability.txt`. A
 * genuine mechanic never modeled in this app before this pass — distinct from
 * `data/fusions.ts` (base magic + base magic).
 *
 * Extraction methodology (one-off script, `scripts/scratch/extract-synergies.mjs`, not
 * committed): the dictionary is a CSV-ish table, id 0 is an unused template row, ids 1-46
 * and 70-86 are populated (63 total — confirmed by direct count), ids 47-69 are an
 * intentional content gap (empty `` ` `` sentinel rows, not a bug or extraction failure).
 * Each row's `ID_01..0N` columns are artifact/passive **source ids** (`// source id N`
 * comments in `artifacts.ts`/`passives.ts` — the same shared "Ability" id space documented
 * in reference/game-data-sources.md), resolved to this app's internal string ids at
 * extraction time — all 63 rows' ids resolved cleanly, 0 unresolved. Description text
 * keeps the game's own bracket markup verbatim (`GameText` already renders `〔〕[]〈〉『』
 * {}【】《》`) with one addition: the source text's `##N##` tokens (a reference to another
 * ability's name by source id, e.g. `『##74##』`) were resolved to that item's real display
 * name *at extraction time* — e.g. `『##74##』` → `『Magic Sword』` — so no runtime
 * resolution or `GameText` changes were needed.
 *
 * Proof of correctness beyond the 0-unresolved count: every synergy's required items are
 * thematically coherent as a set, e.g. id 3 "Red Dragon" = Dragon's Magic + Dragon's Heart
 * + Dragontongue + Dragonscale; id 70 "Mastery : Magic Bolt" = 4 Magic-Bolt-themed
 * artifacts (The Freeshooter, Ether Arrow, Magic Bullet, Shuriken) granting "Increase Magic
 * Bolt Damage by 50%" — not something a random/wrong id mapping would produce by chance.
 *
 * Internal numeric effect-id/value columns in the source dictionary (game-engine formula
 * hooks, undocumented) are deliberately NOT modeled here — only the real prose/name/id data
 * is shown, per this project's "never invent meaning for an unconfirmed number" rule.
 */

// prettier-ignore
const RAW: { id: number; name: string; requiredItemIds: (string | null)[]; descriptionLines: { color: string; text: string }[] }[] = [
{"id":1,"name":"Ego Sword","requiredItemIds":["magicsword","imp","watchereye","manaore"],"descriptionLines":[{"color":"#F5F5E1","text":"The [Execute] threshold of 『Magic Sword』 increases to 〈25%〉."}]},
{"id":2,"name":"Nightmare","requiredItemIds":["ironmaiden","condesa","carnaval","guillotina"],"descriptionLines":[{"color":"#F5F5E1","text":"The size of [Explosions] from defeated enemies increases, and occasionally the power is greatly {Enhanced}."}]},
{"id":3,"name":"Red Dragon","requiredItemIds":["dragonmagic","dragonheart","dragontongue","dragonscale"],"descriptionLines":[{"color":"#FF76DE","text":"Amplify ATK by 40%"},{"color":"#64FF32","text":"Increase ATK by 40%"},{"color":"#6EDCFF","text":"Increase All Magic Damage by 40%"}]},
{"id":4,"name":"Venom","requiredItemIds":["genomemap","basilisk","virus","sample"],"descriptionLines":[{"color":"#EB96FF","text":"Max HP Reduction Rate of all enemies 〈x1.15〉"}]},
{"id":5,"name":"Avalon","requiredItemIds":["excalibur","merlincape","worldtreeleaf","holygrail"],"descriptionLines":[{"color":"#F5F5E1","text":"The effect of 『Excalibur』 increases by 〈1.5X〉, and [Aura Range] increases."},{"color":"#64FF32","text":"Increase HP Regen per sec. by 0.1%"}]},
{"id":6,"name":"Oracle","requiredItemIds":["akashicrecord","cube","pyramid","buho"],"descriptionLines":[{"color":"#F5F5E1","text":"Effects of [Normal Passive Magic] increase by 〈25%〉"}]},
{"id":7,"name":"Archangel","requiredItemIds":["sacrosanct","halo","stainedglass","crucifix"],"descriptionLines":[{"color":"#F5F5E1","text":"[Revive] 〈1〉 more time."},{"color":"#64FF32","text":"Increase Max HP by 100%"}]},
{"id":8,"name":"The Fifth Element","requiredItemIds":["creation","ether","ancienttreestaff","magicscroll"],"descriptionLines":[{"color":"#F5F5E1","text":"Deal 〈50%〉 [Bonus Damage] every [5th] cast of each spell"},{"color":"#6EDCFF","text":"Increase All Magic Damage by 50%"}]},
{"id":9,"name":"Necromancer","requiredItemIds":["reaperscythe","nomuerto","wraith","lantern"],"descriptionLines":[{"color":"#F5F5E1","text":"Enemies killed by the effect of 『Reaper's Scythe』 {Explode}"},{"color":"#EB96FF","text":"(Explosion Damage is 75% of the enemy's Max HP)"}]},
{"id":10,"name":"Deadeye","requiredItemIds":["desperado","brand","crow","target"],"descriptionLines":[{"color":"#F5F5E1","text":"Each time an enemy is defeated, the remaining Cooldown of 『Desperado』 is reduced by 〈0.2%〉."}]},
{"id":11,"name":"Trickster","requiredItemIds":["joker","tarotcard","fourleafclover","rainbow"],"descriptionLines":[{"color":"#F5F5E1","text":"[Criticals] from 『Four-Leaf Clover』 activate the effect of 『Joker』"},{"color":"#64FF32","text":"Increase Critical Strike Rate by 7%"}]},
{"id":12,"name":"Sniper","requiredItemIds":["ballista","guillotina","aumento","radar"],"descriptionLines":[{"color":"#F5F5E1","text":"Deal 〈25%〉 [additional Damage] to enemies whose [HP] is 〈75%〉 or above."}]},
{"id":13,"name":"Nuclear","requiredItemIds":["uranium","amplifier","bomb","gunpowder"],"descriptionLines":[{"color":"#F5F5E1","text":"Increase [ATK] by 〈1%〉 per 〈3%〉 spell size increase rate"},{"color":"#64FF32","text":"Increase All Magic Size by 20%"}]},
{"id":14,"name":"Zero-to-Hundred","requiredItemIds":["accelerator","jetengine","breeze","broom"],"descriptionLines":[{"color":"#F5F5E1","text":"The {Amplify} effect of 『Jet Engine』 increases by 〈x3〉"}]},
{"id":15,"name":"Arbiter","requiredItemIds":["supermente","fairy","starlight","llamademana"],"descriptionLines":[{"color":"#EB96FF","text":"Total Magic Damage Multiplier 〈x1.25〉"}]},
{"id":16,"name":"Chronos","requiredItemIds":["ouroboros","wizardhat","blackcat","hourglass"],"descriptionLines":[{"color":"#F5F5E1","text":"{Amplify} [ATK] by 〈1%〉 per [3%] cooldown reduction rate of all spells"},{"color":"#64FF32","text":"Decrease All Magic Cooldown by 5%"}]},
{"id":17,"name":"Monarch","requiredItemIds":["crown","diamante","sapphire","ruby"],"descriptionLines":[{"color":"#F5F5E1","text":"Increase [ATK] by 〈1%〉 per owned [Common] Artifact"},{"color":"#F5F5E1","text":"Increase [ATK] by 〈3%〉 per owned [Rare] Artifact"}]},
{"id":18,"name":"Architect","requiredItemIds":["gaia","titanpower","geometry","sellomagico","golemcore"],"descriptionLines":[{"color":"#FF76DE","text":"Amplify ATK by 100%"}]},
{"id":19,"name":"Magnum Opus","requiredItemIds":["philosopherstone","ether","abyss","singularity","pyramid"],"descriptionLines":[{"color":"#F5F5E1","text":"{All} [Synergy] 〈Requirements〉 are 《1》 『Met.』"}]},
{"id":20,"name":"Godhand","requiredItemIds":["longinusspear","starlight","holygrail","crucifix"],"descriptionLines":[{"color":"#F5F5E1","text":"Lightning from 『Longinus' Spear』 converges and becomes {Enhanced}"}]},
{"id":21,"name":"Paladin","requiredItemIds":["sellomagico","aegis","manashield","forcefield"],"descriptionLines":[{"color":"#F5F5E1","text":"Amplify ATK by 〈100%〉 while in [Invincible State]"},{"color":"#64FF32","text":"Decrease Damage Taken by 5%"}]},
{"id":22,"name":"AGI","requiredItemIds":["matriz","singularity","asi","oculus"],"descriptionLines":[{"color":"#F5F5E1","text":"[ATK] is 〈Increased〉 & {Amplified} by the effect of 『Matrix』."}]},
{"id":23,"name":"Treasure Hunter","requiredItemIds":["treasuremap","keyring","mimic","spellbag"],"descriptionLines":[{"color":"#F5F5E1","text":"〈2〉 [Treasure Chests] are created at a random location."}]},
{"id":24,"name":"Blood Moon","requiredItemIds":["eclipse","werewolf","hunter","watchereye"],"descriptionLines":[{"color":"#F5F5E1","text":"The effect of {Rune of Frenzy} is applied even while inactive @ While active, deal 〈25%〉 [Additional Damage]."}]},
{"id":25,"name":"Heartbreaker","requiredItemIds":["creadoradeviudas","assassination","carnaval","maskedball","shadowcape"],"descriptionLines":[{"color":"#EB96FF","text":"Critical Multiplier x1.25"}]},
{"id":26,"name":"Wonderland","requiredItemIds":["toycastle","fairy","unicornio","storybook"],"descriptionLines":[{"color":"#F5F5E1","text":"Reduce [Size] of all enemies and the character by 〈9%〉"},{"color":"#F5F5E1","text":"Decrease the [Max HP] of all enemies by 〈9%〉."}]},
{"id":27,"name":"Cosmic Horror","requiredItemIds":["necronomicon","abyss","clairvoyance"],"descriptionLines":[{"color":"#F5F5E1","text":"Remove 【Debuff】 of 『Necronomicon』"},{"color":"#F5F5E1","text":"Remove 【Debuff】 of 『Abyss』"}]},
{"id":28,"name":"Android","requiredItemIds":["plasma","cyborg","cogwheel"],"descriptionLines":[{"color":"#F5F5E1","text":"Remove 【Debuff】 of 『Plasma』"},{"color":"#F5F5E1","text":"Remove 【Debuff】 of 『Cyborg』"}]},
{"id":29,"name":"Gravity","requiredItemIds":["amplifier","gravityorb","spiderweb"],"descriptionLines":[{"color":"#F5F5E1","text":"The wave of 『Gravity Orb』 greatly expands"},{"color":"#F5F5E1","text":"Decrease the [Movement Speed] of all enemies by 〈5%〉."}]},
{"id":30,"name":"Genius","requiredItemIds":["geometry","buho","mortarboard","magicgrimoire"],"descriptionLines":[{"color":"#F5F5E1","text":"Increase cap for [Bonus Levels] applied after Max Level by 〈10〉"},{"color":"#64FF32","text":"Increase Mana Acquisition by 25%"}]},
{"id":31,"name":"Conflux","requiredItemIds":["nexus","aimagic","asi","manacircuit"],"descriptionLines":[{"color":"#F5F5E1","text":"The effect of 『Nexus』 increases by 〈1.5X〉."}]},
{"id":32,"name":"Butcher","requiredItemIds":["executionerax","hunter","carne","crow"],"descriptionLines":[{"color":"#F5F5E1","text":"Deal 〈15%〉 [Additional Damage] to {Boss Wave Monsters}."}]},
{"id":33,"name":"Gilgamesh","requiredItemIds":["opulence","holychest","crown","goldenroulette","moneda"],"descriptionLines":[{"color":"#F5F5E1","text":"When [2500] enemies are defeated, the {Rune of Greed} effect is activated."}]},
{"id":34,"name":"Homunculus","requiredItemIds":["dna","philosopherstone","secondheart","organicshield"],"descriptionLines":[{"color":"#F5F5E1","text":"{Revive} with a 〈30%〉 chance upon death."}]},
{"id":35,"name":"Broker","requiredItemIds":["ramodeflores","philosopherstone","blackcat","aumento"],"descriptionLines":[{"color":"#F5F5E1","text":"[Merchants'] {25% Discount Items} become 〈Free〉."}]},
{"id":36,"name":"Requiem","requiredItemIds":["deathbell","alineacion","wraith","exorcism"],"descriptionLines":[{"color":"#F5F5E1","text":"Enemies {Executed} by the effect of 『Roster』 fill the stacks of 『Death's Bell』."}]},
{"id":37,"name":"Fanatic","requiredItemIds":["ocultismo","necronomicon","brand"],"descriptionLines":[{"color":"#F5F5E1","text":"The effect of 『Brand』 increases by 〈2X〉, and its activation time becomes 〈2X〉 faster."}]},
{"id":38,"name":"Medusa","requiredItemIds":["hydra","ocultismo","aegis","mutagen"],"descriptionLines":[{"color":"#F5F5E1","text":"Deal [Additional Damage] equal to the number of stacks of 『Hydra』 applied to the target."}]},
{"id":39,"name":"Dominus","requiredItemIds":["domainofpower","dragontongue","manaore","spellcape"],"descriptionLines":[{"color":"#F5F5E1","text":"Increase Combination Magic Damage by 〈25%〉 per activated [Combination Magic]."}]},
{"id":40,"name":"Elixir","requiredItemIds":["worldtreeleaf","mandrake","hppotion"],"descriptionLines":[{"color":"#F5F5E1","text":"『HP Potion』 heals instantly and reduces [Cooldown] by 〈20s〉"},{"color":"#64FF32","text":"Increase Life Orb HP Recovery by 50%"}]},
{"id":41,"name":"Healing Factor","requiredItemIds":["secondheart","organicshield","bloodpack"],"descriptionLines":[{"color":"#F5F5E1","text":"[Bonus HP] from 『Organic Shield』 increases with [HP Regen per Second]"},{"color":"#64FF32","text":"Increase HP Regen per sec. by 0.5%"}]},
{"id":42,"name":"Steampunk","requiredItemIds":["clockwork","pocketwatch","cogwheel"],"descriptionLines":[{"color":"#F5F5E1","text":"Decrease [All Artifact Cooldown] by 〈12%〉."},{"color":"#64FF32","text":"Increase All Magic Duration by 12%"}]},
{"id":43,"name":"Nymph","requiredItemIds":["cauldron","lightning","weathercontroller","manascepter"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase All Magic Damage by 100%"}]},
{"id":44,"name":"Chaos","requiredItemIds":["pandorabox","imp","harmony","harp"],"descriptionLines":[{"color":"#F5F5E1","text":"Magic triggered by 『Pandora's Box』 deals 〈x2〉 damage"}]},
{"id":45,"name":"Genie","requiredItemIds":["fuentemagica","mercurio","aurora","sapphire"],"descriptionLines":[{"color":"#F5F5E1","text":"Occasionally drop [Large Mana Orb] when defeating normal enemies"},{"color":"#64FF32","text":"Increase Mana Acquisition by 10%"}]},
{"id":46,"name":"War Machine","requiredItemIds":["warflag","siegehammer","golemcore","cogwheel"],"descriptionLines":[{"color":"#F5F5E1","text":"Stacks of 『War Flag』 instantly max out"},{"color":"#64FF32","text":"Increase ATK by 20%"}]},
{"id":70,"name":"Mastery : Magic Bolt","requiredItemIds":["elfrancotiradorlibre","etherarrow","magicbullet","shuriken"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Magic Bolt Damage by 50%"}]},
{"id":71,"name":"Mastery : Fireball","requiredItemIds":["phoenixbow","candlestick","torch"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Fireball Damage by 50%"}]},
{"id":72,"name":"Mastery : Spirit","requiredItemIds":["magicwand","etherarrow","shuriken","firefly"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Spirit Damage by 50%"}]},
{"id":73,"name":"Mastery : Satellite","requiredItemIds":["circularsawblade","energianuclear","electromagneto","glassorb"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Satellite Damage by 50%"}]},
{"id":74,"name":"Mastery : Frost Nova","requiredItemIds":["mooncrystal","skadi","snowman"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Frost Nova Damage by 50%"}]},
{"id":75,"name":"Mastery : Thunderstorm","requiredItemIds":["mjolnir","lightning","lightningrod"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Thunderstorm Damage by 50%"}]},
{"id":76,"name":"Mastery : Electric Zone","requiredItemIds":["robot","electromagneto","battery"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Electric Zone Damage by 50%"}]},
{"id":77,"name":"Mastery : Tsunami","requiredItemIds":["wavecalmingflute","quimera","weathercontroller"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Tsunami Damage by 50%"}]},
{"id":78,"name":"Mastery : Meteor","requiredItemIds":["dimensionalgate","candlestick","celestialcalendar"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Meteor Damage by 50%"}]},
{"id":79,"name":"Mastery : Cyclone","requiredItemIds":["palmleaffan","weathercontroller","totem"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Cyclone Damage by 50%"}]},
{"id":80,"name":"Mastery : Electric Shock","requiredItemIds":["electriccable","lightning","lightningrod"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Electric Shock Damage by 50%"}]},
{"id":81,"name":"Mastery : Incineration","requiredItemIds":["dragonbreath","salamandra","torch"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Incineration Damage by 50%"}]},
{"id":82,"name":"Mastery : Energy Bolt","requiredItemIds":["machinearm","mirror","magitechmodule"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Energy Bolt Damage by 50%"}]},
{"id":83,"name":"Mastery : Blizzard","requiredItemIds":["snowflakecrown","skadi","snowman"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Blizzard Damage by 50%"}]},
{"id":84,"name":"Mastery : Arcane Ray","requiredItemIds":["otherworldlytentacle","mirror","crystalprism"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Arcane Ray Damage by 50%"}]},
{"id":85,"name":"Mastery : Lava Zone","requiredItemIds":["sulfur","quimera","salamandra"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Lava Zone Damage by 50%"}]},
{"id":86,"name":"Mastery : Flash Shock","requiredItemIds":["gaebolg","quimera","lightning"],"descriptionLines":[{"color":"#6EDCFF","text":"Increase Flash Shock Damage by 50%"}]}
];

export const SYNERGIES: SynergyDefinition[] = RAW.map((r) => ({
  id: r.id,
  name: r.name,
  image: synergyImage(`${r.id}.png`),
  requiredItemIds: r.requiredItemIds.filter((v): v is string => v !== null),
  descriptionLines: r.descriptionLines,
}));

export const SYNERGY_BY_ID: Record<number, SynergyDefinition> = Object.fromEntries(
  SYNERGIES.map((s) => [s.id, s])
);

/** How many of a Synergy's required items are currently equipped — no new run state, fully derived from `run.equipped`. */
export function getOwnedCount(synergy: SynergyDefinition, run: CurrentRunState): number {
  const equippedIds = new Set(getEquippedItems(run).map((i) => i.id));
  return synergy.requiredItemIds.filter((id) => equippedIds.has(id)).length;
}

/** For each required item, in order, whether the run owns it — what lights the matching segment of the Synergy's ring. */
export function getOwnedFlags(synergy: SynergyDefinition, run: CurrentRunState): boolean[] {
  const equippedIds = new Set(getEquippedItems(run).map((i) => i.id));
  return synergy.requiredItemIds.map((id) => equippedIds.has(id));
}

export function isSynergyComplete(synergy: SynergyDefinition, run: CurrentRunState): boolean {
  return getOwnedCount(synergy, run) === synergy.requiredItemIds.length;
}

/** Every SYNERGIES.requiredItemIds entry should resolve in ITEM_BY_ID — dev-time sanity check. */
export const UNRESOLVED_SYNERGY_ITEM_IDS = SYNERGIES.flatMap((s) =>
  s.requiredItemIds.filter((id) => !ITEM_BY_ID[id]).map((id) => ({ synergyId: s.id, itemId: id }))
);
