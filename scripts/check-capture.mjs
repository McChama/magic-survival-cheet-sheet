// Regression guard for the screen reading (src/capture/): replays the real screenshots in
// scripts/capture-fixtures/ and fails if a screen, icon, level or selection is read differently
// from what the screenshot shows. Every case runs at the phone's own resolution and at the
// narrower one the live capture uses.
//
//   npm run check:capture

import { readFileSync } from "node:fs";
import { buildLibrary, decodeLibrary, encodeLibrary } from "../src/capture/library.ts";
import { classifyScreen, readOwnedArtifacts, readOwnedMagic, readSelectAttribute, readSelectMagic, readTreasureChest } from "../src/capture/recognize.ts";
import { intersects, readKeepOut } from "../src/capture/keepOut.ts";
import { CaptureSession, observe } from "../src/capture/session.ts";
import { loadFixture, loadSprite } from "./capture-node.mjs";

const WIDTHS = (process.env.WIDTHS ?? "1080,720").split(",").map(Number);
const VERBOSE = process.argv.includes("--verbose");

const SCREENS = {
  "select-magic": "selectMagic",
  "select-magic-2": "selectMagic",
  "select-magic-4": "selectMagic",
  "select-attribute": "selectAttribute",
  "select-attribute-picked": "selectAttribute",
  "treasure-chest": "treasureChest",
  "treasure-chest-picked": "treasureChest",
  pause: "pause",
  "owned-magic": "ownedMagic",
  "owned-artifact": "ownedArtifact",
  synergy: "synergy",
  "enter-area": "enterArea",
  "life-or-death": "lifeOrDeath",
  // The menus before a run that aren't read yet must at least not be mistaken for anything else.
  research: "unknown",
  "test-subject": "unknown",
  class: "unknown",
  "gameplay-1": "gameplay",
  "gameplay-2": "gameplay",
  "gameplay-3": "gameplay",
  // Another area (water and grass instead of sand), an obelisk standing in it.
  "gameplay-4": "gameplay",
  // The same panel as Treasure Chest, with a "Reroll" button that pushes "Obtain" up.
  obelisk: "treasureChest",
  "obelisk-picked": "treasureChest",
};

let failures = 0;
function expect(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    if (VERBOSE) console.log(`  ok    ${label}: ${a}`);
    return;
  }
  failures++;
  console.error(`  FAIL  ${label}\n        expected ${e}\n        got      ${a}`);
}

const id = (match) => (match ? `${match.kind}:${match.id}` : null);
const detail = (match) => (match ? `${match.kind}:${match.id} ${match.score.toFixed(2)}/+${match.margin.toFixed(2)}` : "null");

// Everything below reads with the templates the app actually ships (generated ahead of time, one byte per value),
// and those must still be what the current sprites produce.
const shipped = readFileSync(new URL("../src/capture/templates.generated.json", import.meta.url), "utf8");
const library = decodeLibrary(JSON.parse(shipped));
console.log(`Library: ${library.icons.length} icon templates, ${library.artifacts.length} artifact templates.`);
if (JSON.stringify(encodeLibrary(await buildLibrary(loadSprite))) + "\n" !== shipped) {
  failures++;
  console.error("  FAIL  src/capture/templates.generated.json is stale. Run: npm run capture:templates");
}

for (const width of WIDTHS) {
  console.log(`\n@ ${width}px`);
  const frame = (name) => loadFixture(name, width === 1080 ? undefined : width);

  for (const [fixture, screen] of Object.entries(SCREENS)) expect(`screen of ${fixture}`, classifyScreen(await frame(fixture)), screen);

  const magic = readOwnedMagic(await frame("owned-magic"), library);
  if (VERBOSE) console.log("  owned magic:", magic.map((m) => `${detail(m.match)} lv${m.level}${m.special ? "*" : ""}`).join(" | "));
  expect(
    "owned magic",
    magic.map((m) => [id(m.match), m.level, m.special]),
    [
      ["class:Bishop", 0, false],
      ["magic:magicBolt", 1, false],
      ["magic:shield", 5, false],
      ["passive:guardianangel", 1, true],
      ["magic:magicCircle", 2, false],
    ]
  );

  const artifacts = readOwnedArtifacts(await frame("owned-artifact"), library);
  if (VERBOSE) console.log("  owned artifacts:", artifacts.map(detail).join(" | "));
  expect("owned artifacts", artifacts.map(id), ["artifact:spacetimecircuit", "artifact:lantern", "artifact:organicshield"]);

  for (const [fixture, selected] of [["treasure-chest", null], ["treasure-chest-picked", 0]]) {
    const chest = readTreasureChest(await frame(fixture), library);
    if (VERBOSE) console.log(`  ${fixture}:`, chest.offers.map(detail).join(" | "), "selected", chest.selected);
    expect(`${fixture} offers`, chest.offers.map(id), ["artifact:organicshield", "artifact:forcefield", "artifact:sapphire"]);
    expect(`${fixture} selected`, chest.selected, selected);
  }

  // An Obelisk: three legendaries, "Obtain" higher up than in a chest. The screenshot itself names the third one.
  for (const [fixture, selected] of [["obelisk", null], ["obelisk-picked", 2]]) {
    const obelisk = readTreasureChest(await frame(fixture), library);
    if (VERBOSE) console.log(`  ${fixture}:`, obelisk.offers.map(detail).join(" | "), "selected", obelisk.selected);
    expect(`${fixture} offers`, obelisk.offers.map(id), ["artifact:genomemap", "artifact:sacrosanct", "artifact:dragonmagic"]);
    expect(`${fixture} selected`, obelisk.selected, selected);
  }

  // The same panel under another title (Obelisk, Relic Chest, ...): only the "Obtain" label identifies it.
  for (const [fixture, selected] of [["treasure-chest", null], ["treasure-chest-picked", 0]]) {
    const untitled = await frame(fixture);
    const data = Uint8Array.from(untitled.data);
    const top = Math.round((untitled.height * 360) / 2460);
    const bottom = Math.round((untitled.height * 470) / 2460);
    data.fill(0, top * untitled.width * 4, bottom * untitled.width * 4);
    const other = { ...untitled, data };
    expect(`${fixture} under another title: screen`, classifyScreen(other), "treasureChest");
    expect(`${fixture} under another title: selected`, readTreasureChest(other, library).selected, selected);
  }

  for (const [fixture, selected] of [["select-attribute", null], ["select-attribute-picked", 2]]) {
    const attribute = readSelectAttribute(await frame(fixture), library);
    expect(fixture, attribute, { magicId: "shield", groupLevel: 5, talents: ["Barrier", "Reconstruct", "Destruction Field"], selected });
  }

  // A level-up offers two (Arcanist), three or four rows, centered: what each row is, where it is (the share of
  // the screen height the tap guards are laid out with), and where the Retrieve button is — two rows come without one.
  const OFFERS = {
    "select-magic": { ids: ["magic:flashShock", "magic:shield", "magic:meteor"], rows: [[28, 43], [45, 61], [63, 78]], retrieve: [81, 86] },
    "select-magic-2": { ids: ["magic:energyBolt", "magic:shield"], rows: [[37, 53], [55, 70]], retrieve: null },
    "select-magic-4": {
      ids: ["magic:magicCircle", "magic:electricShock", "magic:thunderstorm", "magic:fireball"],
      rows: [[20, 36], [37, 53], [55, 70], [72, 88]],
      retrieve: [90, 95],
    },
  };
  for (const [fixture, expected] of Object.entries(OFFERS)) {
    const offerFrame = await frame(fixture);
    const share = (y) => Math.round((y / offerFrame.height) * 100);
    const offer = readSelectMagic(offerFrame, library);
    if (VERBOSE) console.log(`  ${fixture}:`, offer.rows.map((row) => detail(row.match)).join(" | "));
    expect(fixture, offer.rows.map((row) => id(row.match)), expected.ids);
    expect(`${fixture} rows`, offer.rows.map((row) => [share(row.top), share(row.bottom)]), expected.rows);
    expect(`${fixture} retrieve`, offer.retrieve && [share(offer.retrieve.top), share(offer.retrieve.bottom)], expected.retrieve);
  }

  // Where the companion's bubble may not sit: it should only have to move when it covers something that is read.
  // The two bubbles below are the size of the real one, docked right (where the player keeps it) and left.
  const bubbleRight = { x: 0.844, y: 0.24, w: 0.156, h: 0.068 };
  const bubbleLeft = { x: 0, y: 0.24, w: 0.156, h: 0.068 };
  const covered = async (fixture, screen, bubble) => readKeepOut(await frame(fixture), screen).some((zone) => intersects(zone, bubble));
  expect("bubble on a Select Magic row's level label stays", await covered("select-magic", "selectMagic", bubbleRight), false);
  expect("bubble on a Select Magic row's icon moves", await covered("select-magic", "selectMagic", bubbleLeft), true);
  expect("bubble on the Owned Magic cards moves", await covered("owned-magic", "ownedMagic", bubbleRight), true);
  expect("bubble below the Owned Magic cards stays", await covered("owned-magic", "ownedMagic", { ...bubbleRight, y: 0.6 }), false);
  expect("bubble on the chest's cards moves", await covered("treasure-chest", "treasureChest", { ...bubbleRight, y: 0.3 }), true);
  expect("bubble above the four rows stays", await covered("select-magic-4", "selectMagic", { ...bubbleLeft, y: 0.12 }), false);
  expect("bubble on the first of four rows moves", await covered("select-magic-4", "selectMagic", { ...bubbleLeft, y: 0.22 }), true);
  expect("Select Magic still fading in (no row solid yet) moves nothing", readKeepOut(await frame("gameplay-1"), "selectMagic"), []);
  expect("bubble on Pause stays", await covered("pause", "pause", bubbleRight), false);
  expect("bubble on Select Attribute stays", await covered("select-attribute", "selectAttribute", bubbleRight), false);

  // What a sequence of screens amounts to: the events of each frame, in order.
  const play = async (...fixtures) => {
    const session = new CaptureSession();
    const events = [];
    for (const fixture of fixtures) events.push(session.push(observe(await frame(fixture), library)));
    return events;
  };
  const OFFER = [{ kind: "magic", id: "flashShock" }, { kind: "magic", id: "shield" }, { kind: "magic", id: "meteor" }];

  expect("sequence: talent pick", await play("select-magic", "select-attribute", "select-attribute-picked", "gameplay-2"), [
    [],
    [],
    [],
    [{ type: "talentLearned", magicId: "shield", groupLevel: 5, talent: "Destruction Field" }],
  ]);
  expect("sequence: plain level-up", await play("gameplay-1", "select-magic", "select-magic", "gameplay-2"), [
    [],
    [],
    [],
    [{ type: "pickNeeded", options: OFFER }],
  ]);
  // Where one run ends and the next begins.
  const lifecycle = (events) => events.flat().map((event) => event.type);
  expect("sequence: Enter Area starts a new run", lifecycle(await play("enter-area", "enter-area", "research", "gameplay-1", "gameplay-2")), ["runStarted"]);
  expect("sequence: the run coming back without Enter Area is the same run", lifecycle(await play("pause", "gameplay-1")), []);
  expect("sequence: death, then revived", lifecycle(await play("gameplay-1", "life-or-death", "research", "gameplay-2")), []);
  expect(
    "sequence: death, the run over, then back after all",
    lifecycle(await play("gameplay-1", "life-or-death", ...Array(12).fill("research"), "research", "gameplay-2")),
    ["runEnded", "runResumed"]
  );
  expect(
    "sequence: death, then a new run",
    lifecycle(await play("life-or-death", ...Array(12).fill("research"), "enter-area", "gameplay-1")),
    ["runEnded", "runStarted"]
  );

  expect("sequence: chest", await play("treasure-chest", "treasure-chest-picked", "gameplay-3"), [[], [], [{ type: "artifactObtained", id: "organicshield" }]]);
  expect("sequence: chest left without picking", await play("treasure-chest", "gameplay-3"), [[], []]);
  expect("sequence: obelisk", await play("gameplay-4", "obelisk", "obelisk-picked", "gameplay-4"), [[], [], [], [{ type: "artifactObtained", id: "dragonmagic" }]]);
  // "Reroll" deals new cards on the same screen: the card selected before it is gone, so nothing was obtained.
  expect("sequence: selection lost to a reroll", await play("obelisk-picked", "treasure-chest", "gameplay-4"), [[], [], []]);
  expect("sequence: owned lists", await play("pause", "owned-magic", "owned-magic", "owned-magic", "owned-artifact", "owned-artifact"), [
    [],
    [],
    [
      {
        type: "magicsSynced",
        entries: [
          { kind: "magic", id: "magicBolt", level: 1, special: false },
          { kind: "magic", id: "shield", level: 5, special: false },
          { kind: "passive", id: "guardianangel", level: 1, special: true },
          { kind: "magic", id: "magicCircle", level: 2, special: false },
        ],
      },
    ],
    [],
    [],
    [{ type: "artifactsSynced", ids: ["spacetimecircuit", "lantern", "organicshield"] }],
  ]);
}

if (failures) {
  console.error(`\n${failures} screen-reading check(s) failed.`);
  process.exit(1);
}
console.log("\nAll screen-reading checks passed.");
