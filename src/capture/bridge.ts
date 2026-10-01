import i18n from "../i18n";
import { baseMagicSpriteUrl } from "../data/magics";
import { ITEM_BY_ID } from "../engine/tierAdaptive";
import { useUiStore } from "../store/useUiStore";
import { ENCHANT } from "../data/enchant";
import { applyCaptureEvent, applyPick, isEnchant, refName } from "./apply";
import type { Frame } from "./frame";
import { readKeepOut, type ScreenRect } from "./keepOut";
import { decodeLibrary, type EncodedLibrary, type Library } from "./library";
import { CaptureSession, observe, type Observation, type OwnedRef } from "./session";

/**
 * The live half of the screen reading, only alive inside the Android companion
 * (`android/`, `OverlayService`): the app there captures the screen and exposes each frame at
 * `<base>__capture/frame`, then calls `window.__msCapture.tick()` four times a second while the
 * game — not this panel — is what's on screen. In a plain browser `MSCompanionHost` doesn't
 * exist and none of this runs.
 *
 * It is built to cost nothing while the player is simply playing, which is nearly all the time:
 * the host itself tells the run from a menu (three pixels) and, while the run stays up, neither
 * copies a frame nor calls in here. A frame only crosses over when a menu is up, and a menu is a
 * still picture — one frame, then "unchanged" until it closes.
 */

interface CompanionHost {
  /** Shows a short line over the game. */
  toast(text: string): void;
  /** Asks which of these level-up rows was taken; the answer comes back through `resolvePick`. */
  askPick(prompt: string, optionsJson: string): void;
  /**
   * Select Magic is up: cover these screen rectangles (fractions of the screen; the offer's rows, then the Retrieve
   * button) so a first tap on one only marks it — reported through `mark` — and the next tap on the marked one
   * reaches the game. Sent every tick as a keep-alive; the host drops the cover on its own if they stop.
   */
  guard(rectsJson: string): void;
  unguard(): void;
  /** Marks a guard again without the player tapping it (the guards were rebuilt while its mark still stood). */
  remark(index: number): void;
  /** Nothing readable has been on screen for a while (the game's main menu, another app): the host may read less often. */
  idle(idle: boolean): void;
  /**
   * The areas of the current screen the reader looks at (fractions of the screen; "[]" when there are none). The
   * host's bubble is in the captured picture too, so it steps aside while it would cover one — and only then.
   */
  avoid(rectsJson: string): void;
  /**
   * A choice the game itself selects before it confirms, so it needs no guards: 0 = none on screen; the
   * artifact-offer panel, 1 = open with nothing selected, 2 = a card selected and "Obtain" still to be pressed;
   * Enchant's grid, 3 = open, 4 = a magic selected and "Selected" still to be pressed. The host's bubble shows it
   * (the Owned Artifact icon for the panel, the Owned Magic icon for the grid — white, then gold), the way it
   * shows a level-up's mark.
   */
  choice(state: number): void;
  /** What the reader is seeing right now — every tick, so the host can tell a working reader from a silent one. */
  status(text: string): void;
}

declare global {
  interface Window {
    MSCompanionHost?: CompanionHost;
    __msCapture?: {
      /**
       * `playing`: the host already saw the run itself on screen, so there is no frame to fetch. The rest is where
       * the host's bubble is right now, as fractions of the screen — it is in the captured picture too.
       */
      tick: (playing?: boolean, bubbleX?: number, bubbleY?: number, bubbleW?: number, bubbleH?: number) => void;
      /** A tap just went through to the game while a row was marked: that was the confirming tap. */
      passed: () => void;
      resolvePick: (index: number) => void;
      mark: (index: number) => void;
      /** The panel went off-screen (or came back): nobody is looking, so nothing should keep animating. */
      parked: (parked: boolean) => void;
    };
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

/** The sprite templates, generated ahead of time (`npm run capture:templates`) and loaded only once a menu needs reading. */
function loadLibrary(): Promise<Library> {
  return import("./templates.generated.json").then((module) => decodeLibrary(module.default as unknown as EncodedLibrary));
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
    case "enchant":
      return i18n.t("capture.status.enchant", {
        count: observation.tiles,
        selected: observation.magicId ? refName({ kind: "magic", id: observation.magicId }) : i18n.t(observation.selected === null ? "capture.status.nothingSelected" : "capture.status.unrecognized"),
      });
    default:
      return i18n.t(`capture.status.${observation.screen}`);
  }
}

function iconUrl(ref: OwnedRef): string {
  if (isEnchant(ref)) return ENCHANT.image;
  return ref.kind === "magic" ? baseMagicSpriteUrl(ref.id) : (ITEM_BY_ID[ref.id]?.image ?? "");
}

/** The state `Host.choice` is told about (see there). */
function choiceState(observation: Observation): number {
  if (observation.screen === "treasureChest") return observation.hasSelection ? 2 : 1;
  if (observation.screen === "enchant") return observation.selected === null ? 3 : 4;
  return 0;
}

export function initCaptureBridge() {
  const host = window.MSCompanionHost;
  if (!host) return;

  const session = new CaptureSession();
  let library: Promise<Library> | null = null;
  let lastObservation: Observation | null = null;
  let askedOptions: OwnedRef[] = [];
  let busy = false;
  let keepOut: ScreenRect[] = [];
  let avoidSent = "[]";
  let choiceSent = 0;
  let statusLine = "";
  /** Select Magic's tap guards: what each guarded row offers (the Retrieve button, when there is one, is one past the last), and the one the player marked. */
  let guarding = false;
  let guardRefs: (OwnedRef | null)[] = [];
  let marked: number | null = null;
  /** The mark a tap just went through on (the host saw the tap reach the game), until the screen closing confirms it. */
  let confirmed: { index: number; at: number } | null = null;
  /** Readings in a row that did not show Select Magic while its guards were up. */
  let offScreen = 0;
  let bubble: ScreenRect | null = null;
  let unknownSince: number | null = null;
  let idleSent = false;

  /** A confirming tap that closed nothing within this long was a stray one (on the gap between two rows, say). */
  const STRAY_MS = 700;
  /** With nothing readable on screen for this long, the host is told it can read less often. */
  const IDLE_AFTER_MS = 2000;

  function ask(offered: OwnedRef[]) {
    // Never Enchant: taking it opens its grid, and then this offer is settled there instead of asked about.
    const options = offered.filter((ref) => !isEnchant(ref));
    if (options.length === 0) return;
    askedOptions = options;
    host!.askPick(i18n.t("capture.pickPrompt"), JSON.stringify(options.map((ref) => ({ label: refName(ref), icon: iconUrl(ref) }))));
  }

  /**
   * A level-up closed on a plain row or on Retrieve. The game itself shows no selection there, but the guards made
   * the player mark one first, and the game only ever received a tap on the marked one — so that is what was taken.
   */
  function resolveOffer(options: OwnedRef[]) {
    const index = confirmed?.index ?? marked;
    confirmed = null;
    marked = null;
    if (guarding) host!.unguard();
    guarding = false;
    // Tapped before the guards were up (the screen is read a moment after it appears): fall back to asking.
    if (index === null) return ask(options);
    // Mana Retrieve: nothing taken, and the character keeps its level.
    if (index >= guardRefs.length) return host!.toast(i18n.t("capture.retrieved"));
    const ref = guardRefs[index];
    if (!ref) return ask(options);
    const message = applyPick(ref);
    if (message) host!.toast(message);
  }

  async function tick(playing = false) {
    if (busy) return;
    busy = true;
    try {
      const now = Date.now();
      let observation: Observation | null = lastObservation;
      if (playing) {
        observation = { screen: "gameplay" };
        keepOut = [];
        statusLine = describe(observation);
      } else {
        const frame = await fetchFrame();
        // No frame = an unchanged screen: the previous reading again — that repeat is what confirms a list as stable.
        if (frame) {
          const sprites = await (library ??= loadLibrary());
          const started = performance.now();
          observation = observe(frame, sprites, bubble);
          if (observation.screen !== "unknown") keepOut = readKeepOut(frame, observation.screen);
          // How long one reading takes on this phone, shown in the host's status line: the number to watch on a slow one.
          statusLine = i18n.t("capture.status.timed", { status: describe(observation), ms: Math.round(performance.now() - started) });
        }
      }
      if (!observation) {
        host!.status(i18n.t("capture.status.waiting"));
        return;
      }
      lastObservation = observation;
      host!.status(statusLine);
      // "unknown" is a transition frame as often as not: it changes nothing.
      if (observation.screen !== "unknown") {
        const avoid = JSON.stringify(keepOut);
        if (avoid !== avoidSent) {
          avoidSent = avoid;
          host!.avoid(avoid);
        }
        const choice = choiceState(observation);
        if (choice !== choiceSent) {
          choiceSent = choice;
          host!.choice(choice);
        }
      }
      for (const event of session.push(observation, now)) {
        const message = applyCaptureEvent(event);
        if (message) host!.toast(message);
        if (event.type === "pickNeeded") resolveOffer(event.options);
      }

      if (observation.screen === "selectMagic") {
        offScreen = 0;
        if (confirmed && now - confirmed.at > STRAY_MS) {
          // The tap that went through closed nothing: it wasn't on the marked row. The mark stands.
          marked = confirmed.index;
          confirmed = null;
        }
        // While a confirming tap is settling the screen is on its way out: guards back up now would only block the
        // player's controls for the first moment of the run.
        if (!confirmed) {
          // The rows are settled once one is marked; until then each reading may still find more of them.
          if (marked === null) guardRefs = observation.rows.map((row) => row.ref);
          host!.guard(JSON.stringify([...observation.rows.map((row) => row.rect), ...(observation.retrieve ? [observation.retrieve] : [])]));
          if (!guarding && marked !== null) host!.remark(marked);
          guarding = true;
        }
      } else {
        // Select Magic is gone. The guards must not outlive it — they would swallow the player's first touches of
        // the run — so they drop on the second reading without it even if what replaced it isn't recognized yet
        // (a fade); one odd frame alone is not enough to drop a mark.
        if (guarding && (observation.screen !== "unknown" || ++offScreen >= 2)) {
          host!.unguard();
          guarding = false;
        }
        // Any other screen ends the offer (Select Attribute takes it from here on its own).
        if (observation.screen !== "unknown") {
          marked = null;
          confirmed = null;
        }
      }

      unknownSince = observation.screen === "unknown" ? (unknownSince ?? now) : null;
      const idle = unknownSince !== null && now - unknownSince >= IDLE_AFTER_MS;
      if (idle !== idleSent) {
        idleSent = idle;
        host!.idle(idle);
      }
    } catch (error) {
      // The next tick reads the screen again; the host's status line is where a persistent failure shows.
      host!.status(i18n.t("capture.status.error", { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      busy = false;
    }
  }

  window.__msCapture = {
    tick: (playing, x, y, w, h) => {
      bubble = w && h ? { x: x ?? 0, y: y ?? 0, w, h } : null;
      void tick(playing);
    },
    passed: () => {
      if (marked === null) return;
      confirmed = { index: marked, at: Date.now() };
      marked = null;
      // The host has already taken the guards down, so the game's controls are free at once.
      guarding = false;
    },
    parked: (parked) => {
      document.documentElement.classList.toggle("parked", parked);
      useUiStore.getState().setParked(parked);
    },
    mark: (index) => {
      marked = index;
    },
    resolvePick: (index) => {
      const ref = askedOptions[index];
      askedOptions = [];
      if (!ref) return;
      const message = applyPick(ref);
      if (message) host.toast(message);
    },
  };

  // This module loads a moment after the page (`main.tsx` imports it on demand), so the host may have parked the
  // panel before `parked` existed: it then only set the class (OverlayService's `markParked`). Catch up with it.
  if (document.documentElement.classList.contains("parked")) useUiStore.getState().setParked(true);
}
