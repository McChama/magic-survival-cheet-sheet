import fs from "node:fs";

const wikiRarity = JSON.parse(fs.readFileSync("scripts/wiki-rarity.json", "utf-8"));
const nameToTier = new Map();
for (const [tier, names] of Object.entries(wikiRarity)) {
  for (const name of names) nameToTier.set(name.toLowerCase(), tier);
}

const text = fs.readFileSync("src/data/artifacts.ts", "utf-8");
const lines = text.split("\n");

const mismatches = [];
const notOnWiki = [];
let matched = 0;

const fixedLines = lines.map((line) => {
  const nameMatch = line.match(/name:\s*"([^"]+)"/);
  const rarityMatch = line.match(/rarity:\s*"([^"]+)"/);
  if (!nameMatch || !rarityMatch) return line;
  const name = nameMatch[1];
  const currentRarity = rarityMatch[1];
  const wikiTier = nameToTier.get(name.toLowerCase());
  if (!wikiTier) {
    notOnWiki.push(name);
    return line;
  }
  matched++;
  if (wikiTier !== currentRarity) {
    mismatches.push({ name, was: currentRarity, shouldBe: wikiTier });
    return line.replace(`rarity: "${currentRarity}"`, `rarity: "${wikiTier}"`);
  }
  return line;
});

console.log(`Matched against wiki: ${matched}`);
console.log(`Not on wiki (left as-is): ${notOnWiki.length}`);
console.log(`Mismatches found & fixed: ${mismatches.length}`);
for (const m of mismatches) console.log(`  ${m.name}: ${m.was} -> ${m.shouldBe}`);

fs.writeFileSync("src/data/artifacts.ts", fixedLines.join("\n"));
console.log("\nWrote corrected src/data/artifacts.ts");

console.log("\nNot found on wiki (kept current rarity, presumably newer items):");
console.log(notOnWiki.join(", "));
