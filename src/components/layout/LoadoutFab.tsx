import { useState } from "react";
import { useTranslation } from "react-i18next";
import { uiImage } from "../../config/assets";
import { LoadoutSheet } from "../shared/LoadoutSheet";
import type { QuickAddKind } from "../../data/quickAddOptions";

interface LoadoutFabProps {
  onOpenRecommender: () => void;
}

/**
 * The "Add" circle under the Dashboard's nav row — inline, not a floating
 * corner FAB, so its popup opens *upward* from the button (`bottom-full`) instead of
 * being pinned to a screen corner. Its glyph is the game's X sprite turned 45° so it reads as a "+"
 * (and back to an X while the menu is open). The dismiss backdrop stays `fixed inset-0` (not
 * `absolute`) specifically because this button no longer sits in a full-screen-positioned
 * wrapper — an `absolute` backdrop would only cover this footer row, not the whole screen.
 */
export function LoadoutFab({ onOpenRecommender }: LoadoutFabProps) {
  const { t } = useTranslation("translation");
  const [fabOpen, setFabOpen] = useState(false);
  const [activeKind, setActiveKind] = useState<Exclude<QuickAddKind, "passive"> | null>(null);

  function openSheet(kind: Exclude<QuickAddKind, "passive">) {
    setActiveKind(kind);
    setFabOpen(false);
  }

  return (
    <>
      <div className="relative">
        {fabOpen && (
        <div className="fixed inset-0 bg-[#040405]/[.68]" onClick={() => setFabOpen(false)} />
      )}

      {fabOpen && (
        <div className="animate-ms-pop absolute bottom-full right-0 mb-3 flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={() => {
              setFabOpen(false);
              onOpenRecommender();
            }}
            className="flex items-center gap-3 bg-transparent border-none cursor-pointer font-[inherit] p-0"
          >
            <span className="text-[1.1rem] text-[#e8e8e2] [text-shadow:0_1px_4px_#000]">{t("loadoutFab.recommender")}</span>
            <span className="w-[46px] h-[46px] rounded-full bg-[#1b1b1f] border border-[#efc84f]/50 text-[#efc84f] text-2xl flex items-center justify-center">
              ⚖
            </span>
          </button>
          <button
            type="button"
            onClick={() => openSheet("artifact")}
            className="flex items-center gap-3 bg-transparent border-none cursor-pointer font-[inherit] p-0"
          >
            <span className="text-[1.1rem] text-[#e8e8e2] [text-shadow:0_1px_4px_#000]">{t("loadoutFab.artifact")}</span>
            <span className="w-[46px] h-[46px] rounded-full bg-[#1b1b1f] border border-[#efc84f]/50 text-[#efc84f] text-2xl flex items-center justify-center">
              ✦
            </span>
          </button>
          <button
            type="button"
            onClick={() => openSheet("magic")}
            className="flex items-center gap-3 bg-transparent border-none cursor-pointer font-[inherit] p-0"
          >
            <span className="text-[1.1rem] text-[#e8e8e2] [text-shadow:0_1px_4px_#000]">{t("loadoutFab.magic")}</span>
            <span className="w-[46px] h-[46px] rounded-full bg-[#1b1b1f] border border-[#5fe3c4]/50 text-[#5fe3c4] text-2xl flex items-center justify-center">
              ✧
            </span>
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label={fabOpen ? t("loadoutFab.closeAria") : t("loadoutFab.openAria")}
        onClick={() => setFabOpen((v) => !v)}
        className="w-[50px] h-[50px] rounded-full border-none bg-[#5c1a1a] p-0 cursor-pointer flex items-center justify-center"
      >
        <img
          src={uiImage("icons/UI_Exit.png")}
          alt=""
          className={`w-[30px] h-[30px] object-contain transition-transform duration-[180ms] ease-in-out ${fabOpen ? "rotate-0" : "rotate-45"}`}
        />
      </button>
    </div>

      {activeKind && <LoadoutSheet kind={activeKind} onClose={() => setActiveKind(null)} />}
    </>
  );
}
