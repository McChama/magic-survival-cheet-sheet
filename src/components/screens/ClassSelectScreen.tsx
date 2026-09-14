import { useTranslation } from "react-i18next";
import { classImage } from "../../config/assets";
import { rem } from "../../config/rem";
import { CLASSES } from "../../data/classes";
import { useRunStore } from "../../store/useRunStore";
import { slug as classSlug } from "../../i18n/gameData";
import { useGameDataText } from "../../i18n/useGameDataText";

interface ClassSelectScreenProps {
  onClose: () => void;
  onContinue: () => void;
}

export function ClassSelectScreen({ onClose, onContinue }: ClassSelectScreenProps) {
  const { t } = useTranslation();
  const gt = useGameDataText();
  const characterClass = useRunStore((s) => s.run.meta.characterClass);
  const setCharacterClass = useRunStore((s) => s.setCharacterClass);
  const characterClassLabel = characterClass ? gt(`class.${classSlug(characterClass)}.name`, characterClass) : null;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "#050506" }}>
      <div style={{ padding: "14px 14px 4px", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", flex: "none" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("classSelect.closeAria")}
          style={{ width: 44, height: 44, background: "none", border: "none", color: "#fff", fontSize: rem(28), fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif", cursor: "pointer" }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 150px" }}>
        <div style={{ textAlign: "center", fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif", fontSize: rem(40), color: "#e8e8e2" }}>
          {characterClassLabel ?? t("classSelect.selectClassHeading")}
        </div>
        <div style={{ height: 14 }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "22px 8px", marginTop: 26 }}>
          {CLASSES.map((name) => {
            const isSelected = characterClass === name;
            const label = gt(`class.${classSlug(name)}.name`, name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => setCharacterClass(name)}
                title={label}
                style={{ position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", height: 62 }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "rgba(255,255,255,.06)",
                    boxShadow: isSelected ? "0 0 0 2px #efc84f" : "none",
                  }}
                >
                  <img
                    src={classImage(`${classSlug(name)}.png`)}
                    alt={label}
                    style={{ width: "100%", height: "100%", objectFit: "contain", opacity: isSelected ? 1 : 0.75 }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px 18px 26px", background: "linear-gradient(180deg,rgba(5,5,6,0),#050506 30%)" }}>
        <button
          type="button"
          disabled={!characterClass}
          onClick={onContinue}
          style={{
            width: "100%",
            padding: 10,
            background: "none",
            border: "none",
            color: "#fff",
            fontFamily: "MagicSurvival,ui-sans-serif,system-ui,sans-serif",
            fontSize: rem(34),
            cursor: "pointer",
            letterSpacing: 1,
            opacity: characterClass ? 1 : 0.4,
          }}
        >
          {t("classSelect.selected")}
        </button>
      </div>
    </div>
  );
}
