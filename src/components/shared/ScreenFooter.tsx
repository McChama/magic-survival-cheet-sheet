import type { ReactNode } from "react";

interface ScreenFooterProps {
  children: ReactNode;
  /** Background/border — screens differ (Subject Select sits on a light background image). */
  className?: string;
}

/**
 * The screen's bottom action zone. Always a normal flex sibling with a 96px floor —
 * NEVER `position: absolute` over the content above it. Class Select and (briefly)
 * Subject Select used an absolute-positioned gradient overlay here, which is exactly what
 * caused the scroll-clipping bug fixed earlier — see CLAUDE.md's Screen layout structure
 * section. Content grows past the floor naturally (Subject Select's name+description+
 * trait+button footer vs. Research's bare button row), so this only enforces the
 * mechanics, not a fixed height.
 */
export function ScreenFooter({ children, className = "" }: ScreenFooterProps) {
  return (
    <div className={`flex-none min-h-[96px] flex flex-col items-center justify-center py-3 px-4 ${className}`}>
      {children}
    </div>
  );
}
