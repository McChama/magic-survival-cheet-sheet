import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { uiImage } from "../../config/assets";
import { rem } from "../../config/rem";

interface HomeScreenProps {
  onStartGame: () => void;
  onOpenCharacter: () => void;
  onOpenResearch: () => void;
}

/** The 3-frame title art loops as a subtle idle flicker, same idea as the Subject idle-sway frames. */
const TITLE_FRAMES = [
  uiImage("title/TitleImgFront1.png"),
  uiImage("title/TitleImgFront2.png"),
  uiImage("title/TitleImgFront3.png"),
];
const TITLE_FRAME_MS = 150;

function TitleBackdrop() {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % TITLE_FRAMES.length);
    }, TITLE_FRAME_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <img
      src={TITLE_FRAMES[frameIndex]}
      alt=""
      style={{ position: "absolute", top: 0, left: 0, right: 0, width: "100%", height: "78%", objectFit: "cover", objectPosition: "top" }}
    />
  );
}

export function HomeScreen({ onStartGame, onOpenCharacter, onOpenResearch }: HomeScreenProps) {
  const { t } = useTranslation();
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <TitleBackdrop />

      <div style={{ position: "relative", padding: "14px 14px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }} />

      <div style={{ position: "relative", display: "flex", justifyContent: "flex-end", padding: "6px 8px 0" }}>
        <img src={uiImage("title/TitleText.png")} alt={t("home.titleAlt")} style={{ maxWidth: 110, height: "auto" }} />
      </div>

      <div style={{ position: "relative", marginTop: "auto", padding: "0 24px 26px 40px" }}>
        <button
          type="button"
          onClick={onStartGame}
          style={{ background: "none", border: "none", padding: 0, color: "#fff", fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif", fontSize: rem(64), fontWeight: 400, cursor: "pointer", letterSpacing: 0.5 }}
        >
          {t("home.startGame")}
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", alignItems: "center", justifyItems: "center", marginTop: 28, padding: "0 4px" }}>
          <div />
          <button type="button" onClick={onOpenResearch} aria-label={t("home.researchAria")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <img src={uiImage("icons/UI_Icon002.png")} alt="" style={{ width: 50, height: 50, objectFit: "contain" }} />
          </button>
          <div />
          <button type="button" onClick={onOpenCharacter} aria-label={t("home.subjectAria")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <img src={uiImage("icons/UI_Icon003.png")} alt="" style={{ width: 50, height: 50, objectFit: "contain" }} />
          </button>
          <div />
        </div>
      </div>
    </div>
  );
}
