import { uiImage } from "../config/assets";
import type { StatKey } from "../types/game";

/**
 * Per-stat icon + accent color. `icon` is the real in-game status icon (from the APK
 * sprite dump — see public/assets/uiImages/statusIcons/ and research/game-data-sources.md
 * for how the StatusIcon_* -> StatKey mapping was confirmed). `glyph` is the original
 * unicode symbol from the Claude Design canvas handoff, kept as an onError fallback in
 * StatGridRow.tsx rather than deleted, since it's a real fallback path, not dead code.
 */
export const STAT_GLYPH: Record<StatKey, { glyph: string; color: string; icon: string }> = {
  hp: { glyph: "●", color: "#e2495c", icon: uiImage("statusIcons/hp.webp") },
  atk: { glyph: "◆", color: "#5fe3c4", icon: uiImage("statusIcons/atk.webp") },
  hpRegen: { glyph: "✚", color: "#63d16b", icon: uiImage("statusIcons/hpRegen.webp") },
  amplifyAtk: { glyph: "◈", color: "#e88fc0", icon: uiImage("statusIcons/amplifyAtk.webp") },
  lifeOrbRecovery: { glyph: "✦", color: "#e2495c", icon: uiImage("statusIcons/lifeOrbRecovery.webp") },
  magicDamage: { glyph: "✧", color: "#63d16b", icon: uiImage("statusIcons/magicDamage.webp") },
  damageTaken: { glyph: "▼", color: "#6fb4ff", icon: uiImage("statusIcons/damageTaken.webp") },
  magicSize: { glyph: "✺", color: "#f0975a", icon: uiImage("statusIcons/magicSize.webp") },
  evasion: { glyph: "⟁", color: "#9ecfe0", icon: uiImage("statusIcons/evasion.webp") },
  magicDuration: { glyph: "◎", color: "#5fe3c4", icon: uiImage("statusIcons/magicDuration.webp") },
  moveSpeed: { glyph: "◍", color: "#c9b6e8", icon: uiImage("statusIcons/moveSpeed.webp") },
  cooldown: { glyph: "⧖", color: "#e8e8e2", icon: uiImage("statusIcons/cooldown.webp") },
  critRate: { glyph: "✧", color: "#e88fc0", icon: uiImage("statusIcons/critRate.webp") },
  critMultiplier: { glyph: "✷", color: "#f0975a", icon: uiImage("statusIcons/critMultiplier.webp") },
  manaAcquisition: { glyph: "◉", color: "#6fb4ff", icon: uiImage("statusIcons/manaAcquisition.webp") },
  itemPickupRange: { glyph: "✜", color: "#efc84f", icon: uiImage("statusIcons/itemPickupRange.webp") },
  enemyMaxHp: { glyph: "☣", color: "#b57fe8", icon: uiImage("statusIcons/enemyMaxHp.webp") },
};

/**
 * 2-column grid order for the dashboard stat grid, matching the design's row positions:
 * a breathing-room spacer row (both cells `null`) between "All Magic Cooldown" and
 * "Critical Strike Rate", then the grid ends with Item Pickup Range alone in the right
 * column (that trailing lone `null` is intentional, matching the design). The renderer
 * only gives an explicit height to a `null` when BOTH cells of its row are `null` (the
 * real spacer) — a lone `null` next to real content is left as-is, since the grid
 * naturally sizes that row to its real-content sibling anyway.
 */
export const DASHBOARD_STAT_LAYOUT: (StatKey | null)[] = [
  "hp",
  "atk",
  "hpRegen",
  "amplifyAtk",
  "lifeOrbRecovery",
  "magicDamage",
  "damageTaken",
  "magicSize",
  "evasion",
  "magicDuration",
  "moveSpeed",
  "cooldown",
  null,
  null,
  "critRate",
  "enemyMaxHp",
  "critMultiplier",
  "manaAcquisition",
  null,
  "itemPickupRange",
];
