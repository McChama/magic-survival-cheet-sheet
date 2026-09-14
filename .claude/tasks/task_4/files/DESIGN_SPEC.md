# Design spec — Run Companion (mobile + desktop)

Revisa primero `run-companion-mockup.html` (ábrelo en el navegador y redimensiona
la ventana a ~1200px para ver el layout de escritorio). Este documento traduce
ese mockup a cambios concretos sobre el código real.

## 0. Dos bugs a corregir primero (antes que cualquier tema visual)

### Bug 1 — Sprites de fusión rotos (ImageOff en MinuteZeroDashboard)
Los assets locales ya están en `public/assets/`, pero las fusiones muestran el
fallback de imagen rota. Verificar en este orden:
1. ¿Existe físicamente `public/assets/magicImages/` con los 58 archivos?
   (Los otros 3 folders — artifactImages, passiveImages, researchImages — sí
   están confirmados. Es sospechoso que solo magicImages falle: probable que
   se haya copiado parcialmente.)
2. Si el folder existe: abrir devtools → Network, recargar la pantalla
   Dashboard, y ver qué URL exacta está pidiendo el `<img>` que falla. Confirmar
   que coincide con `IMAGE_BASE_URL` + `magicImages/{fusionId}.png`.
3. Reiniciar el dev server (`npm run dev`) después de cualquier cambio en
   `public/` — Vite a veces no recoge archivos nuevos en caliente.
No adivines la causa: reporta cuál de los 3 puntos de arriba era el problema.

### Bug 2 — Fuente rompe acentos en español ("MenÚ", "InvestigaciÓn")
Causa: `magicSurvival.ttf` no tiene glifos completos para vocales acentuadas
minúsculas, y el fallback del navegador se comporta de forma inconsistente.
Fix: dejar de usar la fuente del juego para texto de UI en español. Ver sección
2 (tipografía) de este spec para el reemplazo exacto.

## 1. Breakpoint

Un solo breakpoint: **960px**. Por debajo = layout mobile actual (bottom nav,
una columna). Desde 960px = layout desktop (sidebar nav, contenido en grid).
Usa el breakpoint `lg:` de Tailwind pero configúralo a 960px en
`tailwind.config.js` si el default (1024px) no calza — decisión tuya según se
vea en pantallas reales de laptop pequeña.

## 2. Tipografía — fix del bug de acentos

En `tailwind.config.js`, agrega una familia sans-serif legible como default de
UI (Inter, o el fallback del sistema si no quieres agregar una fuente externa):

```js
fontFamily: {
  sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
  magic: ["MagicSurvival", "ui-sans-serif", "system-ui", "sans-serif"], // ya existe
}
```

En `src/index.css`, cambia el `body` para usar `font-family: theme(fontFamily.sans)`
en vez de MagicSurvival por defecto.

Reserva `font-magic` (clase Tailwind) SOLO para:
- Valores numéricos de stats (el `<button class="statval">` en StatRow)
- El score del recomendador (ej. "8.2")
- Badges cortos en inglés si aparecen (nombres de items ya están en inglés en
  los datos, así que ItemIcon/labels de items pueden quedarse en font-magic si
  se ve bien, pero cualquier oración en español — headers, subtítulos, botones,
  mensajes de estado — va en font-sans sin excepción)

## 3. Color — usar el dorado con más disciplina

Hoy el dorado (`gold`) se usa en casi todo: headers, tabs activos, valores de
stat, iconos activos. Eso lo diluye. Nueva regla:
- Un solo elemento "dorado" por vista: el valor numérico que el usuario vino a
  ver (el score en Recomendador, el valor del stat que se está editando en
  Stats, el nombre de la fusión activa en el chip del status bar).
- Todo lo demás que hoy es gold pasa a `text-ink-300`/`text-ink-400` con un
  borde o fondo sutil (`bg-gold/10`, `border-gold-dim`) para indicar "activo"
  sin gritar.

No se agregan colores nuevos — es una redistribución de los mismos tokens que
ya existen en `tailwind.config.js` (`gold`, `ink-*`, `rarity-*`).

## 4. Layout — Sidebar en desktop (reemplaza BottomNav ≥960px)

Crea `src/components/layout/Sidebar.tsx`: mismo `Tab` type y misma prop
signature que `BottomNav` (`active`, `onChange`) para que `App.tsx` pueda
renderizar uno u otro sin duplicar lógica de navegación:

```tsx
<div className="hidden lg:flex ...">{/* Sidebar */}</div>
<BottomNav className="lg:hidden" active={tab} onChange={setTab} />
```

`BottomNav` necesita aceptar un `className` opcional para poder ocultarla en
desktop sin condicionales en `App.tsx`.

## 5. Layout por pantalla en desktop (≥960px)

**MinuteZeroDashboard**: grid de 2 columnas (`lg:grid-cols-[1.4fr_1fr]`).
Columna izquierda: Clase, Sujeto, Puntos de Investigación (apilados). Columna
derecha: Fusiones Objetivo, que en desktop usa 3 columnas en vez de las 3
columnas actuales fijas (ya está en 3, pero con más ancho disponible, permite
mostrar el texto de ingredientes sin truncar — ajustar `text-[11px]` →
`lg:text-xs` si hace falta más espacio).

**PauseMenuStats**: en vez del tab pair Combate/Utilidad (que solo tiene
sentido cuando el ancho obliga a elegir uno), en desktop se muestran ambos
bloques lado a lado (`lg:grid-cols-2`), ocultando el `tabpair` con `lg:hidden`.

**ActiveRecommender**: los 4 `OptionPicker` pasan de columna a fila
(`lg:flex-row lg:flex-wrap`, cada uno con `lg:flex-1 lg:min-w-[220px]`) ya que
en desktop hay espacio horizontal de sobra y verlos en fila permite comparar
las 4 opciones de un vistazo antes de abrir cualquiera.

## 6. RunStatusBar (ver Tarea 2 del prompt anterior)

Se mantiene igual en mobile y desktop —es el único elemento que ya funciona
bien "estirado" porque es una sola fila horizontal por diseño. Confirma que en
desktop no quede pegado al borde: agregar `lg:px-10` en vez del `px-4` mobile.

## 7. Tarea 4 — FAB "Registrar obtenido" (speed-dial de 3 categorías)

Gap real detectado en el código: `useRunStore` ya expone `equipItem`,
`unequipItem` y `toggleAcquiredMagic`, pero **ningún componente los llama
todavía**. Sin esto, el motor de tier-adaptativo (`computeTierAdjustments`) y
el árbol de dependencia de fusión (`acquiredMagicIds`) nunca se activan en la
práctica. Esta tarea cierra ese hueco.

Archivos ya escritos (aplícalos tal cual, no los reconstruyas):
- `src/data/quickAddOptions.ts` — filtra `ALL_RECOMMENDER_OPTIONS` por
  categoría (`artifact` / `passive` / `magic`)
- `src/components/shared/QuickAddPanel.tsx` — bottom sheet con buscador +
  grid, una sola categoría a la vez (no agrupa por rareza como `OptionPicker`,
  porque el jugador ya sabe la categoría al llegar acá)
- `src/components/layout/QuickAddFab.tsx` — el FAB con speed-dial de 3
  sub-botones (Magia / Pasiva / Artefacto), maneja el toast de confirmación y
  decide si llama `equipItem` o `toggleAcquiredMagic` según el tipo de opción
  elegida

Integración pendiente (esto sí es tuyo):
- Monta `<QuickAddFab />` en `App.tsx`, al mismo nivel que `<BottomNav />` (NO
  dentro de cada pantalla individual) — las adquisiciones pasan sin importar en
  qué tab esté el jugador.
- Verifica que el FAB quede posicionado sobre el `BottomNav` sin taparlo ni ser
  tapado (usa `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`, ya está en
  el componente, pero confirma visualmente en mobile real o devtools con
  "safe area" simulada).
- En desktop (≥960px), como `BottomNav` desaparece (ver sección 4), el offset
  del FAB puede reducirse — ajusta el `bottom-[...]` con un `lg:bottom-6` si
  queda con espacio muerto debajo.
- Colores de los 3 sub-botones (`KIND_META` en `QuickAddFab.tsx`) son
  intencionalmente distintos a los colores de rareza — son una taxonomía
  diferente (tipo de cosa, no qué tan rara es). No los reemplaces por
  `RARITY_BORDER`.

Checklist específico de esta tarea:
- [ ] Tocar "+" despliega las 3 categorías con la animación de slide+fade
- [ ] Elegir una categoría abre el bottom sheet filtrado a esa categoría
      únicamente (confirmar que Magia no muestra artefactos, etc.)
- [ ] Elegir un ítem cierra el panel, muestra el toast, y el estado en
      `useRunStore` (`run.equipped` o `run.acquiredMagicIds`) se actualiza de
      verdad — verificable con React DevTools o un `console.log` temporal
- [ ] El toast desaparece solo después de ~1.6s sin bloquear la interacción

## Checklist de aceptación

- [ ] Bug 1 (sprites de fusión) resuelto y confirmado visualmente
- [ ] Bug 2 (acentos rotos) resuelto — probar con "Menú", "Investigación",
      "Inteligente", "opción" específicamente
- [ ] Redimensionar la ventana de 375px a 1400px sin que nada se rompa o
      quede con espacio muerto exagerado
- [ ] Sidebar visible ≥960px, BottomNav visible <960px, nunca ambos a la vez
- [ ] `tsc -b --noEmit` y `npm run build` limpios
