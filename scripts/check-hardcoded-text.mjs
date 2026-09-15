// CI guard: fails if a view (src/components/**/*.tsx) contains plain-text
// copy that should instead come from the translation files
// (src/i18n/locales/en/*.json via useTranslation()/t(...)), per this
// project's i18n convention — every user-facing string is a translation key,
// never a literal in JSX.
//
// This walks the TypeScript AST (not regex) looking for:
//   - JSX text nodes with actual words, e.g. <div>Save changes</div>
//   - string-literal JSX attributes on text-bearing props, e.g.
//     aria-label="Close menu", placeholder="Search..."
//   - JSX expression children that are plain string literals, e.g. {"Hello"}
//
// It does not flag:
//   - anything already wrapped in a t(...) call (t("key"), t("key", {…}))
//   - non-JSX .ts files (game data, stores, engine code)
//   - strings with no letters (icons, punctuation, numbers, units)
//   - className/style and other non-text attributes
//
//   node scripts/check-hardcoded-text.mjs

import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, relative, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Views only — this is where the "type it as plain text instead of a
// translation key" mistake actually happens.
const targetDirs = ["src/components"];

// JSX attributes that carry user-visible copy. Not an exhaustive list of every
// JSX attribute — deliberately narrow to the ones known to hold text in this
// codebase, to keep false positives low.
const TEXT_ATTRS = new Set(["aria-label", "aria-description", "alt", "title", "placeholder"]);

// A string with no letters (icons like "×", punctuation, numbers, units like
// "%","px") isn't copy that needs translating.
function hasLetters(value) {
  return /\p{L}/u.test(value);
}

function walk(dirRelPath, files) {
  const dirAbsPath = resolve(root, dirRelPath);
  for (const entry of readdirSync(dirAbsPath, { withFileTypes: true })) {
    const entryRelPath = join(dirRelPath, entry.name);
    if (entry.isDirectory()) {
      walk(entryRelPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(entryRelPath.split("\\").join("/"));
    }
  }
}

function collectFiles(dirs) {
  const files = [];
  for (const dir of dirs) walk(dir, files);
  return files.sort();
}

function isInsideTCall(node) {
  let current = node.parent;
  while (current) {
    if (
      ts.isCallExpression(current) &&
      ((ts.isIdentifier(current.expression) && current.expression.text === "t") ||
        (ts.isPropertyAccessExpression(current.expression) && current.expression.name.text === "t"))
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function scanFile(relPath) {
  const filePath = resolve(root, relPath);
  const text = readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits = [];

  function report(node, snippet) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    hits.push({ line: line + 1, text: snippet.trim().slice(0, 160) });
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      const value = node.text.replace(/\s+/g, " ").trim();
      if (value && hasLetters(value)) {
        report(node, value);
      }
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (TEXT_ATTRS.has(name) && node.initializer && ts.isStringLiteral(node.initializer)) {
        const value = node.initializer.text;
        if (hasLetters(value)) {
          report(node, `${name}="${value}"`);
        }
      }
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      // Plain string literal used directly as a JSX expression child, e.g. {"Hello"}
      if (
        node.parent &&
        ts.isJsxExpression(node.parent) &&
        node.parent.parent &&
        (ts.isJsxElement(node.parent.parent) || ts.isJsxFragment(node.parent.parent)) &&
        hasLetters(node.text) &&
        !isInsideTCall(node)
      ) {
        report(node, node.getText(sourceFile));
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return hits;
}

const files = collectFiles(targetDirs);
let totalHits = 0;

for (const file of files) {
  const hits = scanFile(file);
  if (hits.length === 0) continue;
  totalHits += hits.length;
  console.error(`\n${relative(root, resolve(root, file))}`);
  for (const hit of hits) {
    console.error(`  ${hit.line}: ${hit.text}`);
  }
}

if (totalHits > 0) {
  console.error(
    `\nFound ${totalHits} hardcoded string(s) in views.\n` +
      "User-facing text in src/components/ must come from the translation files\n" +
      "(useTranslation() + t(\"...\") against src/i18n/locales/en/*.json), not literal\n" +
      "JSX text or string props. Add/update a key in translation.json (or gameData.json\n" +
      "for game data) and reference it with t(...) instead.",
  );
  process.exit(1);
}

console.log(`Scanned ${files.length} view file(s), no hardcoded text detected.`);
