interface PipDotProps {
  filled: boolean;
  /** Width/height classes, e.g. `w-[6px] h-[6px]`. */
  size: string;
  /** Background class of the dot while filled, e.g. `bg-[#efe18a]`. */
  fill: string;
}

/** One level dot in a row (Class Select's stepper, Research's nodes): outlined when empty, filled when reached. */
export function PipDot({ filled, size, fill }: PipDotProps) {
  return <span className={`rounded-full border border-[#e8e8e2]/45 ${size} ${filled ? fill : "bg-transparent"}`} />;
}
