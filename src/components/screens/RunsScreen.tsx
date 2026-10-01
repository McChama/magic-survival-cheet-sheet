import { useState } from "react";
import { useTranslation } from "react-i18next";
import { uiImage } from "../../config/assets";
import { COMBINATION_FRAME_IDLE, COMBINATION_FRAME_READY } from "../../config/frameColors";
import { baseMagicSpriteUrl } from "../../data/magics";
import { getOwnedMagics } from "../../engine/ownedMagics";
import { slug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";
import { deleteRun, loadRun, startNewRun, useRunsStore, type RunRecord } from "../../store/useRunsStore";
import { MaskedSprite } from "../shared/MaskedSprite";
import { RemoveButton } from "../shared/RemoveButton";
import { ScreenFooter } from "../shared/ScreenFooter";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { StripFrame } from "../shared/StripFrame";
import { SubjectSprite } from "../shared/SubjectSprite";

interface RunsScreenProps {
  onClose: () => void;
  /** A run was opened: on to its dashboard. */
  onOpenRun: () => void;
  /** A new run was started: on to picking its class. */
  onNewRun: () => void;
}

const AGO = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "3 hours ago", "yesterday" — how long since the run last changed. */
function formatAgo(timestamp: number): string {
  const minutes = Math.round((timestamp - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return AGO.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return AGO.format(hours, "hour");
  return AGO.format(Math.round(hours / 24), "day");
}

/** The magic the build leaned on: the highest-level one (the first of them on a tie). */
function mainMagic(record: RunRecord) {
  return getOwnedMagics(record.run).reduce<{ magicId: string; level: number } | null>((best, magic) => (!best || magic.level > best.level ? magic : best), null);
}

/**
 * One saved run, laid out like a save slot: the Subject's sprite, its name over the Class, when it was last played,
 * and on the right the character level next to the build's main magic and that magic's level. The run in progress
 * has the white frame, the history the dark one — the same pair the Magic Combination grid uses for available/not.
 */
function RunRow({ record, confirming, onOpen, onAskRemove, onRemove, onKeep }: {
  record: RunRecord;
  confirming: boolean;
  onOpen: () => void;
  onAskRemove: () => void;
  onRemove: () => void;
  onKeep: () => void;
}) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const { subject, characterClass } = record.run.meta;
  const subjectLabel = gt(`subject.${slug(subject)}.name`, subject);
  const classLabel = characterClass ? gt(`class.${slug(characterClass)}.name`, characterClass) : t("runs.noClass");
  const magic = mainMagic(record);

  return (
    <div className="relative flex-none w-full h-[3.75rem] bg-black flex items-stretch">
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("runs.openAria", { subject: subjectLabel })}
        className="flex-1 min-w-0 flex items-center gap-2 pl-3 pr-0 bg-transparent border-none font-[inherit] text-left cursor-pointer"
      >
        {/* The Subject sprites are dark silhouettes drawn for Subject Select's pale wall. With no backdrop here
            (the player's choice), a pale glow hugging the silhouette is what keeps them visible on black. */}
        <div className="flex-none w-[40px] h-[58px] flex items-end justify-center">
          <SubjectSprite
            name={subject}
            label=""
            className="max-w-[38px] max-h-[56px] object-contain [filter:drop-shadow(0_0_1px_rgba(232,232,226,.95))_drop-shadow(0_0_3px_rgba(232,232,226,.5))]"
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="text-[0.85rem] leading-tight text-white truncate">{subjectLabel}</div>
          <div className="text-[0.66rem] leading-tight text-[#e8e8e2]/75 truncate">{classLabel}</div>
          <div className={`text-[0.55rem] leading-tight truncate ${record.ended ? "text-[#e8e8e2]/45" : "text-[#3fdc5a]"}`}>
            {record.ended ? formatAgo(record.updatedAt) : t("runs.inProgress")}
          </div>
        </div>
        <div className="flex-none w-[2.3rem] text-center text-[0.8rem] text-[#efc84f]">{t("runs.level", { level: record.run.currentLevel })}</div>
        <div className="flex-none w-[1.5rem] flex flex-col items-center gap-0.5">
          {magic && (
            <>
              <MaskedSprite src={baseMagicSpriteUrl(magic.magicId)} className="block w-[28px] h-[28px] bg-white" />
              <div className="text-[0.55rem] leading-none text-[#e8e8e2]/75">{magic.level}</div>
            </>
          )}
        </div>
      </button>
      <div className="flex-none w-[2.6rem] flex flex-col items-center justify-center gap-1 pr-1">
        {confirming ? (
          <>
            <RemoveButton label={t("runs.remove")} onClick={onRemove} />
            <button type="button" onClick={onKeep} className="bg-transparent border-none p-0 text-[0.6rem] text-[#e8e8e2]/75 cursor-pointer">
              {t("runs.keep")}
            </button>
          </>
        ) : (
          <button type="button" onClick={onAskRemove} aria-label={t("runs.removeAria")} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer">
            <img src={uiImage("icons/UI_Exit.png")} alt="" className="w-[12px] h-[12px] object-contain opacity-40" />
          </button>
        )}
      </div>
      <StripFrame tint={record.ended ? COMBINATION_FRAME_IDLE : COMBINATION_FRAME_READY} size="row" />
    </div>
  );
}

/**
 * Every run the player has had (`store/useRunsStore.ts`): the one in progress on top, then the history. Tapping a
 * row loads that run and opens its dashboard — a past build can be looked at, and the run in progress picked up again.
 * A long list, so it scrolls (see CLAUDE.md's Content zone rule).
 */
export function RunsScreen({ onClose, onOpenRun, onNewRun }: RunsScreenProps) {
  const { t } = useTranslation("translation");
  const records = useRunsStore((s) => s.records);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 bg-black flex flex-col">
      <ScreenHeader onAction={onClose} actionAria={t("runs.closeAria")} />
      <ScreenTitle tone="gold">{t("runs.title")}</ScreenTitle>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {records.map((record) => (
          <RunRow
            key={record.id}
            record={record}
            confirming={confirmId === record.id}
            onOpen={() => {
              loadRun(record.id);
              onOpenRun();
            }}
            onAskRemove={() => setConfirmId(record.id)}
            onKeep={() => setConfirmId(null)}
            onRemove={() => {
              setConfirmId(null);
              deleteRun(record.id);
            }}
          />
        ))}
      </div>
      <ScreenFooter>
        <button
          type="button"
          onClick={() => {
            startNewRun();
            onNewRun();
          }}
          className="bg-transparent border-none p-0 text-white font-magic text-[1.75rem] font-normal cursor-pointer"
        >
          {t("runs.newRun")}
        </button>
      </ScreenFooter>
    </div>
  );
}
