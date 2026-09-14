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
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5px 0" }}>
      {iconFailed ? (
        <span style={{ color, fontSize: 11, width: 11, textAlign: "center", display: "block" }}>{glyph}</span>
      ) : (
        <img
          src={icon}
          alt=""
          width={11}
          height={11}
          style={{ objectFit: "contain", flexShrink: 0, display: "block" }}
          onError={() => setIconFailed(true)}
        />
      )}
      <span style={{ flex: 1, color: "#e8e8e2" }}>{label}</span>
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
          style={{ width: 56, textAlign: "right", background: "#1a1a1f", border: "1px solid #efc84f", borderRadius: 4, color: "#efc84f", outline: "none" }}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontWeight: isBuffed ? 700 : 400,
            color: isBuffed ? "#63d16b" : "rgba(232,232,226,.45)",
          }}
        >
          {value}
          {def.unit === "%" ? "%" : ""}
        </button>
      )}
    </div>
  );
}
