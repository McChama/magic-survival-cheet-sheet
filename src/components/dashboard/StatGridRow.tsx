import { useState } from "react";
import { STAT_DEFINITIONS } from "../../data/statDefinitions";
import { STAT_GLYPH } from "../../data/statGlyphs";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import type { CurrentRunState, StatKey } from "../../types/game";

interface StatGridRowProps {
  statKey: StatKey;
  run: CurrentRunState;
}

export function StatGridRow({ statKey, run }: StatGridRowProps) {
  const setStat = useRunStore((s) => s.setStat);
  const gt = useGameDataText();
  const def = STAT_DEFINITIONS[statKey];
  const label = gt(`stat.${statKey}.label`, def.label);
  const { glyph, color, icon } = STAT_GLYPH[statKey];
  const value = run.stats[statKey];
  const isBuffed = value > 0;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [iconFailed, setIconFailed] = useState(false);

  function startEditing() {
    setDraft(String(value));
    setEditing(true);
  }

  function commitDraft() {
    const parsed = Number(draft.replace(",", "."));
    if (!Number.isNaN(parsed)) {
      setStat(statKey, Math.max(0, Math.round(parsed * 100) / 100));
    }
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-2 py-[0.5px]">
      {iconFailed ? (
        <span className="w-[11px] text-center block text-[11px]" style={{ color }}>{glyph}</span>
      ) : (
        <img
          src={icon}
          alt=""
          width={11}
          height={11}
          className="object-contain shrink-0 block"
          onError={() => setIconFailed(true)}
        />
      )}
      <span className="flex-1 text-[#e8e8e2]">{label}</span>
      {editing ? (
        <input
          autoFocus
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitDraft();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-14 text-right bg-[#1a1a1f] border border-[#efc84f] rounded text-[#efc84f] outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className={`bg-transparent border-none p-0 cursor-pointer font-normal ${isBuffed ? "text-[#63d16b]" : "text-[#e8e8e2]/45"}`}
        >
          {value}
          {def.unit === "%" ? "%" : ""}
        </button>
      )}
    </div>
  );
}
