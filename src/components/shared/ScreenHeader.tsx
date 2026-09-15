import type { ReactNode } from "react";
import { uiImage } from "../../config/assets";

interface ScreenHeaderProps {
  /** Optional left-aligned slot (e.g. Research's point counter). Empty on most screens. */
  leftSlot?: ReactNode;
  onAction: () => void;
  actionAria: string;
  /** Defaults to the real in-game UI_Exit icon. Override for the one screen that needs
   *  the dark variant (Subject Select's light background — see UI_Exit_Black there). */
  actionIcon?: ReactNode;
}

/**
 * Fixed 36px chrome bar shared by every non-home screen — exactly the height of the
 * action button itself, no extra vertical padding around it. An optional left slot plus a
 * single top-right action button (a bare "✕" glyph used to range from 18px to 44px across
 * screens before this component existed — see CLAUDE.md's Screen layout structure section).
 */
export function ScreenHeader({
  leftSlot,
  onAction,
  actionAria,
  actionIcon = <img src={uiImage("icons/UI_Exit.png")} alt="" className="w-[18px] h-[18px] object-contain" />,
}: ScreenHeaderProps) {
  return (
    <div className="flex-none h-9 px-1.5 flex items-center justify-between">
      <div className="flex items-center">{leftSlot}</div>
      <button
        type="button"
        onClick={onAction}
        aria-label={actionAria}
        className="w-9 h-9 flex-none flex items-center justify-center bg-transparent border-none text-white cursor-pointer"
      >
        {actionIcon}
      </button>
    </div>
  );
}
