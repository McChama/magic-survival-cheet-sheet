# Prompt para Claude Design — chips de categoría en vez del buscador

En el bottom sheet de "Artifact obtained" y "Magic obtained" (pantalla Dashboard,
el que se abre con el FAB), sacá el `<input>` de búsqueda ("Search...") y
reemplazalo por una fila horizontal de chips/pills de categoría, justo donde
hoy está el buscador (entre el header del sheet y el grid de íconos).

## Categorías por sheet (reales, de la wiki oficial)

**Artifact obtained** — chips por rareza (es la única categorización real que
usa la wiki para artifacts, no hay tipo/efecto):
- All
- Normal
- Rare
- Epic
- Special
- Legendary

**Magic obtained** — chips por tipo (así agrupa la wiki los "Offensive Magics"
/ "Utility Magics"):
- All
- Offensive
- Utility

## Comportamiento
- Un chip a la vez seleccionado (no multi-select). "All" quita el filtro.
- El grid de íconos debajo se filtra según el chip activo.
- Chip activo con un estilo claramente distinto al resto (borde/fondo/color),
  el resto en un tono apagado — segui la paleta que ya usa el canvas (no
  inventes colores nuevos fuera de los que ya definiste para owned/ring).
- Los chips van en una sola fila con scroll horizontal si no entran todos
  (no hace falta wrap a dos líneas).
- No agregues contador de resultados ni mantengas ningún resto del buscador
  (placeholder, ícono de lupa, etc.).

## Lo que NO cambia
- El resto del sheet (título, grid de 5 columnas, indicador "owned", footer
  con nombre/descripción) queda igual.
- No inventes nuevas categorías para Artifact (nada de "offense/defense/utility"
  ahí) — la wiki no las categoriza así, solo por rareza.
