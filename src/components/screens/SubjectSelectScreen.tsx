import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { subjectAnimFrame, subjectImage, uiImage } from "../../config/assets";
import { rem } from "../../config/rem";
import { SUBJECTS } from "../../data/classes";
import { useRunStore } from "../../store/useRunStore";
import { slug as subjectSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";

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
    <div style={{ position: "relative", height: "100%", aspectRatio: "46 / 76", maxWidth: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <img
        src={subjectAnimFrame(slug, IDLE_FRAMES[frameIndex])}
        alt={label}
        style={{ maxWidth: "100%", maxHeight: "68%", objectFit: "contain", position: "relative", zIndex: 1, opacity: selected ? 1 : 0.85 }}
        onError={(e) => {
          // Fall back to the static portrait if this subject's animation set is somehow incomplete.
          e.currentTarget.onerror = null;
          e.currentTarget.src = subjectImage(`${slug}.png`);
        }}
      />
      {selected ? (
        <img src={uiImage("unit/UnitAllyShadow01.png")} alt="" style={{ position: "absolute", bottom: "2%", width: "82%", objectFit: "contain" }} />
      ) : applied ? (
        <img src={uiImage("unit/UnitEnemyShadow01.png")} alt="" style={{ position: "absolute", bottom: "2%", width: "82%", objectFit: "contain" }} />
      ) : (
        <div style={{ position: "absolute", bottom: "2%", width: "65%", height: "13%", borderRadius: "50%", background: "rgba(40,46,52,.32)" }} />
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
    return <div style={{ width: "70%", maxWidth: 220, height: 1, background: "rgba(255,255,255,.16)", margin: "2px 0 4px" }} />;
  }

  return (
    <img
      src={uiImage("subject-detail-divider.png")}
      alt=""
      style={{ width: "70%", maxWidth: 220, height: "auto", margin: "2px 0 4px" }}
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

  const [previewName, setPreviewName] = useState<string | null>(appliedSubject);
  const isApplied = previewName !== null && previewName === appliedSubject;
  const previewId = previewName ? subjectSlug(previewName) : null;
  const previewLabel = previewName && previewId ? gt(`subject.${previewId}.name`, previewName) : null;
  const description = previewId ? gt(`subject.${previewId}.description`, "") : "";
  const trait = previewId ? gt(`subject.${previewId}.trait`, "") : "";

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
      <div style={{ position: "relative", padding: "14px 14px 6px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flex: "none" }}>
        <div style={{ width: 46 }} />
        <div
          style={{
            fontSize: rem(34),
            color: "#16333a",
            letterSpacing: 1,
            textShadow: "0 1px 0 rgba(255,255,255,.25)",
            marginTop: 4,
          }}
        >
          {t("subject.title")}
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label={t("subject.closeAria")}
          style={{ flex: "none", width: rem(23), height: rem(23), background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          <img src={uiImage("icons/UI_Exit_Black.png")} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "space-evenly", padding: "10px 10px 6px", gap: 10 }}>
        {SUBJECT_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} style={{ flex: "1 1 0", minHeight: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
            {row.map((name) => {
              const isSelected = previewName === name;
              const isAppliedSubject = name === appliedSubject;
              const label = gt(`subject.${subjectSlug(name)}.name`, name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setPreviewName(name)}
                  style={{
                    position: "relative",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "100%",
                    flex: "0 1 auto",
                    minWidth: 0,
                    fontFamily: "inherit",
                  }}
                >
                  <SubjectSilhouette name={name} label={label} selected={isSelected} applied={isAppliedSubject} />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div
        style={{
          flex: "none",
          background: "#08080a",
          borderTop: "1px solid rgba(255,255,255,.14)",
          padding: "0rem 1rem 0.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <div style={{ fontSize: rem(24), letterSpacing: 0.5, color: "#e8e8e2" }}>
          {previewLabel ?? t("subject.choosePlaceholder")}
        </div>

        <SubjectDetailDivider />

        <div style={{ fontSize: rem(16), color: "#efc84f", textAlign: "center" }}>
          {description ? `${description} ${t("subject.startingArtifactCount", { count: 1 })}` : t("subject.noDetail")}
        </div>
        <div style={{ fontSize: rem(16), color: "#e88fc0", textAlign: "center" }}>
          {trait || t("subject.noDetail")}
        </div>

        <button
          type="button"
          disabled={!previewName}
          onClick={() => previewName && setSubject(previewName)}
          style={{
            width: "70%",
            maxWidth: 220,
            height: rem(24),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isApplied ? "#3a2420" : "#2d2d31",
            border: "none",
            borderRadius: 4,
            color: isApplied ? "#f0603c" : "#fff",
            fontSize: rem(18),
            lineHeight: 1,
            cursor: "pointer",
            opacity: previewName ? 1 : 0.4,
          }}
        >
          {isApplied ? t("subject.applying") : t("subject.select")}
        </button>
      </div>
    </div>
  );
}
