import { useState } from "react";
import { useTranslation } from "react-i18next";
import { baseMagicSpriteUrl } from "../../data/magics";
import { MAGIC_COMBINATION_INFO } from "../../data/magicCombinations";
import { getFusionsForTalent, wouldCompleteFusion } from "../../engine/magicCombination";
import { useLevelUpActions } from "../../hooks/useLevelUpActions";
import { useRunStore } from "../../store/useRunStore";
import { COMBINATION_FRAME_IDLE, COMBINATION_FRAME_READY } from "../../config/frameColors";
import { TALENT_TYPE_COLOR } from "../../data/magicTalents";
import { GameText } from "./GameText";
import { GridTile } from "./GridCard";
import { MaskedSprite } from "./MaskedSprite";
import { ScreenHeader } from "./ScreenHeader";
import { ScreenTitle } from "./ScreenTitle";
import type { MagicTalentDefinition } from "../../types/game";

interface AttributeSelectProps {
  magicId: string;
  /** The talent group the magic's next level unlocks — always 3 real options in the extracted data. */
  group: { level: number; talents: MagicTalentDefinition[] };
  /** The level this pick brings the magic to (== group.level). */
  targetLevel: number;
  /** Back to the Select Magic list, without committing anything. */
  onBack: () => void;
  /** The pick was learned — closes the whole "+" sheet, same as any other Select Magic commit. */
  onLearned: () => void;
  /** Passed straight through to `useLevelUpActions` — true only when reached from the Dashboard's level-up flow. */
  isLevelUp: boolean;
}

/**
 * The game's own "Select Attribute" screen (`eng_Dictionary_Name.txt`: "Select Attribute", "Attributes make magic
 * even stronger. @ Select an attribute.") — reached from a Select Magic row whose next level unlocks a talent.
 * The 3 options are the magic's own icon (`baseMagicSpriteUrl`) tinted by talent type (`TALENT_TYPE_COLOR`), exactly
 * like a magic's small talent icons in Owned Magic, just bigger — tapping one turns it white (selected; the other two
 * keep their own color, unlike Owned Magic's row where the rest dim to 25%, matching the real full-screen version)
 * and reveals its name, real description lines, and the Magic Combinations that need this exact (magic, talent) pair
 * as an ingredient (`getFusionsForTalent`) — each a small combo-art thumbnail, white-bordered
 * (`COMBINATION_FRAME_READY`) if picking this talent would complete it right now (`wouldCompleteFusion`), matching
 * `MagicCombinationScreen`'s own grid. Learn is disabled until an option is picked.
 */
export function AttributeSelect({ magicId, group, targetLevel, onBack, onLearned, isLevelUp }: AttributeSelectProps) {
  const { t } = useTranslation("translation");
  const run = useRunStore((s) => s.run);
  const { learnTalent } = useLevelUpActions(isLevelUp);
  const [selected, setSelected] = useState<MagicTalentDefinition | null>(null);

  const compatibleFusions = selected ? getFusionsForTalent(magicId, selected.name) : [];

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#050506]">
      <ScreenHeader onAction={onBack} actionAria={t("levelUp.backAria")} />
      <ScreenTitle tone="gold">{t("levelUp.title")}</ScreenTitle>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col items-center px-6 pt-2">
        <div className="flex-none w-full max-w-[280px] flex flex-col items-center gap-4">
          <button type="button" onClick={() => setSelected(group.talents[0])} className="w-[26%] aspect-square p-0 bg-transparent border-none cursor-pointer">
            <MaskedSprite src={baseMagicSpriteUrl(magicId)} label={group.talents[0].name} tint={selected?.name === group.talents[0].name ? "#fff" : TALENT_TYPE_COLOR[group.talents[0].type]} className="block w-full h-full" />
          </button>
          <div className="w-full flex items-start justify-between">
            {[group.talents[1], group.talents[2]].map((talent) => (
              <button key={talent.name} type="button" onClick={() => setSelected(talent)} className="w-[26%] aspect-square p-0 bg-transparent border-none cursor-pointer">
                <MaskedSprite src={baseMagicSpriteUrl(magicId)} label={talent.name} tint={selected?.name === talent.name ? "#fff" : TALENT_TYPE_COLOR[talent.type]} className="block w-full h-full" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-1.5 text-center overflow-hidden">
          {selected ? (
            <>
              <div className="font-magic text-[1.2rem] text-white">{selected.name}</div>
              <div className="flex flex-col gap-0.5 text-[0.78rem]">
                {selected.lines.map((line, i) => (
                  <GameText key={i} text={line.text} color={line.color} />
                ))}
              </div>
              {compatibleFusions.length > 0 && (
                <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
                  {compatibleFusions.map((fusion) => (
                    <GridTile
                      key={fusion.id}
                      onClick={() => {}}
                      frame={wouldCompleteFusion(fusion, run, magicId, group.level, selected.name) ? COMBINATION_FRAME_READY : COMBINATION_FRAME_IDLE}
                      label={MAGIC_COMBINATION_INFO[fusion.id]?.name ?? fusion.name}
                      aspect="aspect-square"
                      className="w-12"
                    >
                      <span className="absolute inset-[12%] flex items-center justify-center">
                        {fusion.image && <img src={fusion.image} alt="" className="w-full h-full object-contain" />}
                      </span>
                    </GridTile>
                  ))}
                </div>
              )}
            </>
          ) : (
            <GameText text={t("levelUp.hint")} color="#e8e8e2" className="text-[0.85rem]" />
          )}
        </div>
      </div>

      <div className="flex-none pb-6 pt-2 flex justify-center">
        <button
          type="button"
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            learnTalent(magicId, group.level, targetLevel, selected.name);
            onLearned();
          }}
          className={`bg-transparent border-none font-magic text-[1.6rem] cursor-pointer ${selected ? "text-[#e8e8e2]" : "text-[#e8e8e2]/30"}`}
        >
          {t("levelUp.learnBtn")}
        </button>
      </div>
    </div>
  );
}
