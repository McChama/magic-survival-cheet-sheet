// One-off script: map the raw APK sprite dump (public/assets/Sprites/AbilityNPortrait.png,
// MagicComNPortrait.png) onto the id-based folder structure src/config/assets.ts expects
// (artifactImages/{id}.png, passiveImages/{id}.png, magicImages/{appId}.png), using the
// `// source id N` comments already present in artifacts.ts/passives.ts and the ordered
// position in fusions.ts's RAW array (both confirmed 1:1 against the sprite dump by hand
// before running this at scale — see reference/game-data-sources.md).
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
// Raw dump lives outside public/ — everything under public/ ships as-is in the built
// site, and the dump is ~300MB of mostly-unused animation frames/effects/UI chrome.
const SPRITES_DIR = path.join(ROOT, "raw-assets/Sprites");

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

function copyIfExists(srcName, destDir, destName) {
  const src = path.join(SPRITES_DIR, srcName);
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, path.join(destDir, destName));
  return true;
}

// ---- Artifacts + Passives: id -> source id, from the trailing comment ----
function extractIdSourcePairs(fileText) {
  const pairs = [];
  for (const line of fileText.split("\n")) {
    const idMatch = line.match(/id:\s*"([^"]+)"/);
    const sourceMatch = line.match(/\/\/\s*source id (\d+)/);
    if (idMatch && sourceMatch) pairs.push({ id: idMatch[1], sourceId: sourceMatch[1] });
  }
  return pairs;
}

const artifactsText = readFile("src/data/artifacts.ts");
const passivesText = readFile("src/data/passives.ts");
const artifactPairs = extractIdSourcePairs(artifactsText);
const passivePairs = extractIdSourcePairs(passivesText);

console.log(`Artifacts: ${artifactPairs.length} entries with a source id comment`);
console.log(`Passives: ${passivePairs.length} entries with a source id comment`);

const artifactDir = path.join(ROOT, "public/assets/artifactImages");
const passiveDir = path.join(ROOT, "public/assets/passiveImages");
fs.rmSync(artifactDir, { recursive: true, force: true });
fs.rmSync(passiveDir, { recursive: true, force: true });

const missingArtifacts = [];
for (const { id, sourceId } of artifactPairs) {
  const ok = copyIfExists(`Ability${sourceId}Portrait.png`, artifactDir, `${id}.png`);
  if (!ok) missingArtifacts.push({ id, sourceId });
}

const missingPassives = [];
for (const { id, sourceId } of passivePairs) {
  const ok = copyIfExists(`Ability${sourceId}Portrait.png`, passiveDir, `${id}.png`);
  if (!ok) missingPassives.push({ id, sourceId });
}

console.log(`Artifacts copied: ${artifactPairs.length - missingArtifacts.length}/${artifactPairs.length}`);
console.log(`Passives copied: ${passivePairs.length - missingPassives.length}/${passivePairs.length}`);
if (missingArtifacts.length) console.log("Missing artifact sprites:", missingArtifacts);
if (missingPassives.length) console.log("Missing passive sprites:", missingPassives);

// ---- Fusions: appId -> RAW array position (1-indexed) ----
const fusionsText = readFile("src/data/fusions.ts");
const rawMatch = fusionsText.match(/const RAW: RawFusion\[\] = \[(.*)\];/s);
const appIdRe = /"appId":"([^"]+)"/g;
const fusionAppIds = [];
let fm;
while ((fm = appIdRe.exec(rawMatch[1]))) fusionAppIds.push(fm[1]);

console.log(`Fusions: ${fusionAppIds.length} entries found in RAW array`);

const magicDir = path.join(ROOT, "public/assets/magicImages");
fs.rmSync(magicDir, { recursive: true, force: true });

const missingFusions = [];
fusionAppIds.forEach((appId, index) => {
  const position = index + 1;
  const ok = copyIfExists(`MagicCom${position}Portrait.png`, magicDir, `${appId}.png`);
  if (!ok) missingFusions.push({ appId, position });
});

console.log(`Fusion sprites copied: ${fusionAppIds.length - missingFusions.length}/${fusionAppIds.length}`);
if (missingFusions.length) console.log("Missing fusion sprites:", missingFusions);

// ---- Bonus: Ultimate portraits, same position convention, only for fusions that have one ----
const ultimateDir = path.join(ROOT, "public/assets/magicUltimateImages");
fs.rmSync(ultimateDir, { recursive: true, force: true });
let ultimateCount = 0;
fusionAppIds.forEach((appId, index) => {
  const position = index + 1;
  const ok = copyIfExists(`Ultimate${position}Portrait.png`, ultimateDir, `${appId}.png`);
  if (ok) ultimateCount++;
});
console.log(`Ultimate sprites copied: ${ultimateCount}`);

// ---- Bonus: Class portraits, 1:1 by array position ----
const classesText = readFile("src/data/classes.ts");
const classesMatch = classesText.match(/export const CLASSES: string\[\] = \[([\s\S]*?)\];/);
const classNames = [...classesMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
console.log(`Classes: ${classNames.length} entries`);

const classDir = path.join(ROOT, "public/assets/classImages");
fs.rmSync(classDir, { recursive: true, force: true });
const missingClasses = [];
classNames.forEach((name, index) => {
  const position = index + 1;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const ok = copyIfExists(`Class${position}Portrait.png`, classDir, `${slug}.png`);
  if (!ok) missingClasses.push({ name, position });
});
console.log(`Class sprites copied: ${classNames.length - missingClasses.length}/${classNames.length}`);
if (missingClasses.length) console.log("Missing class sprites:", missingClasses);

// ---- Bonus: Subject portraits. Not "SubjectNPortrait" (doesn't exist) — these are each
// Subject's in-run character silhouette, first frame of its walk-cycle sprite sheet:
// AUnit{position}Motion1.png, 1:1 by SUBJECTS array position (confirmed visually: AUnit1
// is the flat black Wizard silhouette, AUnit3 has the cyan accent matching Astronomer). ----
const subjectsMatch = classesText.match(/export const SUBJECTS: string\[\] = \[([\s\S]*?)\];/);
const subjectNames = [...subjectsMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
console.log(`Subjects: ${subjectNames.length} entries`);

const subjectDir = path.join(ROOT, "public/assets/subjectImages");
fs.rmSync(subjectDir, { recursive: true, force: true });
const missingSubjects = [];
subjectNames.forEach((name, index) => {
  const position = index + 1;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const ok = copyIfExists(`AUnit${position}Motion1.png`, subjectDir, `${slug}.png`);
  if (!ok) missingSubjects.push({ name, position });
});
console.log(`Subject sprites copied: ${subjectNames.length - missingSubjects.length}/${subjectNames.length}`);
if (missingSubjects.length) console.log("Missing subject sprites:", missingSubjects);

// ---- Bonus: full per-subject idle-sway animation (all AUnit{position}Motion{frame}.png
// frames, not just frame 1) — confirmed by eye that frames 1/10/21 are a robe-swaying idle
// loop, not a walk cycle. ~2MB total across all 25 subjects, worth shipping in full. ----
const subjectAnimDir = path.join(ROOT, "public/assets/subjectAnim");
fs.rmSync(subjectAnimDir, { recursive: true, force: true });
let totalFrames = 0;
subjectNames.forEach((name, index) => {
  const position = index + 1;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const dir = path.join(subjectAnimDir, slug);
  let frame = 1;
  while (copyIfExists(`AUnit${position}Motion${frame}.png`, dir, `${frame}.png`)) {
    frame++;
    totalFrames++;
  }
});
console.log(`Subject animation frames copied: ${totalFrames} across ${subjectNames.length} subjects`);

// ---- Generic UI chrome/decoration assets — no id convention, just a curated list of
// specific filenames the user identified by name in the raw dump (dividers, icons, title
// screen art, unit shadow/background sprites). Re-run this section if more get added;
// there's no way to auto-discover these the way the id-driven sections above can. ----
const uiDir = path.join(ROOT, "public/assets/uiImages");
fs.rmSync(uiDir, { recursive: true, force: true });

const UI_ICONS = [
  "UI_Icon002", "UI_Icon003",
  "UI_Icon007", "UI_Icon007_Gold",
  "UI_Icon008", "UI_Icon008_Gold",
  "UI_Icon009", "UI_Icon009_Gold",
  "UI_Icon010", "UI_Icon010_Gold",
  "UI_Icon011", "UI_Icon011_Gold",
  "UI_Exit", "UI_Exit_Black",
];
for (const name of UI_ICONS) copyIfExists(`${name}.png`, path.join(uiDir, "icons"), `${name}.png`);

copyIfExists("UI_Line01.png", path.join(uiDir, "dividers"), "UI_Line01.png");

const UI_TITLE = ["TitleImgFront1", "TitleImgFront2", "TitleImgFront3", "TitleText"];
for (const name of UI_TITLE) copyIfExists(`${name}.png`, path.join(uiDir, "title"), `${name}.png`);

const UI_UNIT = ["UnitSkinBackGround", "UnitAllyShadow01", "UnitEnemyShadow01"];
for (const name of UI_UNIT) copyIfExists(`${name}.png`, path.join(uiDir, "unit"), `${name}.png`);

// StatusIcon_* renamed to their matching StatKey — confirmed a confident 1:1 map against
// all 17 StatKey entries (e.g. "HitDmg" -> damageTaken, "HpMax" -> hp). If STAT_KEYS in
// types/game.ts ever grows, check whether a new StatusIcon_* file appeared too.
const STATUS_ICON_TO_STAT_KEY = {
  StatusIcon_Attack: "atk",
  StatusIcon_AttackAmp: "amplifyAtk",
  StatusIcon_CriRan: "critRate",
  StatusIcon_CriMul: "critMultiplier",
  StatusIcon_MagicDmg: "magicDamage",
  StatusIcon_MagicArea: "magicSize",
  StatusIcon_MagicDuration: "magicDuration",
  StatusIcon_MagicCooldown: "cooldown",
  StatusIcon_HpMax: "hp",
  StatusIcon_HpRegen: "hpRegen",
  StatusIcon_HpOrbRecovery: "lifeOrbRecovery",
  StatusIcon_HitDmg: "damageTaken",
  StatusIcon_Evasion: "evasion",
  StatusIcon_MoveSpeed: "moveSpeed",
  StatusIcon_ManaObtain: "manaAcquisition",
  StatusIcon_ItemObtainArea: "itemPickupRange",
  StatusIcon_EnemyHP: "enemyMaxHp",
};
let statusIconCount = 0;
for (const [src, statKey] of Object.entries(STATUS_ICON_TO_STAT_KEY)) {
  if (copyIfExists(`${src}.png`, path.join(uiDir, "statusIcons"), `${statKey}.png`)) statusIconCount++;
}
console.log(`UI chrome assets copied: ${UI_ICONS.length} icons, 1 divider, ${UI_TITLE.length} title images, ${UI_UNIT.length} unit sprites, ${statusIconCount}/${Object.keys(STATUS_ICON_TO_STAT_KEY).length} status icons`);

// ---- Button click sound effects. The game plays one of 7 UI sound variants at random on
// button press (see reference/game-data-sources.md — IL2Cpp string literals show a shared
// "SoundData/Sound_UI" + index resource path next to the generic ButtonClickEffect() method
// used across every screen; not implemented/wired to any button yet, just extracted). ----
const AUDIO_SRC_DIR = path.join(ROOT, "raw-assets/Audio");
const uiAudioDir = path.join(ROOT, "public/assets/audio/ui");
fs.rmSync(uiAudioDir, { recursive: true, force: true });
let uiAudioCount = 0;
for (let i = 1; i <= 7; i++) {
  const src = path.join(AUDIO_SRC_DIR, `Sound_UI${i}.wav`);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(uiAudioDir, { recursive: true });
  fs.copyFileSync(src, path.join(uiAudioDir, `Sound_UI${i}.wav`));
  uiAudioCount++;
}
console.log(`UI click sound variants copied: ${uiAudioCount}/7`);
