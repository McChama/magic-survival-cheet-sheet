// Node-side image loading for the screen-reading checks: the same `Frame` shape the WebView
// builds from a live capture, decoded here with sharp from the fixtures and the shipped sprites.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const FIXTURES = resolve(root, "scripts/capture-fixtures");

/** A fixture screenshot as a Frame, optionally resized to `width` (the live capture is narrower than the phone's screen). */
export async function loadFixture(name, width) {
  let image = sharp(resolve(FIXTURES, `${name}.jpg`));
  if (width) image = image.resize({ width, kernel: "linear" });
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

/** A sprite URL as the data files build it (`<base>assets/...`) -> public/assets/... */
export async function loadSprite(url) {
  const relative = url.slice(url.indexOf("assets/"));
  try {
    const { data, info } = await sharp(resolve(root, "public", relative)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return { width: info.width, height: info.height, data };
  } catch {
    return null;
  }
}
