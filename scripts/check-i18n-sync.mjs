// CI guard: fails if `src/i18n/locales/en/gameData.json` is out of sync with
// the game data it's generated from (src/data/*.ts via src/i18n/gameData.ts).
//
// The dump in locales/en/gameData.json is NOT the runtime source of truth
// (src/i18n/index.ts rebuilds it in memory on every boot) — it exists only so
// IDE i18n tooling can index it on disk. But that also makes it the one place
// a reviewer can literally diff to see every new/changed/removed translation
// key a PR introduces. This script re-runs the same builder used at runtime
// and fails the build if someone changed src/data/*.ts without re-running
// `npm run i18n:dump`, so that diff never goes stale.
//
//   node scripts/check-i18n-sync.mjs

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEnglishGameDataResource } from "../src/i18n/gameData.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dumpFile = resolve(__dirname, "../src/i18n/locales/en/gameData.json");

const expected = JSON.stringify(buildEnglishGameDataResource(), null, 2) + "\n";

let actual;
try {
  actual = readFileSync(dumpFile, "utf8");
} catch {
  console.error(`Missing ${dumpFile}. Run: npm run i18n:dump`);
  process.exit(1);
}

if (actual !== expected) {
  console.error(
    "src/i18n/locales/en/gameData.json is out of sync with src/data/*.ts.\n" +
      "This usually means new/changed translation entries were added to the game data\n" +
      "without regenerating the on-disk dump. Run `npm run i18n:dump` and commit the result.",
  );
  process.exit(1);
}

console.log("gameData.json is in sync with src/data/*.ts.");
