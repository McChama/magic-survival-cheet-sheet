import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { uiImage } from "../../config/assets";

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
      className="absolute top-0 left-0 right-0 w-full h-[78%] object-cover object-top"
    />
  );
}

export function HomeScreen({ onStartGame, onOpenCharacter, onOpenResearch }: HomeScreenProps) {
  const { t } = useTranslation("translation");
  return (
    <div className="absolute inset-0 bg-black overflow-hidden flex flex-col">
      <TitleBackdrop />

      <div className="relative pt-3.5 px-3.5 flex items-start justify-between" />

      <div className="relative flex justify-end pt-1.5 px-2">
        <img src={uiImage("title/TitleText.png")} alt={t("home.titleAlt")} className="max-w-[110px] h-auto" />
      </div>

      <div className="relative flex justify-end pr-2">
        <div className="text-right font-magic uppercase text-[#d93b3b] text-[2rem] leading-[1.1] tracking-wide whitespace-nowrap [text-shadow:-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff,0_0_6px_rgba(255,255,255,.7)]">
          {t("home.cheatSheet")}
        </div>
      </div>

      <div className="relative mt-auto pt-0 pr-6 pb-[26px] pl-10">
        <button
          type="button"
          onClick={onStartGame}
          className="bg-transparent border-none p-0 text-white font-magic text-[3.2rem] font-normal cursor-pointer tracking-wide"
        >
          {t("home.startGame")}
        </button>
        <div className="grid grid-cols-5 items-center justify-items-center mt-7 px-1">
          <div />
          <button type="button" onClick={onOpenResearch} aria-label={t("home.researchAria")} className="bg-transparent border-none p-0 cursor-pointer">
            <img src={uiImage("icons/UI_Icon002.png")} alt="" className="w-[50px] h-[50px] object-contain" />
          </button>
          <div />
          <button type="button" onClick={onOpenCharacter} aria-label={t("home.subjectAria")} className="bg-transparent border-none p-0 cursor-pointer">
            <img src={uiImage("icons/UI_Icon003.png")} alt="" className="w-[50px] h-[50px] object-contain" />
          </button>
          <div />
        </div>
      </div>
    </div>
  );
}
