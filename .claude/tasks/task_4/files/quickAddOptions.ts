import { ALL_RECOMMENDER_OPTIONS } from "./recommenderOptions";
import type { RecommenderOption } from "../engine/scoring";

export type QuickAddKind = "artifact" | "passive" | "magic";

/**
 * Subconjunto de ALL_RECOMMENDER_OPTIONS para el FAB de "registrar obtenido".
 * A diferencia del Recomendador (que compara cualquier tipo mezclado), acá el
 * jugador ya sabe qué tipo de cosa recogió (el juego se lo dice en pantalla),
 * así que filtramos por categoría para reducir el ruido de búsqueda.
 */
export function optionsByKind(kind: QuickAddKind): RecommenderOption[] {
  if (kind === "magic") return ALL_RECOMMENDER_OPTIONS.filter((o) => o.magicId);
  return ALL_RECOMMENDER_OPTIONS.filter((o) => o.item?.kind === kind);
}
