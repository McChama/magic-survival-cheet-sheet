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
        className="w-[70px] text-center bg-[#1a1a1f] rounded outline-none"
        style={{ border: `1px solid ${color}`, color, fontSize: rem(fontSize) }}
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
      className="bg-transparent border-none p-0 cursor-pointer"
      style={{ color, fontSize: rem(fontSize) }}
    >
      {text}
    </button>
  );
}
