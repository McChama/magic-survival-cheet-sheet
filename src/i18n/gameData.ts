import { ARTIFACTS } from "../data/artifacts";
import { CLASSES, SUBJECTS, SUBJECT_DETAILS } from "../data/classes";
import { BASE_MAGICS } from "../data/magics";
import { PASSIVES } from "../data/passives";
import { RESEARCH } from "../data/research";
import { STAT_DEFINITIONS } from "../data/statDefinitions";
import type { StatKey } from "../types/game";

/** Matches the slugging scripts/organize-assets.mjs uses for class/subject sprite filenames. */
export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

type GameDataResource = Record<string, Record<string, Record<string, string>>>;

function set(resource: GameDataResource, section: string, id: string, field: string, value: string | undefined) {
  if (!value) return;
  resource[section] ??= {};
  resource[section][id] ??= {};
  resource[section][id][field] = value;
}

/**
 * Builds the "gameData" i18next resource for English directly from src/data/*.ts —
 * this is generated at runtime, never hand-edited, so the English translation can
 * never drift from the source-of-truth data files (see CLAUDE.md's language rule).
 * A second language would ship as a hand-translated static JSON file registered
 * alongside this one (same nested shape: section.id.field), which i18next falls
 * back away from to this resource for any field it doesn't cover.
 */
export function buildEnglishGameDataResource(): GameDataResource {
  const resource: GameDataResource = {};

  for (const name of CLASSES) set(resource, "class", slug(name), "name", name);

  for (const name of SUBJECTS) {
    const id = slug(name);
    set(resource, "subject", id, "name", name);
    const detail = SUBJECT_DETAILS[name];
    set(resource, "subject", id, "description", detail?.description);
    set(resource, "subject", id, "trait", detail?.trait);
  }

  for (const item of [...ARTIFACTS, ...PASSIVES]) {
    set(resource, "item", item.id, "name", item.name);
    set(resource, "item", item.id, "specialEffect", item.specialEffect);
  }

  for (const magic of BASE_MAGICS) set(resource, "magic", magic.id, "name", magic.name);

  for (const node of RESEARCH) set(resource, "research", node.id, "name", node.name);

  for (const key of Object.keys(STAT_DEFINITIONS) as StatKey[]) {
    set(resource, "stat", key, "label", STAT_DEFINITIONS[key].label);
  }

  return resource;
}
