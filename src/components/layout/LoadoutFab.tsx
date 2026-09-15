import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadoutSheet } from "../shared/LoadoutSheet";
import type { QuickAddKind } from "../../data/quickAddOptions";

export function LoadoutFab() {
  const { t } = useTranslation("translation");
  const [fabOpen, setFabOpen] = useState(false);
  const [activeKind, setActiveKind] = useState<QuickAddKind | null>(null);

  function openSheet(kind: QuickAddKind) {
    setActiveKind(kind);
    setFabOpen(false);
  }

  return (
    <>
      {fabOpen && (
        <div className="absolute inset-0 bg-[#040405]/[.68]" onClick={() => setFabOpen(false)} />
      )}

      <div className="absolute right-5 bottom-[26px] flex flex-col items-end gap-3">
        {fabOpen && (
          <div className="animate-ms-pop flex flex-col items-end gap-3">
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
          className={`w-[60px] h-[60px] rounded-full border-none bg-[#f07f2a] text-white text-[32px] leading-none cursor-pointer shadow-[0_6px_18px_rgba(0,0,0,.55)] flex items-center justify-center transition-transform duration-[180ms] ease-in-out ${fabOpen ? "rotate-45" : "rotate-0"}`}
        >
          +
        </button>
      </div>

      {activeKind && <LoadoutSheet kind={activeKind} onClose={() => setActiveKind(null)} />}
    </>
  );
}
