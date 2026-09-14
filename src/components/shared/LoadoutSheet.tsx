import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { rem } from "../../config/rem";
import { MAGIC_CATEGORY } from "../../data/magicCategories";
import { optionsByKind, type QuickAddKind } from "../../data/quickAddOptions";
import { STAT_DEFINITIONS } from "../../data/statDefinitions";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import type { RecommenderOption } from "../../engine/scoring";
import type { Rarity, StatKey } from "../../types/game";

/** The gameData translation key for an option's display name — items use their own id, base magics use the bare magic id (option.id is prefixed "magic:"). */
function optionNameKey(option: RecommenderOption): string {
  return option.item ? `item.${option.item.id}.name` : `magic.${option.magicId}.name`;
}

const RARITY_RING: Record<Rarity, string> = {
  common: "rgb(121,119,120)",
  rare: "rgb(47,77,97)",
  epic: "rgb(82,40,90)",
  special: "rgb(107,25,34)",
  legendary: "rgb(161,163,51)",
};

/** The category's own identity color, used as the "owned" ring for items with no per-item accent (magics). */
const RING_BY_KIND: Record<QuickAddKind, string> = {
  artifact: "#efc84f",
  passive: "#1f8f6e",
  magic: "#5fe3c4",
};

interface CategoryChip {
  /** Stable id used for selection state; translated for display via CATEGORY_LABEL_KEY. */
  key: string;
  color: string;
  /** Omitted on the "All" chip. */
  match?: (option: RecommenderOption) => boolean;
}

const ALL_CHIP_COLOR = "rgba(232,232,226,.6)";

const CATEGORY_LABEL_KEY: Record<string, string> = {
  all: "loadoutSheet.categories.all",
  normal: "loadoutSheet.categories.normal",
  rare: "loadoutSheet.categories.rare",
  epic: "loadoutSheet.categories.epic",
  special: "loadoutSheet.categories.special",
  legendary: "loadoutSheet.categories.legendary",
  offensive: "loadoutSheet.categories.offensive",
  utility: "loadoutSheet.categories.utility",
  passive: "loadoutSheet.categories.passive",
};

/** Rarity is the only real grouping the wiki uses for Artifacts. */
const RARITY_CATEGORIES: CategoryChip[] = [
  { key: "all", color: ALL_CHIP_COLOR },
  { key: "normal", color: RARITY_RING.common, match: (o) => o.item?.rarity === "common" },
  { key: "rare", color: RARITY_RING.rare, match: (o) => o.item?.rarity === "rare" },
  { key: "epic", color: RARITY_RING.epic, match: (o) => o.item?.rarity === "epic" },
  { key: "special", color: RARITY_RING.special, match: (o) => o.item?.rarity === "special" },
  { key: "legendary", color: RARITY_RING.legendary, match: (o) => o.item?.rarity === "legendary" },
];

/**
 * The wiki's own 4-way split of the Magic tab: Offensive/Utility come from BASE_MAGICS
 * (see magicCategories.ts). Passive/Special Passive Magics aren't in BASE_MAGICS at all
 * — they're the `kind: "passive"` entries in src/data/passives.ts, which already encodes
 * the wiki's own regular-vs-special split via rarity (regular Passive Magics are
 * "common", Special Passive Magics are "special"). So the Magic sheet's option list
 * merges BASE_MAGICS + PASSIVES (see `options` below) to make all 4 chips real.
 */
const MAGIC_CATEGORIES: CategoryChip[] = [
  { key: "all", color: ALL_CHIP_COLOR },
  { key: "offensive", color: "#5fe3c4", match: (o) => !!o.magicId && MAGIC_CATEGORY[o.magicId] === "offensive" },
  { key: "utility", color: "#6fb4ff", match: (o) => !!o.magicId && MAGIC_CATEGORY[o.magicId] === "utility" },
  { key: "passive", color: "rgb(121,119,120)", match: (o) => o.item?.kind === "passive" && o.item.rarity === "common" },
  { key: "special", color: "rgb(107,25,34)", match: (o) => o.item?.kind === "passive" && o.item.rarity === "special" },
];

/**
 * `option.image` is set (magicSpriteUrl always returns a URL, never undefined) even for
 * the 22 base magics, which have no real sprite in the extracted asset dump — the dev
 * server's SPA fallback returns a 200 (index.html) for that missing path instead of a
 * clean 404, so a plain truthiness check can't catch it; onError can.
 */
function OptionIcon({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span style={{ color: "rgba(232,232,226,.3)", fontSize: 24 }}>?</span>;
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={() => setFailed(true)}
    />
  );
}

function describeOption(option: RecommenderOption, t: TFunction, gt: (key: string, fallback: string) => string): string {
  if (option.item) {
    if (option.item.specialEffect) return gt(`item.${option.item.id}.specialEffect`, option.item.specialEffect);
    const parts = (Object.entries(option.item.stats) as [StatKey, number][])
      .filter(([, value]) => value)
      .map(([key, value]) => `${value > 0 ? "+" : ""}${value}${STAT_DEFINITIONS[key].unit === "%" ? "%" : ""} ${gt(`stat.${key}.label`, STAT_DEFINITIONS[key].label)}`);
    return parts.join(", ") || t("loadoutSheet.noAdditionalEffect");
  }
  return t("loadoutSheet.baseMagicPickup");
}

interface LoadoutSheetProps {
  kind: QuickAddKind;
  onClose: () => void;
}

/** Tapping an icon toggles it straight into/out of the loadout, since the player already knows the category. */
const TITLE_KEY_BY_KIND: Record<QuickAddKind, string> = {
  artifact: "loadoutSheet.titleByKind.artifact",
  passive: "loadoutSheet.titleByKind.passive",
  magic: "loadoutSheet.titleByKind.magic",
};

export function LoadoutSheet({ kind, onClose }: LoadoutSheetProps) {
  const { t } = useTranslation();
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const equipItem = useRunStore((s) => s.equipItem);
  const unequipItem = useRunStore((s) => s.unequipItem);
  const toggleAcquiredMagic = useRunStore((s) => s.toggleAcquiredMagic);

  const categories = kind === "magic" ? MAGIC_CATEGORIES : RARITY_CATEGORIES;
  const [activeKey, setActiveKey] = useState("all");
  const [lastPicked, setLastPicked] = useState<RecommenderOption | null>(null);
  // The Magic sheet covers all 4 wiki categories, so it pulls in Passives too (see MAGIC_CATEGORIES above).
  const options = useMemo(() => (kind === "magic" ? [...optionsByKind("magic"), ...optionsByKind("passive")] : optionsByKind(kind)), [kind]);

  const filtered = useMemo(() => {
    const active = categories.find((c) => c.key === activeKey);
    if (!active?.match) return options;
    return options.filter(active.match);
  }, [options, activeKey, categories]);

  function isOwned(option: RecommenderOption): boolean {
    if (option.magicId) return run.acquiredMagicIds.includes(option.magicId);
    return run.equipped.some((e) => e.itemId === option.item!.id);
  }

  function toggle(option: RecommenderOption) {
    if (option.magicId) {
      toggleAcquiredMagic(option.magicId);
    } else if (option.item) {
      if (isOwned(option)) unequipItem(option.item.id);
      else equipItem(option.item.id);
    }
    setLastPicked(option);
  }

  return (
    <div
      className="animate-ms-slide-up"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "74%",
        background: "#111115",
        borderTop: "1px solid rgba(255,255,255,.12)",
        borderRadius: "14px 14px 0 0",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 -12px 40px rgba(0,0,0,.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 8px", flex: "none" }}>
        <div style={{ fontSize: rem(17), fontWeight: 700, letterSpacing: 0.5, color: "#e8e8e2" }}>{t(TITLE_KEY_BY_KIND[kind])}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("loadoutSheet.closeAria")}
          style={{ background: "none", border: "none", color: "rgba(232,232,226,.6)", fontSize: rem(22), cursor: "pointer", fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif" }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: "0 16px 10px", flex: "none", display: "flex", gap: 8, overflowX: "auto" }}>
        {categories.map((c) => {
          const active = c.key === activeKey;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setActiveKey(c.key)}
              style={{
                flex: "none",
                padding: "7px 14px",
                borderRadius: 999,
                fontFamily: "inherit",
                fontSize: rem(16),
                fontWeight: 700,
                cursor: "pointer",
                background: active ? c.color : "transparent",
                color: active ? "#fff" : "rgba(232,232,226,.6)",
                border: `1px solid ${active ? c.color : "rgba(255,255,255,.14)"}`,
              }}
            >
              {t(CATEGORY_LABEL_KEY[c.key])}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 16px 26px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
          {filtered.map((option) => {
            const owned = isOwned(option);
            const ring = owned ? (option.item ? RARITY_RING[option.item.rarity] : RING_BY_KIND[kind]) : "rgba(255,255,255,.10)";
            const label = gt(optionNameKey(option), option.label);
            return (
              <button
                key={option.id}
                type="button"
                title={label}
                onClick={() => toggle(option)}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  borderRadius: 7,
                  background: "#0d0d10",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  border: `1px solid ${ring}`,
                  overflow: "hidden",
                }}
              >
                {option.image ? <OptionIcon src={option.image} alt={label} /> : <span style={{ color: "rgba(232,232,226,.3)", fontSize: 24 }}>?</span>}
                {owned && (
                  <span style={{ position: "absolute", top: 3, right: 4, width: 7, height: 7, borderRadius: "50%", background: "#63d16b" }} />
                )}
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: "30px 0", textAlign: "center", fontSize: rem(16), color: "rgba(232,232,226,.35)" }}>{t("loadoutSheet.noResults")}</div>
        )}
      </div>

      <div style={{ flex: "none", padding: "10px 16px 18px", borderTop: "1px solid rgba(255,255,255,.07)", background: "#0d0d10" }}>
        <div style={{ fontSize: rem(17), fontWeight: 700, color: "#efc84f" }}>{lastPicked ? gt(optionNameKey(lastPicked), lastPicked.label) : t("loadoutSheet.selectItemPlaceholder")}</div>
        <div style={{ fontSize: rem(15), color: "rgba(232,232,226,.55)" }}>
          {lastPicked ? describeOption(lastPicked, t, gt) : t("loadoutSheet.tapHint")}
        </div>
      </div>
    </div>
  );
}
