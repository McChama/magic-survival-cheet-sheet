import { useTranslation } from "react-i18next";

/**
 * Reads game-content text (class/subject/item/magic/research/stat names & descriptions)
 * from the "gameData" i18next namespace instead of straight off the src/data/*.ts objects,
 * so a future locale only has to add a gameData resource bundle — no component changes.
 * `fallback` is the source-of-truth string from the data file, used if a key is missing
 * from every loaded locale (should only happen for an in-progress translation).
 */
export function useGameDataText() {
  const { t } = useTranslation("gameData");
  return (key: string, fallback: string) => t(key, { defaultValue: fallback });
}
