import { useState } from "react";
import { useTranslation } from "react-i18next";
import { rem } from "../../config/rem";
import { LoadoutSheet } from "../shared/LoadoutSheet";
import type { QuickAddKind } from "../../data/quickAddOptions";

export function LoadoutFab() {
  const { t } = useTranslation();
  const [fabOpen, setFabOpen] = useState(false);
  const [activeKind, setActiveKind] = useState<QuickAddKind | null>(null);

  function openSheet(kind: QuickAddKind) {
    setActiveKind(kind);
    setFabOpen(false);
  }

  return (
    <>
      {fabOpen && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(4,4,5,.68)" }} onClick={() => setFabOpen(false)} />
      )}

      <div style={{ position: "absolute", right: 20, bottom: 26, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
        {fabOpen && (
          <div className="animate-ms-pop" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
            <button
              type="button"
              onClick={() => openSheet("artifact")}
              style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
            >
              <span style={{ fontSize: rem(22), color: "#e8e8e2", fontWeight: 700, textShadow: "0 1px 4px #000" }}>{t("loadoutFab.artifact")}</span>
              <span
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: "#1b1b1f",
                  border: "1px solid rgba(239,200,79,.5)",
                  color: "#efc84f",
                  fontSize: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✦
              </span>
            </button>
            <button
              type="button"
              onClick={() => openSheet("magic")}
              style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
            >
              <span style={{ fontSize: rem(22), color: "#e8e8e2", fontWeight: 700, textShadow: "0 1px 4px #000" }}>{t("loadoutFab.magic")}</span>
              <span
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: "#1b1b1f",
                  border: "1px solid rgba(95,227,196,.5)",
                  color: "#5fe3c4",
                  fontSize: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✧
              </span>
            </button>
          </div>
        )}
        <button
          type="button"
          aria-label={fabOpen ? t("loadoutFab.closeAria") : t("loadoutFab.openAria")}
          onClick={() => setFabOpen((v) => !v)}
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "none",
            background: "#f07f2a",
            color: "#fff",
            fontSize: 32,
            lineHeight: 1,
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(0,0,0,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform .18s ease",
            transform: fabOpen ? "rotate(45deg)" : "none",
          }}
        >
          +
        </button>
      </div>

      {activeKind && <LoadoutSheet kind={activeKind} onClose={() => setActiveKind(null)} />}
    </>
  );
}
