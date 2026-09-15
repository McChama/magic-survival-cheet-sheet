import type { CSSProperties, ReactNode } from "react";

interface ScreenTitleProps {
  children: ReactNode;
  /** Rare per-screen override (e.g. Subject Select's dark-on-light color + text-shadow). */
  style?: CSSProperties;
}

/**
 * Fixed 48px title zone shared by every non-home screen: one line, 1.75rem, regular
 * weight (never bold — screens used to range from 1.7rem to 2.1rem, some bold some not,
 * for what is conceptually the same "screen name" role). See CLAUDE.md's Screen layout
 * structure section.
 */
export function ScreenTitle({ children, style }: ScreenTitleProps) {
  return (
    <div
      className="flex-none h-12 px-4 flex items-center justify-center font-magic text-[1.75rem] font-normal text-center text-[#e8e8e2]"
      style={style}
    >
      {children}
    </div>
  );
}
