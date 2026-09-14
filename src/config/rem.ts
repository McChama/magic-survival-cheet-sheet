/**
 * Every screen's fontSize was hand-picked in px against the :root font-size in index.css
 * (see the comment there) and stayed fixed no matter how that root size changed — rem()
 * converts those px design values into rem so they scale with it instead. REM_BASE_PX is
 * that original design baseline, not the current :root value; changing :root's font-size
 * (e.g. for on-device testing) now scales every fontSize that goes through rem() relative
 * to this baseline, without needing to touch each call site's px number.
 */
const REM_BASE_PX = 20;

export function rem(px: number): string {
  return `${px / REM_BASE_PX}rem`;
}
