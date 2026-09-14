import { useState } from "react";
import { Plus } from "lucide-react";
import { useRunStore } from "../../store/useRunStore";
import { QuickAddPanel } from "../shared/QuickAddPanel";
import type { QuickAddKind } from "../../data/quickAddOptions";
import type { RecommenderOption } from "../../engine/scoring";

/**
 * Colores de categoría ("kind"), no de rareza — son una taxonomía distinta
 * (qué tipo de cosa es) de la de EquippableItem.rarity (qué tan rara es), así
 * que se definen acá en vez de reusar RARITY_BORDER/RARITY_LABEL.
 */
const KIND_META: { kind: QuickAddKind; label: string; color: string }[] = [
  { kind: "magic", label: "Magia", color: "#7d3f9e" },
  { kind: "passive", label: "Pasiva", color: "#1f8f6e" },
  { kind: "artifact", label: "Artefacto", color: "#c98a1f" },
];

export function QuickAddFab() {
  const equipItem = useRunStore((s) => s.equipItem);
  const toggleAcquiredMagic = useRunStore((s) => s.toggleAcquiredMagic);

  const [dialOpen, setDialOpen] = useState(false);
  const [activeKind, setActiveKind] = useState<QuickAddKind | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function handlePick(option: RecommenderOption) {
    if (option.item) {
      equipItem(option.item.id);
    } else if (option.magicId) {
      toggleAcquiredMagic(option.magicId);
    }
    setActiveKind(null);
    setToast(`${option.label} agregado a tu equipo`);
    window.setTimeout(() => setToast(null), 1600);
  }

  return (
    <>
      {toast && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border border-alert-watch bg-ink-900 px-4 py-1.5 text-xs text-alert-watch shadow-panel"
        >
          {toast}
        </div>
      )}

      {activeKind && (
        <>
          <div className="fixed inset-0 z-20 bg-black/40" onClick={() => setActiveKind(null)} />
          <QuickAddPanel kind={activeKind} onClose={() => setActiveKind(null)} onPick={handlePick} />
        </>
      )}

      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-20 flex flex-col items-end gap-2.5">
        {KIND_META.map(({ kind, label, color }) => (
          <button
            key={kind}
            type="button"
            onClick={() => {
              setActiveKind(kind);
              setDialOpen(false);
            }}
            className={`flex items-center gap-2 transition-all duration-150 ${
              dialOpen ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0"
            }`}
          >
            <span className="rounded-md border border-ink-700 bg-ink-900 px-2.5 py-1 text-xs text-ink-300">{label}</span>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/15 text-sm font-medium text-white"
              style={{ background: color }}
            >
              {label[0]}
            </span>
          </button>
        ))}

        <button
          type="button"
          aria-label={dialOpen ? "Cerrar menú de registrar obtenido" : "Registrar obtenido"}
          onClick={() => setDialOpen((v) => !v)}
          className={`flex h-13 w-13 items-center justify-center rounded-full bg-gold text-ink-950 shadow-glow transition-transform duration-150 ${
            dialOpen ? "rotate-45" : ""
          }`}
          style={{ width: 52, height: 52 }}
        >
          <Plus size={24} />
        </button>
      </div>
    </>
  );
}
