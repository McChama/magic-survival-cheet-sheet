import type { ReactNode } from "react";
import { uiImage } from "../../config/assets";
import { StripFrame } from "./StripFrame";

interface DetailModalProps {
  onClose: () => void;
  closeAria: string;
  /** What a tap on the backdrop does; defaults to `onClose`. A modal with an inner layer open
   *  (e.g. a talent panel) uses this to close only that layer. */
  onBackdropClick?: () => void;
  /** `center` (default) centers the content vertically in the card — right for a short, self-contained
   *  detail (a class, an artifact, a synergy). `top` hands the whole card to the content, which lays
   *  itself out from the top (the magic-style modals). */
  align?: "center" | "top";
  children: ReactNode;
}

/** The modal's fill and its border share one color — the border is the same rough strip
 *  sprites as the grid cards, drawn in the modal's own background color so only the ragged
 *  edge shows. Square corners, no border-radius (as in the real game). */
const MODAL_BG = "#0b0b0b"; // keep in sync with the `bg-[#0b0b0b]` fill below

/**
 * The centered detail card used when tapping a grid tile needs more room than
 * `ScreenFooter`'s inline preview — a Class's full bonus breakdown, a magic's stats, or an
 * Artifact's icon/name/description. A `fixed inset-0` backdrop (not `absolute`) so it always
 * covers the full screen regardless of where in the tree it's mounted — same reasoning as
 * `LoadoutFab`'s dismiss backdrop. The card is 93% wide and 72% tall (the game's is ~68%; a little more so content fits without scrolling) (a fixed height,
 * because the border strips size themselves off a size container); its content never scrolls — a modal's
 * content is laid out to fit it. The backdrop is a light veil (white at ~18%), so the screen behind reads as gray.
 */
export function DetailModal({ onClose, closeAria, onBackdropClick, align = "center", children }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white/[.18] flex items-center justify-center" onClick={onBackdropClick ?? onClose}>
      <div
        className="relative w-[93%] max-w-[400px] h-[72dvh] [container-type:size]"
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden className="absolute inset-[3px] bg-[#0b0b0b]" />
        <StripFrame tint={MODAL_BG} size="modal" />
        <div className="relative h-full overflow-hidden p-4">
          <button
            type="button"
            onClick={onClose}
            aria-label={closeAria}
            className="absolute z-10 top-3 right-3 w-9 h-9 bg-transparent border-none cursor-pointer flex items-center justify-center"
          >
            <img src={uiImage("icons/UI_Exit.png")} alt="" className="w-[18px] h-[18px] object-contain" />
          </button>
          {align === "center" ? <div className="min-h-full flex flex-col justify-center">{children}</div> : children}
        </div>
      </div>
    </div>
  );
}
