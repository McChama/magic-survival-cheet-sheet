// Writes the "gameData" i18next resource (normally built in-memory at runtime, see
// src/i18n/gameData.ts) to a real JSON file, purely so IDE tooling that only reads
// files on disk (i18n Ally, etc.) can index/search these keys and jump to them.
//
// This file is NOT imported by the app — src/i18n/index.ts still builds the
// resource at runtime, which stays the single source of truth. Re-run this
// after changing any src/data/*.ts content so the dump doesn't go stale:
//
//   npm run i18n:dump

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEnglishGameDataResource } from "../src/i18n/gameData.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outFile = resolve(__dirname, "../src/i18n/locales/en/gameData.json");

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(buildEnglishGameDataResource(), null, 2) + "\n", "utf8");

console.log(`Wrote ${outFile}`);
