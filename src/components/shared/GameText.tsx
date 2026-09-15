import { Fragment } from "react";

/**
 * Renders one line of real in-game text (from `classes.ts`/`research.ts`/`artifacts.ts`
 * etc. — anything keeping the game's own `【】〈〉《》[]{}『』〔〕` marker formatting per
 * CLAUDE.md's language rule) the way the game itself displays it: brackets stripped, with
 * 4 of the 7 bracket types recolored to a fixed highlight color, confirmed against a real
 * screenshot the user provided (Wizard's Lv1 tooltip: "〔Magic Bolt Lv +1〕" in cyan/celeste,
 * "[5]" in pale yellow, "〈3%〉" in green, "『added』" in pink, with the rest of the line in
 * its own base color). `{}`/`【】`/`《》` have **no confirmed color** yet — this renders them
 * in the line's own base `color` rather than guessing; don't invent a color for them
 * without a real screenshot to check against.
 *
 * Bracket types can nest (e.g. Bishop's tooltip: `〔Magic Bolt [&] Shield Lv +1〕` — a `[]`
 * pair inside a `〔〕` pair), so parsing is recursive: a matched span's own inner text is
 * re-parsed for further bracket tokens rather than dumped in verbatim, and each nested
 * token still gets its own confirmed color rather than inheriting its parent's. (This was
 * a real bug, caught by the user — a single non-recursive pass left the nested `[&]`
 * showing literal, un-stripped, un-colored brackets.)
 *
 * `@` marks an in-game line break within a single dictionary field — split into separate
 * lines here rather than shown as a literal "@".
 */
const BRACKET_COLORS: { open: string; close: string; color: string | null }[] = [
  { open: "〔", close: "〕", color: "#32FFE1" }, // confirmed: cyan/celeste — ability name
  { open: "[", close: "]", color: "#FFEB9B" }, // confirmed: pale yellow — notable term/number
  { open: "〈", close: "〉", color: "#64FF32" }, // confirmed: green — numeric value
  { open: "『", close: "』", color: "#FF76DE" }, // confirmed: pink — emphasis phrase
  { open: "{", close: "}", color: null }, // unconfirmed — inherits surrounding color
  { open: "【", close: "】", color: null }, // unconfirmed — inherits surrounding color
  { open: "《", close: "》", color: null }, // unconfirmed — inherits surrounding color
];

const TOKEN_RE = /(〔[^〕]*〕|\[[^\]]*\]|〈[^〉]*〉|『[^』]*』|\{[^}]*\}|【[^】]*】|《[^》]*》)/g;

/**
 * `monochrome` disables every bracket highlight color (used for a locked/unavailable class
 * level, which the game shows fully greyed out — a bright per-bracket highlight color would
 * defeat that, since it'd stay legible/colorful inside an otherwise muted line).
 */
function renderSegment(text: string, color: string, monochrome: boolean, keyPrefix: string) {
  const parts = text.split(TOKEN_RE).filter((p) => p !== "");
  return parts.map((part, i) => {
    const key = `${keyPrefix}${i}`;
    const bracket = BRACKET_COLORS.find((b) => part.startsWith(b.open) && part.endsWith(b.close));
    if (!bracket) return <Fragment key={key}>{part}</Fragment>;
    const inner = part.slice(bracket.open.length, part.length - bracket.close.length);
    const innerColor = monochrome ? color : (bracket.color ?? color);
    return (
      <span key={key} style={{ color: innerColor }}>
        {renderSegment(inner, innerColor, monochrome, `${key}-`)}
      </span>
    );
  });
}

interface GameTextProps {
  text: string;
  color: string;
  className?: string;
  /** Renders every bracket span in the same flat `color` instead of its highlight color. */
  monochrome?: boolean;
}

/** One in-game text field, `@`-split into its own lines, each independently bracket-colored. */
export function GameText({ text, color, className, monochrome }: GameTextProps) {
  const lines = text.split(/\s*@\s*/);
  return (
    <span className={className} style={{ color }}>
      {lines.map((line, i) => (
        <span key={i} className="block">
          {renderSegment(line, color, !!monochrome, `${i}-`)}
        </span>
      ))}
    </span>
  );
}
