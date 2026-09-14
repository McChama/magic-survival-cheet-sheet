import { useState } from "react";
import { rem } from "../../config/rem";

interface CounterFieldProps {
  text: string;
  color: string;
  value: number;
  onChange: (value: number) => void;
  fontSize?: number;
}

export function CounterField({ text, color, value, onChange, fontSize = 19 }: CounterFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  function commit() {
    const parsed = Number(draft);
    if (!Number.isNaN(parsed)) onChange(Math.max(0, Math.round(parsed)));
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        style={{ width: 70, textAlign: "center", background: "#1a1a1f", border: `1px solid ${color}`, borderRadius: 4, color, fontSize: rem(fontSize), fontWeight: 700, outline: "none" }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color, fontSize: rem(fontSize), fontWeight: 700 }}
    >
      {text}
    </button>
  );
}
