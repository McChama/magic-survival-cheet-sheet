import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FilterChip } from "./FilterChip";
import { magicKindOf } from "../../data/magicCategories";
import { optionsByKind, type QuickAddKind } from "../../data/quickAddOptions";
import { useRunStore } from "../../store/useRunStore";
import { useUiStore } from "../../store/useUiStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { getOwnedMagics } from "../../engine/ownedMagics";
import { getObtainedPassiveIds } from "../../engine/ownedPassives";
import { getEquippedItems } from "../../engine/tierAdaptive";
import { ScreenHeader } from "./ScreenHeader";
import { ScreenTitle } from "./ScreenTitle";
import { ScreenFooter } from "./ScreenFooter";
import { ArtifactOfferModal } from "./ArtifactOfferModal";
import { CARD_ASPECT, CardArt, GridIcon, GridTile } from "./GridCard";
import { GridPanel } from "./GridPanel";
import { MagicPickList } from "./MagicPickList";
import { MAGIC_KIND_COLOR } from "../../config/frameColors";
import { RARITY_RING } from "../../config/rarityColors";
import type { RecommenderOption } from "../../engine/scoring";

/** The gameData translation key for an option's display name — items use their own id, base magics use the bare magic id (option.id is prefixed "magic:"). */
function optionNameKey(option: RecommenderOption): string {
  return option.item ? `item.${option.item.id}.name` : `magic.${option.magicId}.name`;
}

interface CategoryChip {
  /** Stable id used for selection state; translated for display via CATEGORY_LABEL_KEY. */
  key: string;
  color: string;
  /** The label color once the chip is filled with `color` (dark on the white "Active" chip). */
  activeText?: string;
  match: (option: RecommenderOption) => boolean;
}

const CATEGORY_LABEL_KEY: Record<string, string> = {
  normal: "loadoutSheet.categories.normal",
  rare: "loadoutSheet.categories.rare",
  epic: "loadoutSheet.categories.epic",
  special: "loadoutSheet.categories.special",
  legendary: "loadoutSheet.categories.legendary",
  offensive: "loadoutSheet.categories.offensive",
  utility: "loadoutSheet.categories.utility",
  passive: "loadoutSheet.categories.passive",
};

/** Rarity is the only real grouping the wiki uses for Artifacts. No "All" chip: the sheet opens on Normal. */
const RARITY_CATEGORIES: CategoryChip[] = [
  { key: "normal", color: RARITY_RING.common, match: (o) => o.item?.rarity === "common" },
  { key: "rare", color: RARITY_RING.rare, match: (o) => o.item?.rarity === "rare" },
  { key: "epic", color: RARITY_RING.epic, match: (o) => o.item?.rarity === "epic" },
  { key: "special", color: RARITY_RING.special, match: (o) => o.item?.rarity === "special" },
  { key: "legendary", color: RARITY_RING.legendary, match: (o) => o.item?.rarity === "legendary" },
];

/**
 * The wiki's own 4-way split of the Magic tab (Active / Utility from BASE_MAGICS, see magicCategories.ts; regular / special
 * passives from PASSIVES, split by rarity), colored white / blue / green / red like the rows' borders. No "All" chip: it opens on Active.
 */
const MAGIC_CATEGORIES: CategoryChip[] = (["offensive", "utility", "passive", "special"] as const).map((key) => ({
  key,
  color: MAGIC_KIND_COLOR[key],
  activeText: key === "offensive" ? "#0d0d10" : "#fff",
  match: (o: RecommenderOption) => magicKindOf(o) === key,
}));

/** Base magics the "+" menu doesn't list: Intelligence is offered as its passive (a passive with levels like any magic). */
const HIDDEN_BASE_MAGICS = new Set(["intelligence"]);

interface LoadoutSheetProps {
  kind: Exclude<QuickAddKind, "passive">;
  onClose: () => void;
}

const TITLE_KEY_BY_KIND = {
  artifact: "loadoutSheet.titleByKind.artifact",
  magic: "loadoutSheet.titleByKind.magic",
} as const;

/** A treasure chest offers 3 artifacts (the Recommender's normal-chest slot count). */
const OFFER_SIZE = 3;

interface ArtifactPickGridProps {
  options: RecommenderOption[];
  picked: RecommenderOption[];
  onToggle: (option: RecommenderOption) => void;
}

/**
 * The artifacts on the same scrolling panel and rough-bordered 6-per-row cards as Owned Artifact. A picked card has the white
 * border and the zoom. Give it a `key` per rarity so the scroll starts over when the chip changes.
 */
function ArtifactPickGrid({ options, picked, onToggle }: ArtifactPickGridProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  return (
    <GridPanel>
      <div className="grid grid-cols-6 gap-x-[1%] gap-y-1.5">
        {options.map((option) => {
          const item = option.item;
          if (!item) return null;
          const isSelected = picked.some((o) => o.id === option.id);
          const label = gt(optionNameKey(option), option.label);
          return (
            <GridTile
              key={option.id}
              onClick={() => onToggle(option)}
              frame={isSelected ? "#fff" : RARITY_RING[item.rarity]}
              label={label}
              aspect={CARD_ASPECT}
              className={`transition-transform duration-150 ${isSelected ? "scale-110 z-10" : "scale-100"}`}
            >
              <CardArt centered>
                <GridIcon src={item.image} alt={label} />
              </CardArt>
            </GridTile>
          );
        })}
      </div>
      {options.length === 0 && <div className="py-[30px] text-center text-[0.8rem] text-[#e8e8e2]/35">{t("loadoutSheet.noResults")}</div>}
    </GridPanel>
  );
}

/**
 * The full-screen sheet behind the Dashboard's "+" menu — a scrolling catalog of what the run doesn't have yet. **Select Magic**: the game's own rows (`MagicPickList`) — tap one to select it and its Obtain button appears;
 * its level and talent are then managed on Owned Magic. **Select Artifact**: pick the artifacts the game just offered (up to 3, like a
 * chest) on the same rough-bordered cards as Owned Artifact, filtered by rarity (Normal first); the third opens the Treasure
 * Chest window (`ArtifactOfferModal`) — or the button does, with fewer — where the one the player took is chosen and obtained
 * (and the sheet stays open). While it's open the floating Magic Circle bubble hides.
 */
export function LoadoutSheet({ kind, onClose }: LoadoutSheetProps) {
  const { t } = useTranslation("translation");
  const run = useRunStore((s) => s.run);
  const equipItem = useRunStore((s) => s.equipItem);
  const setHideMagicCircleBubble = useUiStore((s) => s.setHideMagicCircleBubble);

  useEffect(() => {
    setHideMagicCircleBubble(true);
    return () => setHideMagicCircleBubble(false);
  }, [setHideMagicCircleBubble]);

  const categories = kind === "magic" ? MAGIC_CATEGORIES : RARITY_CATEGORIES;
  const [activeKey, setActiveKey] = useState(kind === "artifact" ? "normal" : "offensive");
  const [picked, setPicked] = useState<RecommenderOption[]>([]);
  const [offerOpen, setOfferOpen] = useState(false);
  // The catalog is what the run doesn't have yet: obtained magics, passives and artifacts leave it. The Magic sheet covers all 4
  // wiki categories, so it pulls in Passives too (see MAGIC_CATEGORIES above).
  const ownedMagicIds = getOwnedMagics(run).map((m) => m.magicId).join("|");
  const obtainedPassives = [...getObtainedPassiveIds(run)].join("|");
  const ownedItemIds = getEquippedItems(run).map((i) => i.id).join("|");
  const options = useMemo(() => {
    if (kind === "artifact") {
      const owned = new Set(ownedItemIds.split("|"));
      return optionsByKind("artifact").filter((o) => !owned.has(o.item!.id));
    }
    const magics = new Set(ownedMagicIds.split("|"));
    const passives = new Set(obtainedPassives.split("|"));
    return [...optionsByKind("magic"), ...optionsByKind("passive")].filter((o) =>
      o.magicId ? !magics.has(o.magicId) && !HIDDEN_BASE_MAGICS.has(o.magicId) : !passives.has(o.item!.id),
    );
  }, [kind, ownedMagicIds, obtainedPassives, ownedItemIds]);

  const filtered = useMemo(() => {
    const active = categories.find((c) => c.key === activeKey);
    return active ? options.filter(active.match) : options;
  }, [options, activeKey, categories]);

  function togglePick(option: RecommenderOption) {
    const has = picked.some((o) => o.id === option.id);
    if (!has && picked.length >= OFFER_SIZE) return;
    const next = has ? picked.filter((o) => o.id !== option.id) : [...picked, option];
    setPicked(next);
    if (!has && next.length === OFFER_SIZE) setOfferOpen(true);
  }

  const offeredItems = picked.flatMap((option) => (option.item ? [option.item] : []));

  return (
    <div className="animate-ms-slide-up absolute inset-0 z-30 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onClose} actionAria={t("loadoutSheet.closeAria")} />
      <ScreenTitle>{t(TITLE_KEY_BY_KIND[kind])}</ScreenTitle>

      <div className="px-4 pb-2.5 flex-none flex flex-wrap justify-center gap-1.5">
        {categories.map((c) => {
          const active = c.key === activeKey;
          return (
            <FilterChip key={c.key} active={active} color={c.color} activeText={c.activeText ?? "#fff"} onClick={() => setActiveKey(c.key)} className="flex-none py-[6px] px-3 text-[0.75rem]">
              {t(CATEGORY_LABEL_KEY[c.key])}
            </FilterChip>
          );
        })}
      </div>

      {kind === "magic" ? (
        <MagicPickList key={activeKey} options={filtered} />
      ) : (
        <>
          <ArtifactPickGrid key={activeKey} options={filtered} picked={picked} onToggle={togglePick} />
          <ScreenFooter className="gap-1">
            <div className="text-[0.75rem] text-[#e8e8e2]/55">{t("loadoutSheet.offerHint", { count: OFFER_SIZE })}</div>
            <button
              type="button"
              disabled={picked.length === 0}
              onClick={() => setOfferOpen(true)}
              className={`bg-transparent border-none font-magic text-[1.5rem] cursor-pointer ${picked.length > 0 ? "text-[#e8e8e2]" : "text-[#e8e8e2]/30"}`}
            >
              {t("loadoutSheet.showOfferBtn", { count: picked.length })}
            </button>
          </ScreenFooter>
        </>
      )}

      {offerOpen && offeredItems.length > 0 && (
        <ArtifactOfferModal
          items={offeredItems}
          onClose={() => setOfferOpen(false)}
          onObtain={(item) => {
            // Stay on Select Artifact: the obtained one leaves the catalog, the sheet is ready for the next offer.
            equipItem(item.id);
            setPicked([]);
            setOfferOpen(false);
          }}
        />
      )}
    </div>
  );
}
