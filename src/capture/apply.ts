import i18n from "../i18n";
import { ENCHANT } from "../data/enchant";
import { BASE_MAGIC_BY_ID } from "../data/magics";
import { isLeveledPassive } from "../data/passiveLevels";
import { getMagicLevelPick, getPassiveLevelPick } from "../engine/magicLeveling";
import { getObtainedPassiveIds } from "../engine/ownedPassives";
import { getEquippedItems, ITEM_BY_ID } from "../engine/tierAdaptive";
import { useRunStore } from "../store/useRunStore";
import { endActiveRun, ensureActiveRunLoaded, prepareNextRun, startNewRun } from "../store/useRunsStore";
import type { CaptureEvent, OwnedRef } from "./session";

/**
 * Applies what the screen reading saw to the run — the same store actions the app's own
 * Select Magic / Select Artifact sheets commit through, so a pick made in the game lands
 * exactly like one tapped in the companion. Reading only ever **adds or raises**: something
 * the game's lists don't show is left alone rather than removed, since a missed icon must
 * not cost the player a recorded talent.
 *
 * Returns the short line to show the player (null when nothing visible changed).
 */

const store = () => useRunStore.getState();

export function refName(ref: OwnedRef): string {
  if (isEnchant(ref)) return ENCHANT.name;
  return ref.kind === "magic" ? (BASE_MAGIC_BY_ID[ref.id]?.name ?? ref.id) : (ITEM_BY_ID[ref.id]?.name ?? ref.id);
}

/** A level-up's Enchant row: read like a passive's (it is an icon in a row), but nothing a pick can simply add. */
export function isEnchant(ref: OwnedRef): boolean {
  return ref.kind === "passive" && ref.id === ENCHANT.id;
}

/**
 * The character's level goes up with a pick, never with the level-up screen itself: "Mana Retrieve" closes that
 * screen without taking anything and leaves the level where it was.
 */
function gainLevel() {
  store().setCurrentLevel(store().run.currentLevel + 1);
}

function ensureMagic(magicId: string) {
  if (!store().run.acquiredMagicIds.includes(magicId)) store().toggleAcquiredMagic(magicId);
}

function ensureArtifact(itemId: string): boolean {
  if (!ITEM_BY_ID[itemId] || getEquippedItems(store().run).some((item) => item.id === itemId)) return false;
  store().equipItem(itemId);
  return true;
}

/** Brings a magic/passive to the level the game shows for it. */
function setOwnedLevel(ref: OwnedRef, level: number, special: boolean) {
  if (ref.kind === "magic") {
    if (!BASE_MAGIC_BY_ID[ref.id]) return;
    ensureMagic(ref.id);
    store().setMagicLevel(ref.id, level);
    return;
  }
  const item = ITEM_BY_ID[ref.id];
  if (!item) return;
  // A special the Class grants (Bishop's Guardian Angel) is already counted through the class.
  if (!getObtainedPassiveIds(store().run).has(item.id)) store().equipItem(item.id);
  if (!special && isLeveledPassive(item)) store().setMagicLevel(item.id, level);
}

export function applyCaptureEvent(event: CaptureEvent): string | null {
  // A new run is a new record (built from the profile); the one before it stays as history.
  if (event.type === "runStarted") {
    startNewRun();
    return i18n.t("capture.runStarted");
  }
  // What the menus before a run show is about the run to come, not the one still on record.
  if (event.type === "classChosen") {
    prepareNextRun({ characterClass: event.className, classLevels: event.level ? { [event.className]: event.level } : {} });
    return event.level ? i18n.t("capture.classChosenAt", { name: event.className, level: event.level }) : i18n.t("capture.classChosen", { name: event.className });
  }
  if (event.type === "subjectChosen") {
    prepareNextRun({ subject: event.subject });
    return i18n.t("capture.subjectChosen", { name: event.subject });
  }
  if (event.type === "subjectsUnlocked") {
    prepareNextRun({ unlockedSubjects: event.subjects });
    return null;
  }
  if (event.type === "researchRead") {
    prepareNextRun({ researchLevels: event.levels });
    return i18n.t("capture.researchRead");
  }
  // Everything else that happens in the game belongs to the run in progress, whichever run the player has open.
  ensureActiveRunLoaded();
  switch (event.type) {
    case "talentLearned":
      gainLevel();
      ensureMagic(event.magicId);
      store().setMagicLevel(event.magicId, event.groupLevel);
      store().setMagicTalent(event.magicId, event.groupLevel, event.talent);
      return i18n.t("capture.talentLearned", { magic: refName({ kind: "magic", id: event.magicId }), talent: event.talent });

    case "artifactObtained":
      return ensureArtifact(event.id) ? i18n.t("capture.artifactObtained", { name: ITEM_BY_ID[event.id].name }) : null;

    case "magicEnchanted":
      // Enchant is what that level-up was spent on, whichever magic it went to.
      gainLevel();
      if (!event.magicId || !BASE_MAGIC_BY_ID[event.magicId]) return i18n.t("capture.enchantedUnknown");
      store().addEnchant(event.magicId);
      return i18n.t("capture.enchanted", { magic: refName({ kind: "magic", id: event.magicId }) });

    case "magicsSynced":
      // The game's own list starts with the Class being played: the one fact about a run that can be read mid-run.
      if (event.className && store().run.meta.characterClass !== event.className) store().setCharacterClass(event.className);
      for (const entry of event.entries) setOwnedLevel(entry, entry.level, entry.special);
      return i18n.t("capture.magicsSynced", { count: event.entries.length });

    case "artifactsSynced":
      event.ids.forEach(ensureArtifact);
      return i18n.t("capture.artifactsSynced", { count: event.ids.length });

    case "pickNeeded":
      // Resolved by the player's answer (`applyPick`), or by the next Owned Magic sync.
      return null;

    case "runEnded":
      endActiveRun();
      return i18n.t("capture.runEnded");

    case "runResumed":
      // `ensureActiveRunLoaded` above already reopened it.
      return null;
  }
}

/** The player said which row of a level-up they took: obtain it, or raise it by one. */
export function applyPick(ref: OwnedRef): string | null {
  ensureActiveRunLoaded();
  // Enchant was marked and confirmed, but its grid was never read: the level went to it all the same.
  if (isEnchant(ref)) {
    gainLevel();
    return i18n.t("capture.enchantedUnknown");
  }
  const { run } = store();
  if (ref.kind === "magic") {
    if (!BASE_MAGIC_BY_ID[ref.id]) return null;
    const pick = getMagicLevelPick(ref.id, run);
    if (pick.atMax) return null;
    gainLevel();
    setOwnedLevel(ref, pick.targetLevel, false);
    return i18n.t("capture.picked", { name: refName(ref), level: pick.targetLevel });
  }
  const item = ITEM_BY_ID[ref.id];
  if (!item) return null;
  const pick = getPassiveLevelPick(item, run);
  if (pick.atMax) return null;
  gainLevel();
  setOwnedLevel(ref, pick.targetLevel, !isLeveledPassive(item));
  return i18n.t("capture.picked", { name: refName(ref), level: pick.targetLevel });
}
