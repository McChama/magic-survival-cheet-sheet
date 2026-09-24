import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { BASE_MAGIC_BY_ID, MAGIC_DESCRIPTION, baseMagicSpriteUrl, getMagicMaxLevel } from "../../data/magics";
import { MAGIC_TALENTS_BY_MAGIC_ID, TALENT_TYPE_COLOR, getMagicTalentGroups } from "../../data/magicTalents";
import { MAGIC_BASE_STATS, MAGIC_STATS, MAGIC_STAT_LABEL, formatMagicStat } from "../../data/magicStats";
import { magicDamageMultiplier } from "../../engine/magicDamage";
import { applyMagicEffects, collectMagicEffects } from "../../engine/magicEffects";
import { getRunStats } from "../../engine/runStats";
import { PASSIVE_EFFECT_LINES } from "../../data/passiveEffects";
import { classImage } from "../../config/assets";
import { getClassLevel, getClassMagicProgression } from "../../data/classes";
import { PASSIVES } from "../../data/passives";
import { getOwnedMagics } from "../../engine/ownedMagics";
import { getOwnedPassives, getPassiveLevel } from "../../engine/ownedPassives";
import { getPassiveMaxLevel, passiveLinesAtLevel } from "../../data/passiveLevels";
import { getEquippedItems } from "../../engine/tierAdaptive";
import { namedMagicIdsInText } from "../../engine/synergy";
import { useRunStore } from "../../store/useRunStore";
import { slug as classSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";
import { ACTIVE_MAGIC_FRAME, CLASS_FRAME, PASSIVE_FRAME, SPECIAL_FRAME } from "../../config/frameColors";
import { RARITY_RING, RARITY_TEXT } from "../../config/rarityColors";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { ClassBonusDetail } from "../shared/ClassBonusDetail";
import { DetailModal } from "../shared/DetailModal";
import { GameText } from "../shared/GameText";
import { GridPanel } from "../shared/GridPanel";
import { RARITY_LABEL_KEY, describeItem } from "../shared/itemText";
import { ItemSynergies } from "../shared/ItemSynergies";
import { RemoveButton } from "../shared/RemoveButton";
import { Pip, StarIcon } from "../shared/LevelMarks";
import { MaskedSprite } from "../shared/MaskedSprite";
import { CARD_ASPECT, CardArt, GridIcon, GridTile, MaskedMagicIcon } from "../shared/GridCard";
import type { EquippableItem, MagicTalentDefinition } from "../../types/game";

/** One pip per level the magic really has (`getMagicMaxLevel`, from the game's own max-level
 *  column) — not a fixed count. Pip size/spacing measured off the real screenshot. A passive's pips are always green. */
function LevelPips({ level, max, passive }: { level: number; max: number; passive?: boolean }) {
  return (
    <span className="absolute inset-x-0 bottom-[13cqh] flex items-center justify-center gap-[4cqw]">
      {Array.from({ length: max }, (_, i) => (
        <Pip key={i} filled={i < level} maxed={passive || level >= max} size="w-[6.5cqw] h-[6.5cqw]" />
      ))}
    </span>
  );
}

function SpecialStar() {
  return (
    <span className="absolute inset-x-0 bottom-[13cqh] h-[6.5cqw] flex items-center justify-center">
      <StarIcon size="w-[20cqw] h-[20cqw]" />
    </span>
  );
}

/** A class's named special ability (Guardian Angel, Doctor, ...) is a real passive in
 *  `data/passives.ts` with its own sprite — matched by name. A special with no matching
 *  passive falls back to a star glyph rather than inventing art. */
const PASSIVE_BY_NAME: Record<string, EquippableItem> = Object.fromEntries(PASSIVES.map((p) => [p.name, p]));

function SpecialGlyph({ name }: { name: string }) {
  const passive = PASSIVE_BY_NAME[name];
  if (!passive) return <span className="text-[#f0603c] text-3xl leading-none">★</span>;
  return <GridIcon src={passive.image} alt={name} />;
}

/** The tint of a regular passive's icon: the pale green of the game's Select Magic rows. */
const PASSIVE_ICON_CLASS = "bg-[#a6e8a6]";

/**
 * Everything the run has: the class icon, then one tile per base magic (the ones the Class grants at
 * their class-derived level, then the ones added with the "+" button at the level and talent the
 * player recorded — `getOwnedMagics`), then one per passive added with "+" (green pips — the same recorded-level
 * system as the magics), then one per named special ability (Guardian Angel, Doctor, ... the Class unlocks, plus the
 * ones added with "+"). See `getClassMagicProgression` in `data/classes.ts` for the class-side derivation. The class tile
 * opens the class's bonus breakdown, a magic or passive tile its own detail (where its level — and a magic's talent —
 * is set), a special its effect lines.
 */
type MagicSelection =
  | { kind: "class" }
  | { kind: "magic"; magicId: string }
  | { kind: "passive"; itemId: string }
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
 *  name, the level it unlocks at, its real description lines in their real colors and — once the magic has reached that
 *  level — the button that records it as the one the player took. It has no close button — tapping anywhere outside
 *  it closes just this panel (see `MagicDetail`). */
function TalentPanel({ talent, unlocked, chosen, onChoose, t }: { talent: MagicTalentDefinition; unlocked: boolean; chosen: boolean; onChoose: () => void; t: (key: string, options?: Record<string, unknown>) => string }) {
  return (
    <div
      className="absolute inset-x-0 top-[38%] bottom-0 overflow-hidden bg-black flex flex-col items-center justify-center gap-1 text-center px-3 py-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="font-magic text-[1.3rem] text-white">{talent.name}</div>
      <GameText text={t("ownedMagic.talentUnlockLevel", { level: talent.level })} color="#32FFE1" className="text-[0.75rem]" />
      <div className="flex flex-col gap-0.5 mt-1 text-[0.75rem]">
        {talent.lines.map((line, i) => (
          <GameText key={i} text={line.text} color={line.color} />
        ))}
      </div>
      {unlocked && (
        <button type="button" onClick={onChoose} className="mt-1.5 h-7 px-4 rounded-[3px] border-none bg-[#1c1c20] font-magic text-[0.9rem] text-white cursor-pointer">
          {chosen ? t("ownedMagic.clearTalent") : t("ownedMagic.chooseTalent")}
        </button>
      )}
    </div>
  );
}

/** An active magic's detail, laid out like the real game's: the icon with no frame, its name,
 *  level pips, its real one-line description, the level controls (the level is set here), a compact two-column stats
 *  table (stat on the left, value in gold on the right) and, pinned to the bottom, one row of small talent icons (every
 *  talent level together, a wider gap between levels). Tapping a talent opens its description
 *  panel — where an unlocked one can be recorded as the talent taken; tapping anywhere outside the panel closes only the panel.
 *  The rows are the magic's real stat list (`MAGIC_STATS`, from the game's own detail screen) with
 *  its level-1 values (`MAGIC_BASE_STATS`, the constants the game sets at battle start); Damage is
 *  that constant scaled by your dashboard ATK / Amplify ATK / All Magic Damage and the magic's
 *  permanent bonuses (`engine/magicDamage.ts`); Number and Cooldown also follow the magic's level-ups,
 *  class and artifacts (`engine/magicEffects.ts`); and a value that couldn't be decoded reads "—". */
function MagicDetail({ magicId, talent, onTalentChange, onRemoved, gt, t }: { magicId: string; talent: MagicTalentDefinition | null; onTalentChange: (name: string | null) => void; onRemoved: () => void; gt: (key: string, fallback: string) => string; t: (key: string, options?: Record<string, unknown>) => string }) {
  const magic = BASE_MAGIC_BY_ID[magicId];
  const label = gt(`magic.${magicId}.name`, magic?.name ?? magicId);
  const max = getMagicMaxLevel(magicId);
  const stats = MAGIC_STATS[magicId] ?? [];
  const talentGroups = getMagicTalentGroups(magicId);
  const icon = baseMagicSpriteUrl(magicId);
  const run = useRunStore((st) => st.run);
  const toggleAcquiredMagic = useRunStore((st) => st.toggleAcquiredMagic);
  const setMagicTalent = useRunStore((st) => st.setMagicTalent);
  const level = getOwnedMagics(run).find((m) => m.magicId === magicId)?.level ?? 1;
  const acquired = run.acquiredMagicIds.includes(magicId);
  const chosenTalents = run.magicTalents[magicId] ?? [];
  const damageMultiplier = magicDamageMultiplier(magicId, level, run);
  const effects = collectMagicEffects(magicId, level, run);
  const globalStats = getRunStats(run);

  return (
    <div className="relative flex flex-col items-center text-center gap-1.5 min-h-full" onClick={() => talent && onTalentChange(null)}>
      <DetailHero
        icon={icon}
        alt={label}
        name={label}
        levelRow={Array.from({ length: max }, (_, i) => (
          <Pip key={i} filled={i < level} maxed={level >= max} size="w-[6px] h-[6px]" />
        ))}
      />
      {/* Leveling only happens through Select Magic now (the Dashboard's Level Up button) — this is a plain hint,
          not a control, once there's still a level left to reach. */}
      {level < max && <div className="text-[0.7rem] text-[#e8e8e2]/45">{t("ownedMagic.levelUpHint")}</div>}
      {MAGIC_DESCRIPTION[magicId] && <GameText text={MAGIC_DESCRIPTION[magicId]} color="#EBEBEB" className="text-[0.8rem]" />}

      {stats.length > 0 && (
        <div className="grid grid-cols-[auto_auto] gap-x-10 gap-y-0.5 text-left mt-1 text-[0.8rem]">
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
                <TalentIcon key={tal.name} src={icon} talent={tal} selected={talent?.name === tal.name} chosen={chosenTalents.includes(tal.name)} onSelect={() => onTalentChange(talent?.name === tal.name ? null : tal.name)} />
              ))}
            </div>
          ))}
        </div>
      )}

      {acquired && (
        <RemoveButton
          label={t("ownedMagic.removeBtn")}
          onClick={() => {
            toggleAcquiredMagic(magicId);
            onRemoved();
          }}
        />
      )}

      {talent && (
        <TalentPanel
          talent={talent}
          unlocked={level >= talent.level}
          chosen={chosenTalents.includes(talent.name)}
          onChoose={() => setMagicTalent(magicId, talent.level, chosenTalents.includes(talent.name) ? null : talent.name)}
          t={t}
        />
      )}
    </div>
  );
}

/** The top of every active-magic-style modal: the icon (white-masked unless `iconClass` tints it, or in its own real
 *  colors when `unmasked` — a special ability's, per the game), the name, and a row where the level goes (level pips
 *  for a magic or passive, a star for a special ability). */
function DetailHero({ icon, alt, name, levelRow, iconClass, unmasked }: { icon: string; alt: string; name: string; levelRow: React.ReactNode; iconClass?: string; unmasked?: boolean }) {
  return (
    <>
      <div className="w-[20%] aspect-square mt-[4cqh] flex items-center justify-center">
        {unmasked ? <GridIcon src={icon} alt={alt} /> : <MaskedMagicIcon src={icon} alt={alt} full className={iconClass} />}
      </div>
      <div className="font-magic text-[1.2rem] text-[#e8e8e2]">{name}</div>
      <div className="flex items-center gap-[3px] h-[6px]">{levelRow}</div>
    </>
  );
}

/** A passive's detail (Vitality, Intelligence, ...), laid out like a magic's: the icon, the name, one green pip per level it
 *  has (`getPassiveMaxLevel`), the level controls and the lines the game shows at the current level (`passiveLinesAtLevel` — "Increase
 *  Max HP by 40%" at Lv3), each in its real color. */
function PassiveDetail({ item, onRemoved, gt, t }: { item: EquippableItem; onRemoved: () => void; gt: (key: string, fallback: string) => string; t: (key: string, options?: Record<string, unknown>) => string }) {
  const run = useRunStore((st) => st.run);
  const unequipItem = useRunStore((st) => st.unequipItem);
  const label = gt(`item.${item.id}.name`, item.name);
  const level = getPassiveLevel(run, item);
  const max = getPassiveMaxLevel(item.id);
  return (
    <div className="relative flex flex-col items-center text-center gap-2 min-h-full">
      <DetailHero
        icon={item.image}
        alt={label}
        name={label}
        iconClass={PASSIVE_ICON_CLASS}
        levelRow={Array.from({ length: max }, (_, i) => (
          <Pip key={i} filled={i < level} maxed size="w-[6px] h-[6px]" />
        ))}
      />
      {level < max && <div className="text-[0.7rem] text-[#e8e8e2]/45">{t("ownedMagic.levelUpHint")}</div>}
      <div className="flex flex-col gap-1 mt-1 text-[0.8rem]">
        {passiveLinesAtLevel(item.id, level).map((line, i) => (
          <GameText key={i} text={line.text} color={line.color} />
        ))}
      </div>
      <RemoveButton
        label={t("ownedMagic.removeBtn")}
        onClick={() => {
          unequipItem(item.id);
          onRemoved();
        }}
      />
    </div>
  );
}

/** A special ability's detail (Guardian Angel, Doctor, ...), laid out like a magic's: the
 *  unframed icon, the name, a star where a magic shows its level, then every effect line the game
 *  shows for it, each in its real color (`PASSIVE_EFFECT_LINES` — e.g. Guardian Angel's revive line
 *  plus its green "Increase Max HP by 30%"). One the player added with "+" (not the Class's own) can be removed. */
function SpecialDetail({ passive, onRemove, gt, t }: { passive: EquippableItem; onRemove?: () => void; gt: (key: string, fallback: string) => string; t: (key: string, options?: Record<string, unknown>) => string }) {
  const label = gt(`item.${passive.id}.name`, passive.name);
  const lines = PASSIVE_EFFECT_LINES[passive.id] ?? [];
  return (
    <div className="relative flex flex-col items-center text-center gap-2 min-h-full">
      <DetailHero icon={passive.image} alt={label} name={label} levelRow={<StarIcon size="w-[14px] h-[14px]" />} unmasked />
      <div className="flex flex-col gap-1 mt-1 text-[0.8rem]">
        {lines.map((line, i) => (
          <GameText key={i} text={line.text} color={line.color} />
        ))}
      </div>
      {onRemove && <RemoveButton label={t("ownedMagic.removeBtn")} onClick={onRemove} />}
    </div>
  );
}

export function OwnedMagicScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const characterClass = useRunStore((s) => s.run.meta.characterClass);
  const classLevels = useRunStore((s) => s.run.meta.classLevels);
  const run = useRunStore((s) => s.run);
  const unequipItem = useRunStore((s) => s.unequipItem);
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
  const passives = getOwnedPassives(run);
  const leveledPassives = passives.filter((p) => !p.special);
  const { specials } = characterClass ? getClassMagicProgression(characterClass, classLevel) : { specials: [] };
  const classSpecialNames = new Set(specials.map((s) => s.name));
  const addedSpecials = passives.filter((p) => p.special && !classSpecialNames.has(p.item.name));
  const classLabel = characterClass ? gt(`class.${classSlug(characterClass)}.name`, characterClass) : null;
  const selectedPassive = selected?.kind === "passive" ? passives.find((p) => p.item.id === selected.itemId)?.item : undefined;
  const selectedSpecial = selected?.kind === "special" ? PASSIVE_BY_NAME[selected.name] : undefined;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onClose} actionAria={t("ownedMagic.closeAria")} />
      <ScreenTitle tone="gold">{t("ownedMagic.title")}</ScreenTitle>

      <GridPanel>
        {!characterClass && magics.length === 0 && passives.length === 0 ? (
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
                  onClick={() => setSelected({ kind: "magic", magicId })}
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

            {leveledPassives.map(({ item, level, max }) => {
              const label = gt(`item.${item.id}.name`, item.name);
              return (
                <GridTile key={item.id} onClick={() => setSelected({ kind: "passive", itemId: item.id })} frame={PASSIVE_FRAME} label={label} aspect={CARD_ASPECT} badge={<LevelPips level={level} max={max} passive />}>
                  <CardArt>
                    <MaskedMagicIcon src={item.image} alt={label} full className={PASSIVE_ICON_CLASS} />
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

            {addedSpecials.map(({ item }) => (
              <GridTile key={item.id} onClick={() => setSelected({ kind: "special", name: item.name })} frame={SPECIAL_FRAME} label={item.name} aspect={CARD_ASPECT} badge={<SpecialStar />}>
                <CardArt>
                  <SpecialGlyph name={item.name} />
                </CardArt>
              </GridTile>
            ))}
          </div>
        )}
      </GridPanel>

      {selected && (selected.kind !== "class" || characterClass) && (
        <DetailModal
          onClose={closeModal}
          onBackdropClick={openTalent ? () => setTalentName(null) : undefined}
          closeAria={t("ownedMagic.closeAria")}
          align={selected.kind === "class" || (selected.kind === "special" && !selectedSpecial) ? "center" : "top"}
        >
          {selected.kind === "magic" ? (
            <MagicDetail magicId={selected.magicId} talent={openTalent} onTalentChange={setTalentName} onRemoved={closeModal} gt={gt} t={t} />
          ) : selected.kind === "passive" ? (
            selectedPassive && <PassiveDetail item={selectedPassive} onRemoved={closeModal} gt={gt} t={t} />
          ) : selected.kind === "special" && selectedSpecial ? (
            <SpecialDetail
              passive={selectedSpecial}
              gt={gt}
              t={t}
              onRemove={
                classSpecialNames.has(selectedSpecial.name)
                  ? undefined
                  : () => {
                      unequipItem(selectedSpecial.id);
                      closeModal();
                    }
              }
            />
          ) : (
            characterClass && <ClassBonusDetail className={characterClass} level={classLevel} />
          )}
        </DetailModal>
      )}
    </div>
  );
}

/** "Boost signals": the base magics an artifact's real effect text names — the ones it benefits — one per line with its icon, green
 *  for the ones the run already has. When it names none, just a line saying there is no boosted magic. */
function BoostedMagics({ item, gt, t }: { item: EquippableItem; gt: (key: string, fallback: string) => string; t: (key: string) => string }) {
  const run = useRunStore((st) => st.run);
  const owned = new Set(getOwnedMagics(run).map((m) => m.magicId));
  const text = item.specialEffect ?? "";
  const ids = namedMagicIdsInText(text)
    .map((id) => ({ id, name: BASE_MAGIC_BY_ID[id]?.name ?? id }))
    .sort((a, b) => text.indexOf(a.name) - text.indexOf(b.name));
  return (
    <div className="flex flex-col items-center gap-1 mt-1 text-[0.8rem]">
      {ids.length === 0 ? (
        <div className="text-[#e8e8e2]/50">{t("boostSignal.noSignal")}</div>
      ) : (
        <>
          <div className="text-[#e8e8e2]/45">{t("boostSignal.listLabel")}</div>
          {ids.map(({ id, name }) => {
          const has = owned.has(id);
          return (
            <div key={id} className={`flex items-center gap-1.5 ${has ? "text-[#63d16b]" : "text-[#e8e8e2]/75"}`}>
              <span className="w-4 h-4 flex-none flex items-center justify-center">
                <MaskedMagicIcon src={baseMagicSpriteUrl(id)} alt="" full className={has ? "bg-[#63d16b]" : "bg-[#e8e8e2]/75"} />
              </span>
              {gt(`magic.${id}.name`, name)}
            </div>
          );
          })}
        </>
      )}
    </div>
  );
}

export function OwnedArtifactScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const unequipItem = useRunStore((s) => s.unequipItem);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const items = getEquippedItems(run).filter((item) => item.kind === "artifact");
  const selected = selectedIndex !== null ? items[selectedIndex] : null;

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
            <div className="w-[24%] aspect-square">
              <GridIcon src={selected.image} alt={gt(`item.${selected.id}.name`, selected.name)} />
            </div>
            <div className="font-magic text-[1.2rem] text-[#e8e8e2]">{gt(`item.${selected.id}.name`, selected.name)}</div>
            <div className="text-[0.8rem]" style={{ color: RARITY_TEXT[selected.rarity] }}>
              {t("ownedArtifact.rarityArtifact", { rarity: t(`loadoutSheet.categories.${RARITY_LABEL_KEY[selected.rarity]}`) })}
            </div>
            <GameText text={describeItem(selected, t, gt)} color="#EBEBEB" className="text-[0.8rem]" />
            <BoostedMagics item={selected} gt={gt} t={t} />
            <ItemSynergies itemId={selected.id} />
            {run.equipped.some((e) => e.itemId === selected.id) && (
              <RemoveButton
                label={t("ownedArtifact.removeBtn")}
                onClick={() => {
                  unequipItem(selected.id);
                  setSelectedIndex(null);
                }}
              />
            )}
          </div>
        </DetailModal>
      )}
    </div>
  );
}
