/**
 * Asset resolution for sprites and the game font.
 *
 * Every helper below resolves into `public/assets/...` — the organized, renamed,
 * size-optimized set that actually ships. Never reference `raw-assets/` (the gitignored,
 * unorganized ~300MB APK sprite dump — source material for `scripts/organize-assets.mjs`,
 * not something the app itself ever loads) from component code. If the asset you need isn't
 * under `public/assets/` yet, it needs organizing first — see
 * research/game-data-sources.md's "Sprites: real APK extraction" section.
 *
 * These sprites and the MagicSurvival.ttf font are extracted game assets originally
 * sourced from the public repo TomkoSK/magic-survival-builder, not original artwork
 * from this project — the underlying art belongs to the Magic Survival developers.
 * They now ship locally under public/assets/ (see public/assets/{artifactImages,
 * magicImages,passiveImages,researchImages}/ and public/assets/magicSurvival.ttf)
 * instead of being hotlinked, so the app works offline and doesn't depend on a
 * third-party repo staying up. `VITE_ASSET_BASE_URL` is still overridable if you
 * ever want to point at a CDN instead.
 *
 * Falls back to `import.meta.env.BASE_URL` (Vite's own `base` config value, e.g.
 * "/magic-survival-cheet-sheet/" on GitHub Pages, "/" in dev) rather than a hardcoded
 * "/assets/" — a root-absolute path breaks the moment the app is served from a
 * sub-path, which is exactly how GitHub Pages project sites work.
 */
export const IMAGE_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL ?? `${import.meta.env.BASE_URL}assets/`;

export const FONT_URL = `${IMAGE_BASE_URL}magicSurvival.ttf`;

export function assetUrl(relativePath: string): string {
  return `${IMAGE_BASE_URL}${relativePath}`;
}

export function artifactImage(fileName: string): string {
  return assetUrl(`artifactImages/${fileName}`);
}

export function magicImage(fileName: string): string {
  return assetUrl(`magicImages/${fileName}`);
}

export function passiveImage(fileName: string): string {
  return assetUrl(`passiveImages/${fileName}`);
}

export function researchImage(fileName: string): string {
  return assetUrl(`researchImages/${fileName}`);
}

export function classImage(fileName: string): string {
  return assetUrl(`classImages/${fileName}`);
}

export function subjectImage(fileName: string): string {
  return assetUrl(`subjectImages/${fileName}`);
}

/** One frame (1-indexed) of a Subject's idle-sway animation — see public/assets/subjectAnim/{slug}/. */
export function subjectAnimFrame(slug: string, frame: number): string {
  return assetUrl(`subjectAnim/${slug}/${frame}.png`);
}

export function baseMagicImage(fileName: string): string {
  return assetUrl(`baseMagicImages/${fileName}`);
}

export function synergyImage(fileName: string): string {
  return assetUrl(`synergyImages/${fileName}`);
}

/** Generic chrome/decoration assets not tied to a game entity (dividers, frames, icons). */
export function uiImage(fileName: string): string {
  return assetUrl(`uiImages/${fileName}`);
}

/**
 * One of the 7 real in-game button-click sound variants (public/assets/audio/ui/) — the
 * game picks one at random per click, see research/game-data-sources.md. Not wired up to
 * any button yet; this is just the path helper for when that lands.
 */
export function uiClickSound(variant: number): string {
  return assetUrl(`audio/ui/Sound_UI${variant}.wav`);
}
