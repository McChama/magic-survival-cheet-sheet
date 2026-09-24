import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BASE_MAGIC_BY_ID, MAGIC_DESCRIPTION, baseMagicSpriteUrl } from "../../data/magics";
import { magicKindOf } from "../../data/magicCategories";
import { MAGIC_LEVEL_UPS } from "../../data/magicLevelUps";
import { passiveLinesAtLevel } from "../../data/passiveLevels";
import { getMagicLevelPick, getPassiveLevelPick, type LevelPick } from "../../engine/magicLeveling";
import { useLevelUpActions } from "../../hooks/useLevelUpActions";
import type { RecommenderOption } from "../../engine/scoring";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { LEVEL_PICK_FRESH_COLOR, LEVEL_PICK_NORMAL_COLOR, LEVEL_PICK_TALENT_COLOR, MAGIC_KIND_COLOR } from "../../config/frameColors";
import { GameText } from "./GameText";
import { GridIcon, MaskedMagicIcon } from "./GridCard";
import { StarIcon } from "./LevelMarks";
import { StripFrame } from "./StripFrame";
import type { MagicTalentDefinition } from "../../types/game";

/** The color a real "Increase X by N%" level-up preview line uses throughout this project's extracted game text. */
const LEVEL_UP_LINE_COLOR = "#6EDCFF";

interface PickRowProps {
  /** The rough border's color: white active / blue utility / green passive / red special, or the talent-tier teal once
   *  this row's next level unlocks an attribute. */
  frame: string;
  icon: ReactNode;
  title: string;
  /** Top-right corner: "Lv N" (colored by what this pick does) for a magic/passive, the star for a not-yet-owned special. */
  levelBadge?: ReactNode;
  /** Not blocked by the Current Level cap — tapping the row commits. Blocked, it's inert and shows `blockedHint` instead. */
  disabled?: boolean;
  onAction: () => void;
  /** Read to screen readers as the row's accessible name (what tapping it does) — there's no separate button to label. */
  actionLabel: string;
  /** Replaces the description, in the same fixed-height slot, once `disabled`. */
  blockedHint?: string;
  /** The description content (a magic's real blurb, its level-up preview, or a passive's level lines) — not rendered while `disabled`. */
  children?: ReactNode;
}

/**
 * One row of the game's "Select Magic" list: a wide black card with the game's rough border, tappable anywhere (icon,
 * title, description) — leveling this magic/passive up (or obtaining it, or opening Select Attribute) is the row's
 * only job, so the whole row is the control, not a button living inside it. Every row is the same fixed height
 * regardless of how long its description is (`h-[6rem]`, description clamped to 2 lines) so the list doesn't jump
 * around per-row the way it did when e.g. Flash Shock's longer blurb made just its own card taller than its
 * neighbors'. The description (not the title) uses a tight line-height so its two lines read as one compact block
 * under the title rather than spreading out to fill the row.
 */
function PickRow({ frame, icon, title, levelBadge, disabled, onAction, actionLabel, blockedHint, children }: PickRowProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onAction}
      aria-label={`${title} — ${actionLabel}`}
      title={title}
      className={`relative flex-none w-full h-[6rem] bg-black border-none p-0 font-[inherit] text-left ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <div className="relative h-full flex items-center gap-3 px-3.5">
        <div className="flex-none w-[44px] h-[44px] flex items-center justify-center">{icon}</div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
          <div className="text-[1.02rem] leading-tight text-white pr-12 truncate">{title}</div>
          <div className="h-[2.1rem] overflow-hidden">
            {disabled && blockedHint ? <div className="text-[0.68rem] text-[#e8e8e2]/45 leading-tight">{blockedHint}</div> : <div className="text-[0.78rem] leading-tight line-clamp-2">{children}</div>}
          </div>
        </div>
        {levelBadge && <div className="absolute top-2 right-3 flex items-center">{levelBadge}</div>}
      </div>
      <StripFrame tint={frame} size="row" />
    </button>
  );
}

function LevelBadge({ level, color }: { level: number; color: string }) {
  const { t } = useTranslation("translation");
  return <span className="font-magic text-[1rem]" style={{ color }}>{t("loadoutSheet.levelBadge", { level })}</span>;
}

/** A magic's real level-up preview for reaching `targetLevel` ("Increase Arcane Ray Damage by 20% @ ..."), or `undefined`
 *  if the data has no entry for it (e.g. reaching a magic's max level with a shorter level-up list than most). */
function levelUpPreview(magicId: string, targetLevel: number): string | undefined {
  const name = BASE_MAGIC_BY_ID[magicId]?.name;
  if (!name) return undefined;
  return MAGIC_LEVEL_UPS[name]?.[targetLevel - 2];
}

export interface AttributeSelectRequest {
  magicId: string;
  group: { level: number; talents: MagicTalentDefinition[] };
  targetLevel: number;
}

interface MagicPickListProps {
  options: RecommenderOption[];
  /** A row just committed (Obtain / a plain level-up) — the sheet closes, the same as a talent pick's Learn does. */
  onPicked: () => void;
  /** A talent-tier row was tapped — opens the Select Attribute screen instead of committing directly. */
  onOpenAttributeSelect: (request: AttributeSelectRequest) => void;
  /** True only when this list is the Dashboard's level-up flow (not the "+" menu's plain catalog) — see `useLevelUpActions`. */
  isLevelUp: boolean;
}

/**
 * The magics and passives Select Magic offers, as the game's own rows in a scrolling list: a wide card with a rough
 * border colored by kind, its icon (white for a magic, pale green for a passive, the sprite's own colors for a
 * special), name, level and description. **Tapping a row is the only interaction** — a not-yet-owned magic/passive
 * is obtained (level 1) on tap; one already owned and below its real max level levels up by one on tap, or, once its
 * next level is a talent pick, opens Select Attribute instead; a row is disabled (inert, showing why instead of its
 * description) once Current Level is too low to reach that level yet (a magic can never be leveled past the
 * player's own Current Level — see `engine/magicLeveling.ts`). During the Dashboard's level-up flow (`isLevelUp`)
 * that check is against Current Level *plus the pending level-up* — see `effectiveCurrentLevel` below — since
 * tapping a row is what actually commits that pending level (select-then-commit; `useLevelUpActions`). One already
 * at its real max level doesn't appear in `options` at all (`LoadoutSheet` filters it out).
 */
export function MagicPickList({ options, onPicked, onOpenAttributeSelect, isLevelUp }: MagicPickListProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const run = useRunStore((s) => s.run);
  const { obtainMagic, levelUpMagic, obtainPassive, levelUpPassive } = useLevelUpActions(isLevelUp);
  // The row cap uses what Current Level would become once this pick commits, not its stored value — a level-up is
  // still pending (select-then-commit) while this list is open, so a row that needs exactly one more level than the
  // player currently has is still selectable.
  const effectiveCurrentLevel = run.currentLevel + (isLevelUp ? 1 : 0);

  function rowFor(option: RecommenderOption, pick: LevelPick, frame: string) {
    const cap = Math.min(pick.realMax, effectiveCurrentLevel);
    const blocked = pick.owned && pick.targetLevel > cap;
    const rowFrame = pick.talentGroup ? LEVEL_PICK_TALENT_COLOR : frame;
    const levelColor = !pick.owned ? LEVEL_PICK_FRESH_COLOR : pick.talentGroup ? LEVEL_PICK_TALENT_COLOR : LEVEL_PICK_NORMAL_COLOR;
    const blockedHint = blocked ? t("loadoutSheet.levelBlockedHint", { level: pick.targetLevel }) : undefined;

    let actionLabel: string;
    let onAction: () => void;
    if (!pick.owned) {
      actionLabel = t("loadoutSheet.obtainBtn");
      onAction = () => {
        if (option.magicId) obtainMagic(option.magicId);
        else if (option.item) obtainPassive(option.item);
        onPicked();
      };
    } else if (pick.talentGroup && option.magicId) {
      const magicId = option.magicId;
      const group = pick.talentGroup;
      actionLabel = t("levelUp.selectAttributeBtn");
      onAction = () => onOpenAttributeSelect({ magicId, group, targetLevel: pick.targetLevel });
    } else {
      actionLabel = t("loadoutSheet.levelUpBtn");
      onAction = () => {
        if (option.magicId) levelUpMagic(option.magicId, pick.targetLevel);
        else if (option.item) levelUpPassive(option.item, pick.targetLevel);
        onPicked();
      };
    }

    return { rowFrame, levelBadge: <LevelBadge level={pick.targetLevel} color={levelColor} />, actionLabel, disabled: blocked, onAction, blockedHint };
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-1 pb-6">
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const kind = magicKindOf(option);
          if (!kind) return null;
          const baseFrame = MAGIC_KIND_COLOR[kind];

          if (option.magicId) {
            const magicId = option.magicId;
            const title = gt(`magic.${magicId}.name`, BASE_MAGIC_BY_ID[magicId]?.name ?? option.label);
            const pick = getMagicLevelPick(magicId, run);
            const { rowFrame, levelBadge, actionLabel, disabled, onAction, blockedHint } = rowFor(option, pick, baseFrame);
            // A fresh pickup shows the magic's own real description; an owned one shows what this specific level-up
            // grants (a talent pick's real "You can obtain an attribute." line, or the level's own "+N%" preview —
            // falling back to the plain description on the rare level the data has no preview line for).
            const description = !pick.owned
              ? { text: MAGIC_DESCRIPTION[magicId], color: "#EBEBEB" }
              : pick.talentGroup
                ? { text: t("levelUp.obtainAttribute"), color: LEVEL_PICK_TALENT_COLOR }
                : { text: levelUpPreview(magicId, pick.targetLevel) ?? MAGIC_DESCRIPTION[magicId], color: LEVEL_UP_LINE_COLOR };
            return (
              <PickRow key={option.id} frame={rowFrame} icon={<MaskedMagicIcon src={baseMagicSpriteUrl(magicId)} alt={title} full />} title={title} levelBadge={levelBadge} actionLabel={actionLabel} disabled={disabled} onAction={onAction} blockedHint={blockedHint}>
                {description.text && <GameText text={description.text} color={description.color} />}
              </PickRow>
            );
          }

          const item = option.item;
          if (!item) return null;
          const title = gt(`item.${item.id}.name`, item.name);
          const special = kind === "special";
          const pick = getPassiveLevelPick(item, run);
          const { rowFrame, levelBadge, actionLabel, disabled, onAction, blockedHint } = rowFor(option, pick, baseFrame);
          return (
            <PickRow
              key={option.id}
              frame={rowFrame}
              icon={special ? <GridIcon src={item.image} alt={title} /> : <MaskedMagicIcon src={item.image} alt={title} full className="bg-[#a6e8a6]" />}
              title={title}
              levelBadge={special ? (!pick.owned ? <StarIcon size="w-[18px] h-[18px]" /> : undefined) : levelBadge}
              actionLabel={actionLabel}
              disabled={disabled}
              onAction={onAction}
              blockedHint={blockedHint}
            >
              {passiveLinesAtLevel(item.id, pick.targetLevel).map((line, i) => (
                <GameText key={i} text={line.text} color={line.color} />
              ))}
            </PickRow>
          );
        })}
        {options.length === 0 && <div className="py-[30px] text-center text-[0.8rem] text-[#e8e8e2]/35">{t("loadoutSheet.noResults")}</div>}
      </div>
    </div>
  );
}
