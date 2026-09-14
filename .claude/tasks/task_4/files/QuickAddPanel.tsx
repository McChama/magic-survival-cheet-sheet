import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { ItemIcon } from "../shared/ItemIcon";
import { optionsByKind, type QuickAddKind } from "../../data/quickAddOptions";
import type { RecommenderOption } from "../../engine/scoring";

const TITLE_BY_KIND: Record<QuickAddKind, string> = {
  artifact: "Artefacto obtenido",
  passive: "Pasiva obtenida",
  magic: "Magia obtenida",
};

interface QuickAddPanelProps {
  kind: QuickAddKind;
  onClose: () => void;
  onPick: (option: RecommenderOption) => void;
}

/**
 * Bottom sheet de una sola categoría (a diferencia de OptionPicker, que agrupa
 * por rareza porque compara tipos mezclados). Acá el jugador ya sabe la
 * categoría —vino de un sub-botón del speed-dial— así que el buscador solo
 * necesita filtrar dentro de esa categoría, sin agrupar de nuevo.
 */
export function QuickAddPanel({ kind, onClose, onPick }: QuickAddPanelProps) {
  const [query, setQuery] = useState("");
  const options = useMemo(() => optionsByKind(kind), [kind]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-ink-700 bg-ink-900 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ink-300">{TITLE_BY_KIND[kind]}</span>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-full p-1 text-ink-600 active:bg-ink-800">
          <X size={16} />
        </button>
      </div>

      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar..."
        className="mb-3 w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-300 outline-none"
      />

      <div className="grid max-h-72 grid-cols-5 gap-2 overflow-y-auto pr-1">
        {filtered.map((option) => (
          <button
            key={option.id}
            type="button"
            title={option.label}
            onClick={() => onPick(option)}
            className="flex flex-col items-center gap-1 rounded-md p-1 active:bg-ink-800"
          >
            <ItemIcon src={option.image} alt={option.label} rarity={option.item?.rarity} size={38} />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-5 py-6 text-center text-xs text-ink-600">Sin resultados</p>
        )}
      </div>
    </div>
  );
}
