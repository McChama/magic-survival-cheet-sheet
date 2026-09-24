import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { uiImage } from "../../config/assets";
import { baseMagicSpriteUrl } from "../../data/magics";
import { getMagicCircleLevel, isOvermindChosen, magicCircleEffect } from "../../engine/magicCircle";
import { playMagicCircleSound } from "../../engine/uiSound";
import { useRunStore } from "../../store/useRunStore";
import { useUiStore } from "../../store/useUiStore";
import { MaskedSprite } from "../shared/MaskedSprite";

type Side = "left" | "right";

/** Where the bubble rests: glued to the left or right edge of the app frame, `along` (0-1) of the way down it. */
interface Dock {
  side: Side;
  along: number;
}

const STORAGE_KEY = "magic-circle-bubble";
const DEFAULT_DOCK: Dock = { side: "right", along: 0.55 };
/** Bubble box, px — also what the snap keeps inside the frame. */
const SIZE = 56;
/** A press that moves less than this is a tap (toggle), more is a drag. */
const DRAG_THRESHOLD = 6;
const EDGE_GAP = 4;

function loadDock(): Dock | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Dock | null;
    if (parsed && (parsed.side === "left" || parsed.side === "right") && typeof parsed.along === "number") return { side: parsed.side, along: clamp01(parsed.along) };
  } catch {
    // Storage can be blocked or empty; the default position is fine.
  }
  return null;
}

function saveDock(dock: Dock): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dock));
  } catch {
    // Not persisting is harmless.
  }
}

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

const CIRCLE_VARIANTS = 3;
/** The game's circle art has 3 hand-drawn variants per layer, flipped through quickly so the lines shimmer. */
const CIRCLE_VARIANT_MS = 140;
const circleSprite = (n: number): string => uiImage(`magicCircle/MagicCircle${n}.png`);

/**
 * The buff's icon while ON: the runic outer ring (MagicCircle4-6) turns one way, the inner hexagram circle (MagicCircle1-3)
 * the other. With the Overmind talent chosen it becomes the single circle drawn in MagicCircle7-9 instead, still turning.
 */
function SpinningCircle({ overmind }: { overmind: boolean }) {
  const [variant, setVariant] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setVariant((v) => (v + 1) % CIRCLE_VARIANTS), CIRCLE_VARIANT_MS);
    return () => window.clearInterval(id);
  }, []);
  if (overmind) {
    return (
      <span aria-hidden className="relative block w-[88%] h-[88%] pointer-events-none motion-safe:animate-spin-cw">
        <MaskedSprite src={circleSprite(7 + variant)} className="block w-full h-full bg-[#efc84f]" />
      </span>
    );
  }
  return (
    <span aria-hidden className="relative block w-[88%] h-[88%] pointer-events-none">
      <span className="absolute inset-0 motion-safe:animate-spin-cw">
        <MaskedSprite src={circleSprite(4 + variant)} className="block w-full h-full bg-[#efc84f]" />
      </span>
      <span className="absolute inset-[9%] motion-safe:animate-spin-ccw">
        <MaskedSprite src={circleSprite(1 + variant)} className="block w-full h-full bg-[#efc84f]" />
      </span>
    </span>
  );
}

/** The side of a `width` x `height` frame the point (x, y) is closest to, and how far down the frame it lies. */
function nearestDock(x: number, y: number, width: number, height: number): Dock {
  return { side: x < width / 2 ? "left" : "right", along: clamp01(y / height) };
}

/** CSS placement for a docked bubble: flush against its side, vertically centered on `along`. */
function dockStyle({ side, along }: Dock): React.CSSProperties {
  return { [side]: EDGE_GAP, top: `${along * 100}%`, translate: `0 ${-SIZE / 2}px` };
}
/**
 * The Magic Circle's on/off switch as a floating bubble, like a chat head: the magic's own icon, white while the buff is
 * off and yellow while it is on (with its Amplify ATK % under it). Tap it to switch; drag it anywhere and it snaps to the
 * nearest side (left or right) of the app frame when let go, keeping the height where it was dropped. It floats over every run screen, so the buff can be flipped while reading
 * Owned Magic. Renders nothing when the run has no Magic Circle. Only its resting place is remembered (in this browser).
 */
export function MagicCircleBubble({ screen }: { screen: string }) {
  const { t } = useTranslation("translation");
  const run = useRunStore((s) => s.run);
  const setMagicCircleActive = useRunStore((s) => s.setMagicCircleActive);
  const level = getMagicCircleLevel(run);
  const hiddenBySheet = useUiStore((s) => s.hideMagicCircleBubble);
  const [dock, setDock] = useState<Dock>(() => loadDock() ?? DEFAULT_DOCK);
  /** Until the player has dragged it somewhere (or it has been lined up once), the resting height follows the Current Level label. */
  const placed = useRef(loadDock() !== null);
  const overmind = isOvermindChosen(run);
  const hasCircle = level !== null;

  useLayoutEffect(() => {
    if (placed.current || !hasCircle) return;
    const frame = (buttonRef.current?.offsetParent as HTMLElement | null)?.getBoundingClientRect();
    const anchor = document.querySelector("[data-magic-circle-anchor]")?.getBoundingClientRect();
    if (!frame || !anchor) return;
    placed.current = true;
    setDock({ side: "right", along: clamp01((anchor.top + anchor.height / 2 - frame.top) / frame.height) });
  }, [hasCircle, screen]);

  // Without the magic there is no buff: switch it off so it doesn't come back ON when the magic is added again.
  useEffect(() => {
    if (!hasCircle && run.magicCircleActive) setMagicCircleActive(false);
  }, [hasCircle, run.magicCircleActive, setMagicCircleActive]);

  // Losing the magic also forgets where the bubble was left: the next time it appears it lines up with Current Level again.
  const hadCircle = useRef(hasCircle);
  useEffect(() => {
    if (hadCircle.current && !hasCircle) {
      placed.current = false;
      setDock(DEFAULT_DOCK);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Nothing stored, nothing to forget.
      }
    }
    hadCircle.current = hasCircle;
  }, [hasCircle]);
  /** While dragging: the bubble's center in px inside the frame (it follows the finger, no snapping yet). */
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const gesture = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  /** Bumped on every tap; used as a React key so the tap animation restarts each time. */
  const [tapCount, setTapCount] = useState(0);
  /** Bumped each time the buff is switched ON, restarting the cast animation. */
  const [castCount, setCastCount] = useState(0);

  if (level === null || hiddenBySheet) return null;
  const active = run.magicCircleActive;
  const effect = magicCircleEffect(level);
  const label = active ? t("dashboard.magicCircleOn", { effect }) : t("dashboard.magicCircleOff");

  function frameRect(): DOMRect | null {
    return (buttonRef.current?.offsetParent as HTMLElement | null)?.getBoundingClientRect() ?? null;
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { startX: e.clientX, startY: e.clientY, offsetX: e.clientX - (rect.left + rect.width / 2), offsetY: e.clientY - (rect.top + rect.height / 2), moved: false };
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current;
    const frame = frameRect();
    if (!g || !frame) return;
    if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < DRAG_THRESHOLD) return;
    g.moved = true;
    const half = SIZE / 2;
    setDrag({
      x: Math.min(frame.width - half, Math.max(half, e.clientX - frame.left - g.offsetX)),
      y: Math.min(frame.height - half, Math.max(half, e.clientY - frame.top - g.offsetY)),
    });
  }

  function onPointerUp() {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    if (!g.moved) {
      setMagicCircleActive(!active);
      setTapCount((n) => n + 1);
      if (!active) {
        playMagicCircleSound();
        setCastCount((n) => n + 1);
      }
      return;
    }
    const frame = frameRect();
    if (drag && frame) {
      const next = nearestDock(drag.x, drag.y, frame.width, frame.height);
      setDock(next);
      saveDock(next);
    }
    setDrag(null);
  }

  const position: React.CSSProperties = drag ? { left: drag.x - SIZE / 2, top: drag.y - SIZE / 2 } : dockStyle(dock);

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={position}
      className={`absolute z-[60] w-[56px] h-[56px] p-0 rounded-full flex flex-col items-center justify-center gap-0 touch-none select-none cursor-grab active:cursor-grabbing border-2 bg-black/75 backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,.6)] ${drag ? "" : "transition-[left,right,top,translate] duration-200 ease-out"} ${active ? "border-[#efc84f] shadow-[0_0_14px_rgba(239,200,79,.55)]" : "border-white/70"}`}
    >
      {/* A ring that spreads out and fades on each tap, in the color of the new state. */}
      {tapCount > 0 && <span key={`ripple-${tapCount}`} aria-hidden className={`absolute inset-[-2px] rounded-full border-2 pointer-events-none motion-safe:animate-bubble-ripple ${active ? "border-[#efc84f]" : "border-white"}`} />}
      {castCount > 0 && active && (
        <span key={`cast-${castCount}`} aria-hidden className="absolute inset-0 pointer-events-none motion-safe:animate-magic-circle-cast">
          <MaskedSprite src={circleSprite(4)} className="block w-full h-full bg-[#efc84f]" />
        </span>
      )}
      <span key={`pop-${tapCount}`} className={`flex items-center justify-center w-full h-full ${tapCount > 0 ? "motion-safe:animate-bubble-pop" : ""}`}>
        {active ? (
          <SpinningCircle overmind={overmind} />
        ) : (
          <MaskedSprite src={baseMagicSpriteUrl("magicCircle")} className="block w-[74%] h-[74%] pointer-events-none bg-white" />
        )}
      </span>
      {active && <span className="absolute -bottom-1 px-1 rounded-full bg-black text-[#efc84f] text-[0.6rem] leading-[1.1] pointer-events-none">{effect}%</span>}
    </button>
  );
}
