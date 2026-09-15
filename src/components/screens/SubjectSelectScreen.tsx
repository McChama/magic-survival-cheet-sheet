import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { subjectAnimFrame, subjectImage, uiImage } from "../../config/assets";
import { SUBJECTS } from "../../data/classes";
import { useRunStore } from "../../store/useRunStore";
import { slug as subjectSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";
import { ScreenHeader } from "../shared/ScreenHeader";
import { ScreenTitle } from "../shared/ScreenTitle";
import { ScreenFooter } from "../shared/ScreenFooter";

interface SubjectSelectScreenProps {
  onClose: () => void;
}

/**
 * Row layout for the select grid, in SUBJECTS order — chosen so every row fits the
 * available height with no scrolling and each row is centered independently (row sizes
 * are uneven: 4/5/4/5/4/3), matching the requested Wizard.../Warlock.../.../Jack o'
 * Lantern grouping.
 */
const SUBJECT_ROW_SIZES = [4, 5, 4, 5, 4, 3];

function chunkSubjects(names: string[], sizes: number[]): string[][] {
  const rows: string[][] = [];
  let offset = 0;
  for (const size of sizes) {
    rows.push(names.slice(offset, offset + size));
    offset += size;
  }
  return rows;
}

const SUBJECT_ROWS = chunkSubjects(SUBJECTS, SUBJECT_ROW_SIZES);

/**
 * User-picked subset of the 21-frame animation set that reads as a calm idle sway rather
 * than the full set's dramatic swings (see reference/game-data-sources.md — the frames
 * are individually cropped with no shared pivot, so this subset is a deliberate choice of
 * which frames jump the least, not just "the idle portion" of a longer sequence).
 */
const IDLE_FRAMES = [7, 8, 9];
const IDLE_FRAME_MS = 150;

/**
 * Real in-game character sprite, animated through a hand-picked idle-sway subset (not the
 * full 21-frame set — see IDLE_FRAMES). Sized in percentages of its row's height (not fixed
 * pixels) so all 6 rows scale to fit whatever vertical space is available without scrolling.
 */
function SubjectSilhouette({ name, label, selected, applied }: { name: string; label: string; selected: boolean; applied: boolean }) {
  const slug = subjectSlug(name);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
    const id = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % IDLE_FRAMES.length);
    }, IDLE_FRAME_MS);
    return () => window.clearInterval(id);
  }, [slug]);

  return (
    <div className="relative h-full aspect-[46/76] max-w-full flex items-end justify-center">
      <img
        src={subjectAnimFrame(slug, IDLE_FRAMES[frameIndex])}
        alt={label}
        className={`max-w-full max-h-[68%] object-contain relative z-10 ${selected ? "opacity-100" : "opacity-[.85]"}`}
        onError={(e) => {
          // Fall back to the static portrait if this subject's animation set is somehow incomplete.
          e.currentTarget.onerror = null;
          e.currentTarget.src = subjectImage(`${slug}.png`);
        }}
      />
      {selected ? (
        <img src={uiImage("unit/UnitAllyShadow01.png")} alt="" className="absolute bottom-[2%] w-[82%] object-contain" />
      ) : applied ? (
        <img src={uiImage("unit/UnitEnemyShadow01.png")} alt="" className="absolute bottom-[2%] w-[82%] object-contain" />
      ) : (
        <div className="absolute bottom-[2%] w-[65%] h-[13%] rounded-full bg-[#282e34]/[32%]" />
      )}
    </div>
  );
}

/**
 * Placeholder for the divider asset between a subject's name and its description — no such
 * asset has been dropped into public/assets/uiImages/ yet, so this renders a plain line and
 * silently upgrades to the real image the moment `subject-detail-divider.png` exists there.
 */
function SubjectDetailDivider() {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return <div className="w-[70%] max-w-[220px] h-px bg-white/[.16] mt-0.5 mb-1" />;
  }

  return (
    <img
      src={uiImage("subject-detail-divider.png")}
      alt=""
      className="w-[70%] max-w-[220px] h-auto mt-0.5 mb-1"
      onError={() => setBroken(true)}
    />
  );
}

export function SubjectSelectScreen({ onClose }: SubjectSelectScreenProps) {
  const { t } = useTranslation("translation");
  const gt = useGameDataText();
  const appliedSubject = useRunStore((s) => s.run.meta.subject);
  const setSubject = useRunStore((s) => s.setSubject);
  const clearLoadout = useRunStore((s) => s.clearLoadout);

  // A subject is always selected (defaults to SUBJECTS[0] "Wizard" in the store), so the
  // preview always has something to show — no "nothing chosen yet" state to handle here.
  const [previewName, setPreviewName] = useState<string>(appliedSubject);
  const isApplied = previewName === appliedSubject;
  const previewId = subjectSlug(previewName);
  const previewLabel = gt(`subject.${previewId}.name`, previewName);
  const description = gt(`subject.${previewId}.description`, "");
  const trait = gt(`subject.${previewId}.trait`, "");

  function handleClose() {
    clearLoadout();
    onClose();
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        backgroundImage: `url(${uiImage("unit/UnitSkinBackGround.png")})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <ScreenHeader
        onAction={handleClose}
        actionAria={t("subject.closeAria")}
        actionIcon={<img src={uiImage("icons/UI_Exit_Black.png")} alt="" className="w-[18px] h-[18px] object-contain" />}
      />
      <ScreenTitle style={{ color: "#16333a", textShadow: "0 1px 0 rgba(255,255,255,.25)" }}>
        {t("subject.title")}
      </ScreenTitle>

      <div className="flex-1 min-h-0 flex flex-col justify-evenly py-2.5 px-2.5 pb-1.5 gap-2.5">
        {SUBJECT_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex-1 min-h-0 flex justify-center items-center gap-3.5">
            {row.map((name) => {
              const isSelected = previewName === name;
              const isAppliedSubject = name === appliedSubject;
              const label = gt(`subject.${subjectSlug(name)}.name`, name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setPreviewName(name)}
                  className={`relative bg-transparent border-none p-0 cursor-pointer flex flex-col items-center justify-end h-full flex-initial min-w-0 font-[inherit] origin-bottom transition-transform duration-150 ${isSelected ? "scale-110" : "scale-100"}`}
                >
                  <SubjectSilhouette name={name} label={label} selected={isSelected} applied={isAppliedSubject} />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <ScreenFooter className="bg-[#08080a] border-t border-white/[.14] gap-[3px]">
        <div className="text-[1.2rem] tracking-wide text-[#e8e8e2]">{previewLabel}</div>

        <SubjectDetailDivider />

        <div className="text-[0.8rem] text-[#efc84f] text-center">
          {description ? `${description} ${t("subject.startingArtifactCount", { count: 1 })}` : t("subject.noDetail")}
        </div>
        <div className="text-[0.8rem] text-[#e88fc0] text-center">
          {trait || t("subject.noDetail")}
        </div>

        <button
          type="button"
          onClick={() => setSubject(previewName)}
          className={`w-[70%] max-w-[220px] h-[1.2rem] flex items-center justify-center border-none rounded leading-none cursor-pointer text-[0.9rem] ${isApplied ? "bg-[#3a2420] text-[#f0603c]" : "bg-[#2d2d31] text-white"}`}
        >
          {isApplied ? t("subject.applying") : t("subject.select")}
        </button>
      </ScreenFooter>
    </div>
  );
}
