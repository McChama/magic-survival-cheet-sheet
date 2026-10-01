// Regression guard for the screen reading (src/capture/): replays the real screenshots in
// scripts/capture-fixtures/ and fails if a screen, icon, level or selection is read differently
// from what the screenshot shows. Every case runs at the phone's own resolution and at the
// narrower one the live capture uses.
//
//   npm run check:capture

import { buildLibrary } from "../src/capture/library.ts";
import { classifyScreen, readOwnedArtifacts, readOwnedMagic, readSelectAttribute, readSelectMagic, readTreasureChest } from "../src/capture/recognize.ts";
import { intersects, readKeepOut } from "../src/capture/keepOut.ts";
import { CaptureSession, observe } from "../src/capture/session.ts";
import { loadFixture, loadSprite } from "./capture-node.mjs";

const WIDTHS = [1080, 720];
const VERBOSE = process.argv.includes("--verbose");

const SCREENS = {
  "select-magic": "selectMagic",
  "select-attribute": "selectAttribute",
  "select-attribute-picked": "selectAttribute",
  "treasure-chest": "treasureChest",
  "treasure-chest-picked": "treasureChest",
  pause: "pause",
  "owned-magic": "ownedMagic",
  "owned-artifact": "ownedArtifact",
  synergy: "synergy",
  "gameplay-1": "gameplay",
  "gameplay-2": "gameplay",
  "gameplay-3": "gameplay",
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

const library = await buildLibrary(loadSprite);
console.log(`Library: ${library.icons.length} icon templates, ${library.artifacts.length} artifact templates.`);

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

  const offerFrame = await frame("select-magic");
  const offer = readSelectMagic(offerFrame, library);
  if (VERBOSE) console.log("  select magic:", offer.map((row) => detail(row.match)).join(" | "));
  expect("select magic", offer.map((row) => id(row.match)), ["magic:flashShock", "magic:shield", "magic:meteor"]);
  // Where each row is, as the share of the screen height the tap guards are laid out with (measured: 685-1069, 1113-1496, 1541-1924 of 2460).
  expect(
    "select magic rows",
    offer.map((row) => [Math.round((row.top / (offerFrame.height)) * 100), Math.round((row.bottom / (offerFrame.height)) * 100)]),
    [[28, 43], [45, 61], [63, 78]]
  );

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
  expect("sequence: chest", await play("treasure-chest", "treasure-chest-picked", "gameplay-3"), [[], [], [{ type: "artifactObtained", id: "organicshield" }]]);
  expect("sequence: chest left without picking", await play("treasure-chest", "gameplay-3"), [[], []]);
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
