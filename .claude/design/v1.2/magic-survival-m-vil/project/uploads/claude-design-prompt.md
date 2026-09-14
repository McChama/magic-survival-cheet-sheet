# Prompt para Claude Design — Magic Survival Mobile

Este diseño alimenta una app real con datos reales ya extraídos del juego (no un
prototipo aislado). Para que lo que diseñes se pueda implementar sin tener que
descartar contenido inventado, seguí estas reglas:

## 1. No inventes datos de juego
No generes nombres de personajes/clases ficticios, lore de personaje, ni bonos o
porcentajes de mecánica específicos atados a un nombre real. La app ya tiene:
- 25 Subjects y 24 Classes reales (nombres reales del juego, en español)
- 182 Artifacts, ~22 Base Magics y 21 Research nodes reales, cada uno con su
  propio ícono/sprite ya extraído
- 16 stats reales con sus labels exactos (HP, ATK, Amplify ATK, Critical Strike
  Rate, All Magic Cooldown, Item Pickup Range, etc.)

En vez de inventar "Archivist", "Hexbinder", "Wizard", "Warlock", etc. o texto
tipo "Increase Item Pickup Range by 5%" bajo un nombre inventado, usá:
- Placeholders genéricos tipo "Subject 1", "Class A", "Artifact", "Magic" en
  los textos que dependan de un dataset real
- O directamente dejá esos textos vacíos/con `{{binding}}` de ejemplo, ya que
  se completan con datos reales al implementar

## 2. Íconos y sprites: no diseñes arte nuevo
Ya existen sprites reales (PNG) para cada artifact, magic, passive y research
node en el repo (`public/assets/{artifactImages,magicImages,passiveImages,
researchImages}/`). No hace falta que dibujes íconos temáticos por ítem —
un placeholder simple (silueta, círculo con "?", glifo genérico) alcanza; la
implementación reemplaza esos placeholders por los sprites reales.

## 3. Lo que sí definí con detalle
- Layout, spacing, jerarquía tipográfica (Kalam/Caveat), paleta de color exacta
  (hex por elemento), animaciones/transiciones, y la lógica de interacción
  (qué pantalla lleva a cuál, qué abre el FAB, qué hace cada botón)
- La cantidad de columnas en cada grid, el orden visual de las filas (incluí
  celdas vacías si son parte del layout, no las quites)

## 4. Contexto de pantallas
Estamos iterando sobre un flujo de 5 pantallas: Home → (Research | Character
Select → Class Select → Dashboard). El Dashboard tiene un FAB con 2 categorías
(Artifact, Magic) que abre un bottom sheet con buscador + grid de 5 columnas.
Si agregás una pantalla nueva o cambiás una existente, mantené ese flujo salvo
que digas explícitamente que estás reemplazando la navegación.

Avisame en el chat (no en el código del canvas) si necesitás saber el nombre
exacto de un dato real (ej. "¿qué stats existen?") en vez de inventarlo.
