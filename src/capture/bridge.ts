import i18n from "../i18n";
import { baseMagicSpriteUrl } from "../data/magics";
import { ITEM_BY_ID } from "../engine/tierAdaptive";
import { applyCaptureEvent, applyPick, refName } from "./apply";
import type { Frame } from "./frame";
import { buildLibrary, type Library } from "./library";
import { CaptureSession, observe, type Observation, type OwnedRef } from "./session";

/**
 * The live half of the screen reading, only alive inside the Android companion
 * (`android/`, `OverlayService`): the app there captures the screen and exposes each frame at
 * `<base>__capture/frame`, then calls `window.__msCapture.tick()` twice a second while the
 * game — not this panel — is what's on screen. In a plain browser `MSCompanionHost` doesn't
 * exist and none of this runs.
 */

interface CompanionHost {
  /** Shows a short line over the game. */
  toast(text: string): void;
  /** Asks which of these level-up rows was taken; the answer comes back through `resolvePick`. */
  askPick(prompt: string, optionsJson: string): void;
  /** What the reader is seeing right now — every tick, so the host can tell a working reader from a silent one. */
  status(text: string): void;
}

declare global {
  interface Window {
    MSCompanionHost?: CompanionHost;
    __msCapture?: { tick: () => void; resolvePick: (index: number) => void };
  }
}

const FRAME_URL = `${import.meta.env.BASE_URL}__capture/frame`;

/** The latest captured frame, or null when the screen hasn't changed since the last one (HTTP 204). */
async function fetchFrame(): Promise<Frame | null> {
  const response = await fetch(FRAME_URL, { cache: "no-store" });
  if (response.status !== 200) return null;
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < 8) return null;
  // 8-byte header (width, height: little-endian int32), then RGBA rows.
  const header = new DataView(buffer, 0, 8);
  const width = header.getInt32(0, true);
  const height = header.getInt32(4, true);
  if (width <= 0 || height <= 0 || buffer.byteLength < 8 + width * height * 4) return null;
  return { width, height, data: new Uint8ClampedArray(buffer, 8, width * height * 4) };
}

async function loadSprite(url: string): Promise<Frame | null> {
  try {
    const bitmap = await createImageBitmap(await (await fetch(url)).blob());
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return { width: bitmap.width, height: bitmap.height, data };
  } catch {
    return null;
  }
}

/** One short line for the host's status display: which screen, and how much of it was read. */
function describe(observation: Observation): string {
  switch (observation.screen) {
    case "selectMagic":
      return i18n.t("capture.status.selectMagic", { count: observation.options.length });
    case "selectAttribute":
      return i18n.t("capture.status.selectAttribute", { magic: observation.magicId ? refName({ kind: "magic", id: observation.magicId }) : "?" });
    case "treasureChest":
      return i18n.t("capture.status.treasureChest", {
        selected: observation.selectedId ? (ITEM_BY_ID[observation.selectedId]?.name ?? observation.selectedId) : i18n.t("capture.status.nothingSelected"),
      });
    case "ownedMagic":
      return i18n.t("capture.status.ownedMagic", { count: observation.entries.length });
    case "ownedArtifact":
      return i18n.t("capture.status.ownedArtifact", { count: observation.ids.length });
    default:
      return i18n.t(`capture.status.${observation.screen}`);
  }
}

function iconUrl(ref: OwnedRef): string {
  return ref.kind === "magic" ? baseMagicSpriteUrl(ref.id) : (ITEM_BY_ID[ref.id]?.image ?? "");
}

export function initCaptureBridge() {
  const host = window.MSCompanionHost;
  if (!host) return;

  const session = new CaptureSession();
  let library: Promise<Library> | null = null;
  let lastObservation: Observation | null = null;
  let askedOptions: OwnedRef[] = [];
  let busy = false;

  async function tick() {
    if (busy) return;
    busy = true;
    try {
      const frame = await fetchFrame();
      if (frame && !library) {
        host!.status(i18n.t("capture.status.loading"));
        library = buildLibrary(loadSprite);
      }
      const sprites = library ? await library : null;
      if (sprites && sprites.icons.length + sprites.artifacts.length === 0) {
        host!.status(i18n.t("capture.status.noSprites"));
        return;
      }
      // An unchanged screen is the previous reading again — that repeat is what confirms a list as stable.
      const observation = frame && sprites ? observe(frame, sprites) : lastObservation;
      if (!observation) {
        host!.status(i18n.t("capture.status.waiting"));
        return;
      }
      lastObservation = observation;
      host!.status(describe(observation));
      for (const event of session.push(observation)) {
        const message = applyCaptureEvent(event);
        if (message) host!.toast(message);
        if (event.type === "pickNeeded") {
          askedOptions = event.options;
          host!.askPick(i18n.t("capture.pickPrompt"), JSON.stringify(event.options.map((ref) => ({ label: refName(ref), icon: iconUrl(ref) }))));
        }
      }
    } catch (error) {
      // The next tick reads the screen again; the host's status line is where a persistent failure shows.
      host!.status(i18n.t("capture.status.error", { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      busy = false;
    }
  }

  window.__msCapture = {
    tick: () => void tick(),
    resolvePick: (index) => {
      const ref = askedOptions[index];
      askedOptions = [];
      if (!ref) return;
      const message = applyPick(ref);
      if (message) host.toast(message);
    },
  };
}
