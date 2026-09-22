/** One level pip: filled = reached, hollow = not yet. Yellow for active magics (passives use
 *  green in the real game); every pip of a magic that has reached its max level is green. */
export function Pip({ filled, maxed, size }: { filled: boolean; maxed: boolean; size: string }) {
  const border = maxed ? "border-[#3fdc5a]" : "border-[#e3e01c]";
  const fill = !filled ? "bg-transparent" : maxed ? "bg-[#3fdc5a]" : "bg-[#e3e01c]";
  return <span className={`rounded-full border box-border flex-none ${size} ${fill} ${border}`} />;
}

/** A special ability's marker where an active magic shows its level pips: same row, but a
 *  star noticeably bigger than a pip (a star reads much smaller than a circle of the same box). */
export function StarIcon({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`flex-none fill-[#ff3c64] ${size}`}>
      <polygon points="12,1 15,9 23,9 16.5,14 19,23 12,17.5 5,23 7.5,14 1,9 9,9" />
    </svg>
  );
}
