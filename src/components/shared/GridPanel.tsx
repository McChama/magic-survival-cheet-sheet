import type { ReactNode } from "react";
import { uiImage } from "../../config/assets";
import { MaskedSprite } from "./MaskedSprite";

/**
 * The rough-edged dark-gray panel the real game's Owned Magic/Owned Artifact grids sit on
 * (`ArtifactBackGroundA.png`, a white-on-transparent mask stretched to fill). It's the
 * scroll container, so the panel stays put while its tiles scroll inside. Margins and
 * padding are percentages measured off a real screenshot: 10% screen margins, and 12px
 * sides / 18px top on a 704px-wide panel (1.7% / 2.6% — % padding is width-relative on
 * every side).
 */
export function GridPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 min-h-0 px-[10%] pb-[7%] mt-6">
      <div className="relative h-full">
        <MaskedSprite src={uiImage("frames/ArtifactBackGroundA.png")} stretch className="absolute inset-0 pointer-events-none bg-[#242121]" />
        <div className="relative h-full overflow-y-auto p-[1.7%] pt-[2.6%]">{children}</div>
      </div>
    </div>
  );
}
