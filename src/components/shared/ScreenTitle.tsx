import type { ReactNode } from "react";

interface ScreenTitleProps {
  children: ReactNode;
  /** Named color of the title: the default off-white, the gold the real game uses on its
   *  Owned Magic / Owned Artifact / Synergy screens, or the dark teal + soft light shadow Subject Select
   *  needs over its light background, or the hot pink of the Magic Combination screen. */
  tone?: "default" | "gold" | "dark" | "pink";
}

const TONE_CLASS = {
  default: "text-[#e8e8e2]",
  gold: "text-[#efc84f]",
  dark: "text-[#16333a] [text-shadow:0_1px_0_rgba(255,255,255,.25)]",
  pink: "text-[#f85888]",
} as const;

/**
 * Fixed 48px title zone shared by every non-home screen: one line, 1.75rem, regular
 * weight (never bold — screens used to range from 1.7rem to 2.1rem, some bold some not,
 * for what is conceptually the same "screen name" role). See CLAUDE.md's Screen layout
 * structure section.
 */
export function ScreenTitle({ children, tone = "default" }: ScreenTitleProps) {
  return (
    <div className={`flex-none h-12 px-4 flex items-center justify-center font-magic text-[1.75rem] font-normal text-center ${TONE_CLASS[tone]}`}>
      {children}
    </div>
  );
}
