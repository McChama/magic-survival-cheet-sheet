// Rebuilds src/capture/templates.generated.json: every sprite the screen reading can recognize, already
// reduced to its template, so the app never has to decode ~300 images on the phone to start reading.
// Run it when a sprite, or the list of magics/passives/classes/artifacts, changes — `npm run check:capture`
// fails if this file is stale.
//
//   npm run capture:templates

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLibrary, encodeLibrary } from "../src/capture/library.ts";
import { loadSprite } from "./capture-node.mjs";

const encoded = encodeLibrary(await buildLibrary(loadSprite));
const out = resolve(dirname(fileURLToPath(import.meta.url)), "../src/capture/templates.generated.json");
writeFileSync(out, JSON.stringify(encoded) + "\n");
console.log(`Wrote ${encoded.icons.length} icon and ${encoded.artifacts.length} artifact templates.`);
