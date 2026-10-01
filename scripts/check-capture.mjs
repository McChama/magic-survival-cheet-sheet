// Regression guard for the screen reading (src/capture/): replays the real screenshots in
// scripts/capture-fixtures/ and fails if a screen, icon, level or selection is read differently
// from what the screenshot shows. Every case runs at the phone's own resolution and at the
// narrower one the live capture uses.
//
//   npm run check:capture

import { buildLibrary } from "../src/capture/library.ts";
import { classifyScreen, readOwnedArtifacts, readOwnedMagic, readSelectAttribute, readSelectMagic, readTreasureChest } from "../src/capture/recognize.ts";
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

  for (const [fixture, selected] of [["select-attribute", null], ["select-attribute-picked", 2]]) {
    const attribute = readSelectAttribute(await frame(fixture), library);
    expect(fixture, attribute, { magicId: "shield", groupLevel: 5, talents: ["Barrier", "Reconstruct", "Destruction Field"], selected });
  }

  const offer = readSelectMagic(await frame("select-magic"), library);
  if (VERBOSE) console.log("  select magic:", offer.map(detail).join(" | "));
  expect("select magic", offer.map(id), ["magic:flashShock", "magic:shield", "magic:meteor"]);

  // What a sequence of screens amounts to: the events of each frame, in order.
  const play = async (...fixtures) => {
    const session = new CaptureSession();
    const events = [];
    for (const fixture of fixtures) events.push(session.push(observe(await frame(fixture), library)));
    return events;
  };
  const OFFER = [{ kind: "magic", id: "flashShock" }, { kind: "magic", id: "shield" }, { kind: "magic", id: "meteor" }];

  expect("sequence: talent pick", await play("select-magic", "select-attribute", "select-attribute-picked", "gameplay-2"), [
    [{ type: "levelUp" }],
    [],
    [],
    [{ type: "talentLearned", magicId: "shield", groupLevel: 5, talent: "Destruction Field" }],
  ]);
  expect("sequence: plain level-up", await play("gameplay-1", "select-magic", "select-magic", "gameplay-2"), [
    [],
    [{ type: "levelUp" }],
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
