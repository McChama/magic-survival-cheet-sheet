import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { uiImage } from "../../config/assets";
import { useUiStore } from "../../store/useUiStore";
import { NavIconButton } from "../shared/NavIconButton";

interface HomeScreenProps {
  onStartGame: () => void;
  onOpenCharacter: () => void;
  onOpenResearch: () => void;
  onOpenRuns: () => void;
}

/** The 3-frame title art loops as a subtle idle flicker, same idea as the Subject idle-sway frames.
 *  index.html preloads the first one (by its literal path) when Home is the screen about to open. */
const TITLE_FRAMES = [
  uiImage("title/TitleImgFront1.webp"),
  uiImage("title/TitleImgFront2.webp"),
  uiImage("title/TitleImgFront3.webp"),
];
const TITLE_FRAME_MS = 150;

function TitleBackdrop() {
  const [frameIndex, setFrameIndex] = useState(0);
  const parked = useUiStore((s) => s.parked);

  useEffect(() => {
    // Off-screen (the companion's panel is parked): no timer, so no re-render nobody would see.
    if (parked) return;
    let id: number | undefined;
    let cancelled = false;
    // The first frame is the screen's largest image, so it downloads alone: the other two (~60 KB each) are only
    // asked for once it is in and on screen, instead of sharing a slow connection with it. The flicker starts when
    // both are decoded, so it never cycles into a frame that is still downloading. `decode()` and
    // `requestAnimationFrame` only run on a page that is being drawn — a tab left in the background doesn't start
    // cycling until it is looked at.
    const ready = (src: string) => {
      const image = new Image();
      image.src = src;
      return image.decode().catch(() => undefined);
    };
    const painted = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    void ready(TITLE_FRAMES[0])
      .then(painted)
      .then(() => (cancelled ? [] : Promise.all(TITLE_FRAMES.slice(1).map(ready))))
      .then(() => {
        if (cancelled) return;
        id = window.setInterval(() => {
          setFrameIndex((i) => (i + 1) % TITLE_FRAMES.length);
        }, TITLE_FRAME_MS);
      });
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [parked]);

  return (
    <img
      src={TITLE_FRAMES[frameIndex]}
      alt=""
      fetchPriority="high"
      className="absolute top-0 left-0 right-0 w-full h-[78%] object-cover object-top"
    />
  );
}

export function HomeScreen({ onStartGame, onOpenCharacter, onOpenResearch, onOpenRuns }: HomeScreenProps) {
  const { t } = useTranslation("translation");
  return (
    <div className="absolute inset-0 bg-black overflow-hidden flex flex-col">
      <TitleBackdrop />

      <div className="relative pt-3.5 px-3.5 flex items-start justify-between" />

      <div className="relative flex justify-end pt-1.5 px-2">
        <img src={uiImage("title/TitleText.webp")} alt={t("home.titleAlt")} className="max-w-[110px] h-auto" />
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
        <div className="flex items-center justify-around mt-7 px-[15%]">
          <NavIconButton onClick={onOpenResearch} ariaLabel={t("home.researchAria")} icon={uiImage("icons/UI_Icon002.png")} />
          <NavIconButton onClick={onOpenCharacter} ariaLabel={t("home.subjectAria")} icon={uiImage("icons/UI_Icon003.png")} />
          <NavIconButton onClick={onOpenRuns} ariaLabel={t("home.runsAria")} icon={uiImage("icons/UI_Icon006.png")} />
        </div>
      </div>
    </div>
  );
}
