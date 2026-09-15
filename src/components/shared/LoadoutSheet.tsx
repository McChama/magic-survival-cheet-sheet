import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { MAGIC_CATEGORY } from "../../data/magicCategories";
import { optionsByKind, type QuickAddKind } from "../../data/quickAddOptions";
import { STAT_DEFINITIONS } from "../../data/statDefinitions";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { ScreenHeader } from "./ScreenHeader";
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
  if (failed) return <span className="text-[#e8e8e2]/30 text-2xl">?</span>;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-full h-full object-cover"
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
  const { t } = useTranslation("translation");
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
    <div className="animate-ms-slide-up absolute left-0 right-0 bottom-0 h-[74%] bg-[#111115] border-t border-white/10 rounded-t-[14px] flex flex-col shadow-[0_-12px_40px_rgba(0,0,0,.6)]">
      <ScreenHeader
        leftSlot={<div className="text-[0.85rem] tracking-wide text-[#e8e8e2] pl-2">{t(TITLE_KEY_BY_KIND[kind])}</div>}
        onAction={onClose}
        actionAria={t("loadoutSheet.closeAria")}
      />

      <div className="px-4 pb-2.5 flex-none flex gap-2 overflow-x-auto">
        {categories.map((c) => {
          const active = c.key === activeKey;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setActiveKey(c.key)}
              className="flex-none py-[7px] px-3.5 rounded-full font-[inherit] text-[0.8rem] cursor-pointer"
              style={{
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

      <div className="flex-1 overflow-y-auto py-1.5 px-4 pb-[26px]">
        <div className="grid grid-cols-5 gap-2.5">
          {filtered.map((option) => {
            const owned = isOwned(option);
            const isSelected = lastPicked?.id === option.id;
            const ring = owned ? (option.item ? RARITY_RING[option.item.rarity] : RING_BY_KIND[kind]) : "rgba(255,255,255,.10)";
            const label = gt(optionNameKey(option), option.label);
            return (
              <button
                key={option.id}
                type="button"
                title={label}
                onClick={() => toggle(option)}
                className={`relative aspect-square rounded-[7px] bg-[#0d0d10] cursor-pointer flex items-center justify-center p-0 overflow-hidden transition-transform duration-150 ${isSelected ? "scale-110" : "scale-100"}`}
                style={{ border: isSelected ? "2px solid #fff" : `1px solid ${ring}` }}
              >
                {option.image ? <OptionIcon src={option.image} alt={label} /> : <span className="text-[#e8e8e2]/30 text-2xl">?</span>}
                {owned && (
                  <span className="absolute top-[3px] right-1 w-[7px] h-[7px] rounded-full bg-[#63d16b]" />
                )}
              </button>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="py-[30px] text-center text-[0.8rem] text-[#e8e8e2]/35">{t("loadoutSheet.noResults")}</div>
        )}
      </div>

      <div className="flex-none py-2.5 px-4 pb-[18px] border-t border-white/[.07] bg-[#0d0d10]">
        <div className="text-[0.85rem] text-[#efc84f]">{lastPicked ? gt(optionNameKey(lastPicked), lastPicked.label) : t("loadoutSheet.selectItemPlaceholder")}</div>
        <div className="text-[0.75rem] text-[#e8e8e2]/55">
          {lastPicked ? describeOption(lastPicked, t, gt) : t("loadoutSheet.tapHint")}
        </div>
      </div>
    </div>
  );
}
