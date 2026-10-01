import { useEffect, useState } from "react";
import { subjectAnimFrame, subjectImage } from "../../config/assets";
import { slug as subjectSlug } from "../../i18n/gameData";

/**
 * User-picked subset of the 21-frame animation set that reads as a calm idle sway rather
 * than the full set's dramatic swings (see research/game-data-sources.md — the frames
 * are individually cropped with no shared pivot, so this subset is a deliberate choice of
 * which frames jump the least, not just "the idle portion" of a longer sequence).
 */
const IDLE_FRAMES = [7, 8, 9];
const IDLE_FRAME_MS = 150;

/**
 * A Test Subject's real in-game sprite, swaying through its idle frames — the one animated
 * Subject used wherever a Subject is shown (Subject Select's grid, a row of the Runs list).
 * Sizing and any tint are the caller's, through `className`.
 */
export function SubjectSprite({ name, label, className = "" }: { name: string; label: string; className?: string }) {
  const slug = subjectSlug(name);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % IDLE_FRAMES.length);
    }, IDLE_FRAME_MS);
    return () => window.clearInterval(id);
  }, [slug]);

  return (
    <img
      src={subjectAnimFrame(slug, IDLE_FRAMES[frameIndex])}
      alt={label}
      className={className}
      onError={(e) => {
        // Fall back to the static portrait if this subject's animation set is somehow incomplete.
        e.currentTarget.onerror = null;
        e.currentTarget.src = subjectImage(`${slug}.png`);
      }}
    />
  );
}
