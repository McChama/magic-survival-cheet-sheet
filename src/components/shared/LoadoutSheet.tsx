import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FilterChip } from "./FilterChip";
import type { TFunction } from "i18next";
import { MAGIC_CATEGORY } from "../../data/magicCategories";
import { getMagicLevel, TALENT_OPTIONS_BY_MAGIC_ID } from "../../data/fusions";
import { optionsByKind, type QuickAddKind } from "../../data/quickAddOptions";
import { STAT_DEFINITIONS } from "../../data/statDefinitions";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { uiImage } from "../../config/assets";
import { ScreenHeader } from "./ScreenHeader";
import { RARITY_RING } from "../../config/rarityColors";
import type { RecommenderOption } from "../../engine/scoring";
import type { StatKey } from "../../types/game";

/** The gameData translation key for an option's display name — items use their own id, base magics use the bare magic id (option.id is prefixed "magic:"). */
function optionNameKey(option: RecommenderOption): string {
  return option.item ? `item.${option.item.id}.name` : `magic.${option.magicId}.name`;
}

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

interface MagicLevelTalentTrackerProps {
  magicId: string;
  level: number;
  talent: string | null;
  onLevelChange: (level: number) => void;
  onTalentChange: (talent: string | null) => void;
}

/**
 * Lets the player record a currently-acquired magic's level and (real, extracted) talent
 * branch, so the synergy engine can match fusion ingredients precisely instead of just
 * "you own this magic." Level has no upper bound — the real in-game max level isn't
 * datamined anywhere in this repo (unlike Class Level's known 1-5), so this is a plain
 * stepper, not a fixed pip row like `ClassSelectScreen.tsx`'s. Talent chips only render
 * for names `TALENT_OPTIONS_BY_MAGIC_ID` actually has real data for — a magic with 0 or 1
 * known talent name shows that many chips, never a padded-out fake 3-way choice.
 */
function MagicLevelTalentTracker({ magicId, level, talent, onLevelChange, onTalentChange }: MagicLevelTalentTrackerProps) {
  const { t } = useTranslation("translation");
  const talentOptions = TALENT_OPTIONS_BY_MAGIC_ID[magicId] ?? [];

  return (
    <div className="flex flex-col items-center gap-1.5 pt-1">
      <div className="flex items-center gap-3">
        <span className="text-[0.7rem] text-[#e8e8e2]/55">{t("loadoutSheet.magicLevelLabel")}</span>
        <button
          type="button"
          disabled={level <= 1}
          onClick={() => onLevelChange(level - 1)}
          aria-label={t("loadoutSheet.magicLevelDownAria")}
          className="w-3 h-3 bg-transparent border-none p-0 cursor-pointer disabled:opacity-25 disabled:cursor-default"
        >
          <img src={uiImage("icons/UI_AreaMove_L.png")} alt="" className="w-full h-full object-contain" />
        </button>
        <span className="font-magic text-[0.95rem] text-[#e8e8e2] w-4 text-center">{level}</span>
        <button
          type="button"
          onClick={() => onLevelChange(level + 1)}
          aria-label={t("loadoutSheet.magicLevelUpAria")}
          className="w-3 h-3 bg-transparent border-none p-0 cursor-pointer"
        >
          <img src={uiImage("icons/UI_AreaMove_R.png")} alt="" className="w-full h-full object-contain" />
        </button>
      </div>
      {talentOptions.length > 0 && (
        <div className="flex gap-1.5 flex-wrap justify-center">
          {talentOptions.map((name) => {
            const active = talent === name;
            return (
              <FilterChip key={name} active={active} color="#5fe3c4" activeText="#0d0d10" onClick={() => onTalentChange(active ? null : name)} className="flex-none py-[3px] px-2.5 text-[0.68rem]">
                {name}
              </FilterChip>
            );
          })}
        </div>
      )}
    </div>
  );
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
  const setMagicLevel = useRunStore((s) => s.setMagicLevel);
  const setMagicTalent = useRunStore((s) => s.setMagicTalent);

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
            <FilterChip key={c.key} active={active} color={c.color} activeText="#fff" onClick={() => setActiveKey(c.key)} className="flex-none py-[7px] px-3.5 text-[0.8rem]">
              {t(CATEGORY_LABEL_KEY[c.key])}
            </FilterChip>
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
                className={`relative aspect-square rounded-[7px] bg-[#0d0d10] cursor-pointer flex items-center justify-center p-0 overflow-hidden transition-transform duration-150 ${isSelected ? "scale-110 border-2 border-white" : "scale-100 border"}`}
                style={isSelected ? undefined : { borderColor: ring }}
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
        {lastPicked?.magicId && isOwned(lastPicked) && (
          <MagicLevelTalentTracker
            magicId={lastPicked.magicId}
            level={getMagicLevel(run.magicLevels, lastPicked.magicId)}
            talent={run.magicTalents[lastPicked.magicId] ?? null}
            onLevelChange={(level) => setMagicLevel(lastPicked.magicId!, level)}
            onTalentChange={(talent) => setMagicTalent(lastPicked.magicId!, talent)}
          />
        )}
      </div>
    </div>
  );
}
