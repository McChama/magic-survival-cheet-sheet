import type { ReactNode } from "react";

interface FilterChipProps {
  active: boolean;
  /** The chip's fill/border color while active (a per-chip runtime value, so it is the one thing set inline). */
  color: string;
  /** Text color on that fill: the dark ink on light fills, white on saturated ones. */
  activeText: string;
  onClick: () => void;
  /** Size and layout (`flex-1` / `flex-none`, padding, font size) — the shape is shared, the sizing varies per bar. */
  className?: string;
  children: ReactNode;
}

/** A pill in a row of filters/tabs: outlined and dim while inactive, filled with its `color` while active. */
export function FilterChip({ active, color, activeText, onClick, className = "", children }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border font-[inherit] cursor-pointer ${active ? "" : "bg-transparent border-white/[.14] text-[#e8e8e2]/60"} ${className}`}
      style={active ? { backgroundColor: color, borderColor: color, color: activeText } : undefined}
    >
      {children}
    </button>
  );
}
