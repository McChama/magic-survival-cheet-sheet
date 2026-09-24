import { useTranslation } from "react-i18next";
import { uiImage } from "../../config/assets";

interface PagerProps {
  /** 0-based current page. */
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

/**
 * "‹ 2 / 5 ›": the page control of the lists that never scroll (the "+" menu's magics and artifacts, the Recommender's grid) — only
 * the Owned Magic / Owned Artifact / Synergy screens scroll. It always takes its row (a bare spacer with one page), so paging
 * doesn't move what's around it.
 */
export function Pager({ page, pages, onChange }: PagerProps) {
  const { t } = useTranslation("translation");
  if (pages <= 1) return <div className="flex-none h-9" />;
  return (
    <div className="flex-none h-9 flex items-center justify-center gap-4 text-[0.85rem] text-[#e8e8e2]/60">
      <button
        type="button"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        aria-label={t("pager.prevAria")}
        className="w-9 h-9 p-2 bg-transparent border-none cursor-pointer disabled:opacity-25 disabled:cursor-default"
      >
        <img src={uiImage("icons/UI_AreaMove_L.png")} alt="" className="w-full h-full object-contain" />
      </button>
      <span className="min-w-[4ch] text-center">{`${page + 1} / ${pages}`}</span>
      <button
        type="button"
        disabled={page >= pages - 1}
        onClick={() => onChange(page + 1)}
        aria-label={t("pager.nextAria")}
        className="w-9 h-9 p-2 bg-transparent border-none cursor-pointer disabled:opacity-25 disabled:cursor-default"
      >
        <img src={uiImage("icons/UI_AreaMove_R.png")} alt="" className="w-full h-full object-contain" />
      </button>
    </div>
  );
}
