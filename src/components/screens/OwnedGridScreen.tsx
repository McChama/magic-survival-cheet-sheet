import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { BASE_MAGIC_BY_ID, MAGIC_DESCRIPTION, baseMagicSpriteUrl, getMagicMaxLevel } from "../../data/magics";
import { MAGIC_TALENTS_BY_MAGIC_ID, TALENT_TYPE_COLOR, getMagicTalentGroups } from "../../data/magicTalents";
import { MAGIC_BASE_STATS, MAGIC_STATS, MAGIC_STAT_LABEL, formatMagicStat } from "../../data/magicStats";
import { magicDamageMultiplier } from "../../engine/magicDamage";
import { applyMagicEffects, collectMagicEffects } from "../../engine/magicEffects";
import { getRunStats } from "../../engine/runStats";
import { PASSIVE_EFFECT_LINES } from "../../data/passiveEffects";
import { STAT_DEFINITIONS } from "../../data/statDefinitions";
import { classImage } from "../../config/assets";
import { getClassLevel, getClassMagicProgression } from "../../data/classes";
import { PASSIVES } from "../../data/passives";
import { getOwnedMagics } from "../../engine/ownedMagics";
import { getEquippedItems } from "../../engine/tierAdaptive";
import { detectSynergies, type SynergySignal } from "../../engine/synergy";
import { useRunStore } from "../../store/useRunStore";
import { slug as classSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";
import { RARITY_RING } from "../../config/rarityColors";
import { BOOST_SIGNAL_TIER_COLOR } from "../../config/tierColors";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { ClassBonusDetail } from "../shared/ClassBonusDetail";
import { DetailModal } from "../shared/DetailModal";
import { GameText } from "../shared/GameText";
import { GridPanel } from "../shared/GridPanel";
import { MaskedSprite } from "../shared/MaskedSprite";
import { StripFrame } from "../shared/StripFrame";
import type { EquippableItem, MagicTalentDefinition, StatKey } from "../../types/game";

const RARITY_LABEL_KEY: Record<EquippableItem["rarity"], string> = {
  common: "normal",
  rare: "rare",
  epic: "epic",
  special: "special",
  legendary: "legendary",
};

// Border colors sampled from a real in-game Owned Magic screenshot (Bishop, 2026-09-20).
// They vary per card (and per rarity), so they reach the frame as a tint value.
const CLASS_FRAME = "#fff"; // always plain white on this screen, whatever the class level
const ACTIVE_MAGIC_FRAME = "#2d5fae"; // dark blue — real game frames active/base-magic slots in blue.
const SPECIAL_FRAME = "#9a1c38"; // dark red frame of a class's named special ability.

/** Real game spell-slot cards are tall portrait rectangles: measured off a real in-game
 *  Owned Magic screenshot, 108px wide x 205px tall (~1:1.9). Every inner offset below (icon
 *  size/position, pip size/position) is likewise a percentage of that measured card, via
 *  container-query units (`cqw`/`cqh` — `GridTile` is `container-type: size`), so the card
 *  looks the same at any screen width. */
const CARD_ASPECT = "aspect-[108/205]";

/** One level pip: filled = reached, hollow = not yet. Yellow for active magics (passives use
 *  green in the real game); every pip of a magic that has reached its max level is green. */
function Pip({ filled, maxed, size }: { filled: boolean; maxed: boolean; size: string }) {
  const border = maxed ? "border-[#3fdc5a]" : "border-[#e3e01c]";
  const fill = !filled ? "bg-transparent" : maxed ? "bg-[#3fdc5a]" : "bg-[#e3e01c]";
  return <span className={`rounded-full border box-border flex-none ${size} ${fill} ${border}`} />;
}

/** One pip per level the magic really has (`getMagicMaxLevel`, from the game's own max-level
 *  column) — not a fixed count. Pip size/spacing measured off the real screenshot. */
function LevelPips({ level, max }: { level: number; max: number }) {
  return (
    <span className="absolute inset-x-0 bottom-[13cqh] flex items-center justify-center gap-[4cqw]">
      {Array.from({ length: max }, (_, i) => (
        <Pip key={i} filled={i < level} maxed={level >= max} size="w-[6.5cqw] h-[6.5cqw]" />
      ))}
    </span>
  );
}

/** A special ability's marker where an active magic shows its level pips: same row, but a
 *  star noticeably bigger than a pip (a star reads much smaller than a circle of the same box). */
function StarIcon({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`flex-none fill-[#ff3c64] ${size}`}>
      <polygon points="12,1 15,9 23,9 16.5,14 19,23 12,17.5 5,23 7.5,14 1,9 9,9" />
    </svg>
  );
}

function SpecialStar() {
  return (
    <span className="absolute inset-x-0 bottom-[13cqh] h-[6.5cqw] flex items-center justify-center">
      <StarIcon size="w-[20cqw] h-[20cqw]" />
    </span>
  );
}

/** Positions a card's icon where the real game does: its visible art ~54% of the card's
 *  width (the sprites carry transparent margins, so the box is 64%), centered ~41% down the
 *  card's height. A card with no level row under it (the class tile) centers its icon
 *  vertically instead. */
function CardArt({ children, centered }: { children: React.ReactNode; centered?: boolean }) {
  const pos = centered ? "top-1/2 -translate-y-1/2" : "top-[24cqh]";
  return <span className={`absolute left-1/2 -translate-x-1/2 ${pos} w-[64cqw] aspect-square flex items-center justify-center`}>{children}</span>;
}

/** `image` for base magics is a real URL but has no real sprite for most (see data/magics.ts) — same "?" fallback used everywhere else. */
function GridIcon({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-[#e8e8e2]/30 text-2xl">?</span>;
  return <img src={src} alt={alt} loading="lazy" className="w-full h-full object-contain" onError={() => setFailed(true)} />;
}

/** Active-magic tile art, masked to flat white (per the reference screenshots) instead of the
 *  sprite's own colors. A hidden probe <img> catches a missing sprite, since a mask-image never
 *  fires a load error. */
function MaskedMagicIcon({ src, alt, full }: { src: string; alt: string; full?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-[#e8e8e2]/30 text-2xl">?</span>;
  return (
    <>
      <MaskedSprite src={src} label={alt} className={`block bg-white ${full ? "w-full h-full" : "w-[70%] h-[70%]"}`} />
      <img src={src} alt="" className="hidden" onError={() => setFailed(true)} />
    </>
  );
}

/** A class's named special ability (Guardian Angel, Doctor, ...) is a real passive in
 *  `data/passives.ts` with its own sprite — matched by name. A special with no matching
 *  passive falls back to a star glyph rather than inventing art. */
const PASSIVE_BY_NAME: Record<string, EquippableItem> = Object.fromEntries(PASSIVES.map((p) => [p.name, p]));

function SpecialGlyph({ name }: { name: string }) {
  const passive = PASSIVE_BY_NAME[name];
  if (!passive) return <span className="text-[#f0603c] text-3xl leading-none">★</span>;
  return <MaskedMagicIcon src={passive.image} alt={name} full />;
}

interface GridTileProps {
  onClick: () => void;
  frame: string;
  label: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  aspect?: string;
}

/** Every card shares one black background — only the border color (`frame`) varies. */
function GridTile({ onClick, frame, label, children, badge, aspect = "aspect-square" }: GridTileProps) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`relative ${aspect} bg-black cursor-pointer flex items-center justify-center p-0 overflow-hidden [container-type:size]`}
    >
      {children}
      {badge}
      <StripFrame tint={frame} />
    </button>
  );
}

/**
 * Everything the run has: the class icon, then one tile per base magic (the ones the Class grants at
 * their class-derived level, then the ones added with the "+" button at the level and talent the
 * player recorded — `getOwnedMagics`), then one tile per named special ability (Guardian Angel,
 * Doctor, ...) the Class unlocks. See `getClassMagicProgression` in `data/classes.ts` for the
 * class-side derivation. The class tile opens the class's bonus breakdown, a magic tile its own
 * detail, a special its effect lines.
 */
type MagicSelection =
  | { kind: "class" }
  | { kind: "magic"; magicId: string; level: number }
  | { kind: "special"; name: string };

/** A talent's icon in the row at the bottom of a magic's modal: the magic's own icon, small, in
 *  the talent's category color (`TALENT_TYPE_COLOR`) at the game's 25% opacity — full opacity when it is the
 *  talent the player took (`chosen`, like the game's lit talent) — and plain white while its panel is open.
 *  No text — tapping it opens the talent's panel. */
function TalentIcon({ src, talent, selected, chosen, onSelect }: { src: string; talent: MagicTalentDefinition; selected: boolean; chosen: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-label={talent.name}
      aria-pressed={selected}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`w-[9cqw] aspect-square p-0 bg-transparent border-none cursor-pointer transition-opacity duration-150 ${selected || chosen ? "opacity-100" : "opacity-25"}`}
    >
      <MaskedSprite src={src} tint={selected ? "#fff" : TALENT_TYPE_COLOR[talent.type]} className="block w-full h-full" />
    </button>
  );
}

/** The panel that opens over a magic's modal when one of its talents is tapped: the talent's
 *  name, the level it unlocks at, and its real description lines in their real colors. It has
 *  no close button — tapping anywhere outside it closes just this panel (see `MagicDetail`). */
function TalentPanel({ talent, t }: { talent: MagicTalentDefinition; t: (key: string, options?: Record<string, unknown>) => string }) {
  return (
    <div
      className="absolute inset-x-0 top-[49%] min-h-[36%] bg-black flex flex-col items-center justify-center gap-1.5 text-center px-3 py-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="font-magic text-[1.3rem] text-white">{talent.name}</div>
      <GameText text={t("ownedMagic.talentUnlockLevel", { level: talent.level })} color="#32FFE1" className="text-[0.75rem]" />
      <div className="flex flex-col gap-0.5 mt-1 text-[0.75rem]">
        {talent.lines.map((line, i) => (
          <GameText key={i} text={line.text} color={line.color} />
        ))}
      </div>
    </div>
  );
}

/** An active magic's detail, laid out like the real game's: the icon with no frame, its name,
 *  level pips, its real one-line description, a compact two-column stats table (stat on the left,
 *  value in gold on the right) and, pinned to the bottom, one row of small talent icons (every
 *  talent level together, a wider gap between levels). Tapping a talent opens its description
 *  panel; tapping anywhere outside the panel closes only the panel.
 *  The rows are the magic's real stat list (`MAGIC_STATS`, from the game's own detail screen) with
 *  its level-1 values (`MAGIC_BASE_STATS`, the constants the game sets at battle start); Damage is
 *  that constant scaled by your dashboard ATK / Amplify ATK / All Magic Damage and the magic's
 *  permanent bonuses (`engine/magicDamage.ts`); Number and Cooldown also follow the magic's level-ups,
 *  class and artifacts (`engine/magicEffects.ts`); and a value that couldn't be decoded reads "—". */
function MagicDetail({ magicId, level, talent, chosenTalent, onTalentChange, gt, t }: { magicId: string; level: number; talent: MagicTalentDefinition | null; chosenTalent: string | null; onTalentChange: (name: string | null) => void; gt: (key: string, fallback: string) => string; t: (key: string, options?: Record<string, unknown>) => string }) {
  const magic = BASE_MAGIC_BY_ID[magicId];
  const label = gt(`magic.${magicId}.name`, magic?.name ?? magicId);
  const max = getMagicMaxLevel(magicId);
  const stats = MAGIC_STATS[magicId] ?? [];
  const talentGroups = getMagicTalentGroups(magicId);
  const icon = baseMagicSpriteUrl(magicId);
  const run = useRunStore((st) => st.run);
  const damageMultiplier = magicDamageMultiplier(magicId, level, run);
  const effects = collectMagicEffects(magicId, level, run);
  const globalStats = getRunStats(run);
  return (
    <div className="relative flex flex-col items-center text-center gap-2 min-h-full" onClick={() => talent && onTalentChange(null)}>
      <DetailHero
        icon={icon}
        alt={label}
        name={label}
        levelRow={Array.from({ length: max }, (_, i) => (
          <Pip key={i} filled={i < level} maxed={level >= max} size="w-[6px] h-[6px]" />
        ))}
      />
      {MAGIC_DESCRIPTION[magicId] && <GameText text={MAGIC_DESCRIPTION[magicId]} color="#EBEBEB" className="text-[0.8rem]" />}

      {stats.length > 0 && (
        <div className="grid grid-cols-[auto_auto] gap-x-10 gap-y-0.5 text-left mt-2 text-[0.8rem]">
          {stats.map((stat) => (
            <Fragment key={stat}>
              <span className="text-[#e8e8e2]">{gt(`magicStat.${stat}.label`, MAGIC_STAT_LABEL[stat])}</span>
              <span className="text-right text-[#efc84f]">{formatMagicStat(applyMagicEffects(MAGIC_BASE_STATS[magicId]?.[stat], stat, effects, globalStats, magicId), damageMultiplier) ?? t("ownedMagic.statUnknown")}</span>
            </Fragment>
          ))}
        </div>
      )}

      {talentGroups.length > 0 && (
        <div className="mt-auto flex items-center justify-center gap-[5cqw] pb-1">
          {talentGroups.map((group) => (
            <div key={group.level} className="flex items-center gap-[1cqw]">
              {group.talents.map((tal) => (
                <TalentIcon key={tal.name} src={icon} talent={tal} selected={talent?.name === tal.name} chosen={chosenTalent === tal.name} onSelect={() => onTalentChange(talent?.name === tal.name ? null : tal.name)} />
              ))}
            </div>
          ))}
        </div>
      )}

      {talent && <TalentPanel talent={talent} t={t} />}
    </div>
  );
}

/** The top of every active-magic-style modal: the unframed white icon, the name, and a row where
 *  the level goes (level pips for a magic, a star for a special ability). */
function DetailHero({ icon, alt, name, levelRow }: { icon: string; alt: string; name: string; levelRow: React.ReactNode }) {
  return (
    <>
      <div className="w-[24%] aspect-square mt-[12cqh] flex items-center justify-center">
        <MaskedMagicIcon src={icon} alt={alt} full />
      </div>
      <div className="font-magic text-[1.2rem] text-[#e8e8e2]">{name}</div>
      <div className="flex items-center gap-[3px] h-[6px]">{levelRow}</div>
    </>
  );
}

/** A class special ability's detail (Guardian Angel, Doctor, ...), laid out like a magic's: the
 *  unframed icon, the name, a star where a magic shows its level, then every effect line the game
 *  shows for it, each in its real color (`PASSIVE_EFFECT_LINES` — e.g. Guardian Angel's revive line
 *  plus its green "Increase Max HP by 30%"). */
function SpecialDetail({ passive, gt }: { passive: EquippableItem; gt: (key: string, fallback: string) => string }) {
  const label = gt(`item.${passive.id}.name`, passive.name);
  const lines = PASSIVE_EFFECT_LINES[passive.id] ?? [];
  return (
    <div className="relative flex flex-col items-center text-center gap-2 min-h-full">
      <DetailHero icon={passive.image} alt={label} name={label} levelRow={<StarIcon size="w-[14px] h-[14px]" />} />
      <div className="flex flex-col gap-1 mt-1 text-[0.8rem]">
        {lines.map((line, i) => (
          <GameText key={i} text={line.text} color={line.color} />
        ))}
      </div>
    </div>
  );
}

export function OwnedMagicScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const characterClass = useRunStore((s) => s.run.meta.characterClass);
  const classLevels = useRunStore((s) => s.run.meta.classLevels);
  const run = useRunStore((s) => s.run);
  const [selected, setSelected] = useState<MagicSelection | null>(null);
  // The talent panel open over a magic's modal (by name). Lives here, not in MagicDetail, so a tap
  // on the modal's backdrop can close just that panel before it would close the whole modal.
  const [talentName, setTalentName] = useState<string | null>(null);
  const openTalent = selected?.kind === "magic" && talentName ? (MAGIC_TALENTS_BY_MAGIC_ID[selected.magicId] ?? []).find((tal) => tal.name === talentName) ?? null : null;
  function closeModal() {
    setSelected(null);
    setTalentName(null);
  }

  const classLevel = characterClass ? getClassLevel(classLevels, characterClass) : 1;
  const magics = getOwnedMagics(run);
  const { specials } = characterClass ? getClassMagicProgression(characterClass, classLevel) : { specials: [] };
  const classLabel = characterClass ? gt(`class.${classSlug(characterClass)}.name`, characterClass) : null;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onClose} actionAria={t("ownedMagic.closeAria")} />
      <ScreenTitle tone="gold">{t("ownedMagic.title")}</ScreenTitle>

      <GridPanel>
        {!characterClass && magics.length === 0 ? (
          <div className="py-[30px] text-center text-[0.8rem] text-[#e8e8e2]/35">{t("ownedMagic.empty")}</div>
        ) : (
          <div className="grid grid-cols-6 gap-x-[1%] gap-y-1.5">
            {characterClass && (
              <GridTile onClick={() => setSelected({ kind: "class" })} frame={CLASS_FRAME} label={classLabel ?? characterClass} aspect={CARD_ASPECT}>
                <CardArt centered>
                  {/* Plain white on this screen whatever the class level (the real game doesn't tint it here; Class Select does). */}
                  <MaskedSprite src={classImage(`${classSlug(characterClass)}.png`)} label={classLabel ?? characterClass} className="block w-full h-full bg-white" />
                </CardArt>
              </GridTile>
            )}

            {magics.map(({ magicId, level }) => {
              const magic = BASE_MAGIC_BY_ID[magicId];
              if (!magic) return null;
              const label = gt(`magic.${magicId}.name`, magic.name);
              return (
                <GridTile
                  key={magicId}
                  onClick={() => setSelected({ kind: "magic", magicId, level })}
                  frame={ACTIVE_MAGIC_FRAME}
                  label={label}
                  aspect={CARD_ASPECT}
                  badge={<LevelPips level={level} max={getMagicMaxLevel(magicId)} />}
                >
                  <CardArt>
                    <MaskedMagicIcon src={baseMagicSpriteUrl(magicId)} alt={label} full />
                  </CardArt>
                </GridTile>
              );
            })}

            {specials.map((special) => (
              <GridTile key={special.name} onClick={() => setSelected({ kind: "special", name: special.name })} frame={SPECIAL_FRAME} label={special.name} aspect={CARD_ASPECT} badge={<SpecialStar />}>
                <CardArt>
                  <SpecialGlyph name={special.name} />
                </CardArt>
              </GridTile>
            ))}
          </div>
        )}
      </GridPanel>

      {selected && (selected.kind === "magic" || characterClass) && (
        <DetailModal
          onClose={closeModal}
          onBackdropClick={openTalent ? () => setTalentName(null) : undefined}
          closeAria={t("ownedMagic.closeAria")}
          align={selected.kind === "class" || (selected.kind === "special" && !PASSIVE_BY_NAME[selected.name]) ? "center" : "top"}
        >
          {selected.kind === "magic" ? (
            <MagicDetail magicId={selected.magicId} level={selected.level} talent={openTalent} chosenTalent={run.magicTalents[selected.magicId] ?? null} onTalentChange={setTalentName} gt={gt} t={t} />
          ) : selected.kind === "special" && PASSIVE_BY_NAME[selected.name] ? (
            <SpecialDetail passive={PASSIVE_BY_NAME[selected.name]} gt={gt} />
          ) : (
            characterClass && <ClassBonusDetail className={characterClass} level={classLevel} />
          )}
        </DetailModal>
      )}
    </div>
  );
}

function describeItem(item: EquippableItem, t: (key: string) => string, gt: (key: string, fallback: string) => string): string {
  if (item.specialEffect) return gt(`item.${item.id}.specialEffect`, item.specialEffect);
  const parts = (Object.entries(item.stats) as [StatKey, number][])
    .filter(([, value]) => value)
    .map(([key, value]) => `${value > 0 ? "+" : ""}${value}${STAT_DEFINITIONS[key].unit === "%" ? "%" : ""} ${gt(`stat.${key}.label`, STAT_DEFINITIONS[key].label)}`);
  return parts.join(", ") || t("loadoutSheet.noAdditionalEffect");
}

export function OwnedArtifactScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const unequipItem = useRunStore((s) => s.unequipItem);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const items = getEquippedItems(run);
  const selected = selectedIndex !== null ? items[selectedIndex] : null;
  const selectedSignals: SynergySignal[] = selected
    ? detectSynergies({ id: selected.id, label: selected.name, image: selected.image, item: selected }, run)
    : [];

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onClose} actionAria={t("ownedArtifact.closeAria")} />
      <ScreenTitle tone="gold">{t("ownedArtifact.title")}</ScreenTitle>

      <GridPanel>
        {items.length === 0 ? (
          <div className="py-[30px] text-center text-[0.8rem] text-[#e8e8e2]/35">{t("ownedArtifact.empty")}</div>
        ) : (
          <div className="grid grid-cols-6 gap-x-[1%] gap-y-1.5">
            {items.map((item, index) => {
              const label = gt(`item.${item.id}.name`, item.name);
              return (
                <GridTile key={item.id} onClick={() => setSelectedIndex(index)} frame={RARITY_RING[item.rarity]} label={label} aspect={CARD_ASPECT}>
                  <CardArt centered>
                    <GridIcon src={item.image} alt={label} />
                  </CardArt>
                </GridTile>
              );
            })}
          </div>
        )}
      </GridPanel>

      {selected && selectedIndex !== null && (
        <DetailModal onClose={() => setSelectedIndex(null)} closeAria={t("ownedArtifact.closeAria")}>
          <div className="relative flex flex-col items-center text-center gap-2">
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label={t("ownedArtifact.prevAria")}
                  onClick={() => setSelectedIndex((selectedIndex - 1 + items.length) % items.length)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-[#e8e8e2]/50 text-2xl bg-transparent border-none cursor-pointer p-2"
                >
                  ◂
                </button>
                <button
                  type="button"
                  aria-label={t("ownedArtifact.nextAria")}
                  onClick={() => setSelectedIndex((selectedIndex + 1) % items.length)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#e8e8e2]/50 text-2xl bg-transparent border-none cursor-pointer p-2"
                >
                  ▸
                </button>
              </>
            )}
            <div className="w-[28%] aspect-square">
              <GridIcon src={selected.image} alt={gt(`item.${selected.id}.name`, selected.name)} />
            </div>
            <div className="font-magic text-[1.2rem] text-[#e8e8e2]">{gt(`item.${selected.id}.name`, selected.name)}</div>
            <div className="text-[0.8rem]" style={{ color: RARITY_RING[selected.rarity] }}>
              {t("ownedArtifact.rarityArtifact", { rarity: t(`loadoutSheet.categories.${RARITY_LABEL_KEY[selected.rarity]}`) })}
            </div>
            <GameText text={describeItem(selected, t, gt)} color="#EBEBEB" className="text-[0.8rem]" />
            <div className="flex flex-col gap-0.5 mt-1 text-[0.8rem]">
              <div className="text-[#e8e8e2]/45">{t("boostSignal.listLabel")}</div>
              {selectedSignals.length === 0 ? (
                <div className="text-[#e8e8e2]/50">{t("boostSignal.noSignal")}</div>
              ) : (
                selectedSignals.map((signal, i) => (
                  <div key={i} style={{ color: BOOST_SIGNAL_TIER_COLOR[signal.tier] }}>
                    {signal.label}
                  </div>
                ))
              )}
            </div>
            {run.equipped.some((e) => e.itemId === selected.id) && <button
              type="button"
              onClick={() => {
                unequipItem(selected.id);
                setSelectedIndex(null);
              }}
              className="mt-2 py-1.5 px-4 rounded-full bg-[#3a2420] border border-[#f0603c]/50 text-[#f0603c] text-[0.75rem] cursor-pointer"
            >
              {t("ownedArtifact.removeBtn")}
            </button>}
          </div>
        </DetailModal>
      )}
    </div>
  );
}
