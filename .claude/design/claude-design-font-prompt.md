# Prompt para Claude Design — usar la fuente original del juego

Dejá de usar Kalam/Caveat (Google Fonts) para el texto de la UI. Usá la fuente
original de Magic Survival que ya tenemos en el repo:

- Nombre de familia: `MagicSurvival`
- Archivo real: `public/assets/magicSurvival.ttf` (una sola variante/peso, no
  hay bold/italic separados — no asumas pesos que no existen)
- Se carga así (ya está en el proyecto, no hace falta que la subas de nuevo):
  ```css
  @font-face {
    font-family: "MagicSurvival";
    src: url("/assets/magicSurvival.ttf") format("truetype");
    font-display: swap;
  }
  ```

Reemplazá todo `font-family:Kalam,...` y `font-family:Caveat,...` del canvas
por `font-family:MagicSurvival,ui-sans-serif,system-ui,sans-serif` (mismo
fallback que ya usa el resto de la app). No hace falta un segundo font para
títulos tipo "manuscrito" (como usaba Caveat) — todo el texto, títulos
incluidos, va en MagicSurvival.

No agregues `<link>` a Google Fonts para esto ni dejes el `@font-face` de
Kalam/Caveat en el HTML del canvas.

Si un tamaño/peso se ve mal con MagicSurvival (por ejemplo un texto muy chico
o muy pesado que la tipografía original no soporta bien), avisame en el chat
en vez de agregar una fuente de respaldo silenciosamente.
