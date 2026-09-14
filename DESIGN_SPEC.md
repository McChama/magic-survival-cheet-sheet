# Design spec — Run Companion (mobile + desktop)

Revisa primero `run-companion-mockup.html` (ábrelo en el navegador y redimensiona
la ventana a ~1200px para ver el layout de escritorio). Este documento traduce
ese mockup a cambios concretos sobre el código real.

## Requirement — App language: English

Todo el texto de la interfaz (headers, botones, labels, tooltips, mensajes de
estado, nombres de tabs, etc.) debe estar en **inglés**, no en español. Esto
aplica sin importar que parte de los datos base (efectos de fusión, texto de
sabor) provenga originalmente de los archivos de localización en español del
juego (`spa_Dictionary_*.txt`) — ese texto extraído debe traducirse al inglés
antes de mostrarse en la UI, no usarse tal cual. Los nombres de items/hechizos
que ya están en inglés en `src/data/*.ts` (ids y `name`) se mantienen así.

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
Con el requisito de idioma de arriba (UI en inglés), este bug específico deja
de aplicar — el inglés no usa esos acentos. Aun así, dejar de usar la fuente
del juego para texto de UI sigue siendo el fix correcto (legibilidad general,
no solo acentos). Ver sección 2 (tipografía) de este spec para el reemplazo
exacto.

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

## Checklist de aceptación

- [ ] Bug 1 (sprites de fusión) resuelto y confirmado visualmente
- [ ] Bug 2 (acentos rotos) resuelto — probar con "Menú", "Investigación",
      "Inteligente", "opción" específicamente
- [ ] Redimensionar la ventana de 375px a 1400px sin que nada se rompa o
      quede con espacio muerto exagerado
- [ ] Sidebar visible ≥960px, BottomNav visible <960px, nunca ambos a la vez
- [ ] `tsc -b --noEmit` y `npm run build` limpios
