import { REF_WIDTH, type Frame } from "./frame";
import { SELECT_MAGIC } from "./geometry";
import type { ScreenRect } from "./keepOut";
import type { Library, Match } from "./library";
import { classifyScreen, readOwnedArtifacts, readOwnedMagic, readSelectAttribute, readSelectMagic, readTreasureChest, type Screen } from "./recognize";

/**
 * Turns a stream of screen readings into what actually happened in the run. A single frame
 * only says what is on screen; what the player *did* shows in the sequence — a chest with a
 * card selected followed by the run resuming means that card was obtained.
 */

/** A magic or passive, as offered by a level-up or listed in Owned Magic. */
export interface OwnedRef {
  kind: "magic" | "passive";
  id: string;
}

export interface OwnedLevel extends OwnedRef {
  level: number;
  special: boolean;
}

/** One row of a level-up offer: where it is, and what it offers (null when the icon wasn't recognized). */
export interface OfferRow {
  ref: OwnedRef | null;
  rect: ScreenRect;
}

/** What one frame shows, already reduced to ids. */
export type Observation =
  | { screen: "gameplay" | "unknown" | "pause" | "synergy" | "enterArea" | "lifeOrDeath" }
  | { screen: "selectMagic"; options: OwnedRef[]; rows: OfferRow[]; retrieve: ScreenRect | null }
  | { screen: "selectAttribute"; magicId: string | null; groupLevel: number | null; talent: string | null }
  | { screen: "treasureChest"; selectedId: string | null; hasSelection: boolean }
  | { screen: "ownedMagic"; entries: OwnedLevel[] }
  | { screen: "ownedArtifact"; ids: string[] };

export type CaptureEvent =
  /** "Learn" was pressed with this talent selected (the magic reached that talent's level). */
  | { type: "talentLearned"; magicId: string; groupLevel: number; talent: string }
  /**
   * A level-up closed without a talent pick: a plain row was tapped, or "Mana Retrieve" (which declines the
   * level-up — the character stays at its level). The game shows no selection there, so which it was is unknown.
   */
  | { type: "pickNeeded"; options: OwnedRef[] }
  | { type: "artifactObtained"; id: string }
  /** "Enter Area" was pressed and the run came up: a new run, not more of the last one. */
  | { type: "runStarted" }
  /** The death prompt came up and the run did not come back: it is over. */
  | { type: "runEnded" }
  /** ...and then it did come back after all (a revive takes an ad's length): the same run goes on. */
  | { type: "runResumed" }
  /** The game's own Owned Magic list was on screen: the run's real magics and levels. */
  | { type: "magicsSynced"; entries: OwnedLevel[] }
  | { type: "artifactsSynced"; ids: string[] };

/** A recognized icon as a magic/passive reference (a class icon or an unrecognized one is dropped). */
function ownedRef(match: Match | null): OwnedRef[] {
  return match && (match.kind === "magic" || match.kind === "passive") ? [{ kind: match.kind, id: match.id }] : [];
}

/** Reads one frame. Anything not recognized with confidence is left out rather than guessed. */
export function observe(frame: Frame, library: Library): Observation {
  const screen: Screen = classifyScreen(frame);
  switch (screen) {
    case "selectMagic": {
      const reading = readSelectMagic(frame, library);
      const rows = reading.rows.map((row) => ({
        ref: ownedRef(row.match)[0] ?? null,
        rect: {
          x: SELECT_MAGIC.rowLeft / REF_WIDTH,
          y: row.top / frame.height,
          w: (SELECT_MAGIC.rowRight - SELECT_MAGIC.rowLeft) / REF_WIDTH,
          h: (row.bottom - row.top + 1) / frame.height,
        },
      }));
      // The "Mana N% Retrieve" button under the rows — tapping it declines the level-up. Not every level-up has one.
      const retrieve = reading.retrieve && {
        x: SELECT_MAGIC.retrieveLeft / REF_WIDTH,
        y: reading.retrieve.top / frame.height,
        w: SELECT_MAGIC.retrieveWidth / REF_WIDTH,
        h: (reading.retrieve.bottom - reading.retrieve.top + 1) / frame.height,
      };
      return { screen, options: rows.flatMap((row) => (row.ref ? [row.ref] : [])), rows, retrieve };
    }
    case "selectAttribute": {
      const reading = readSelectAttribute(frame, library);
      return {
        screen,
        magicId: reading.magicId,
        groupLevel: reading.groupLevel,
        talent: reading.selected === null ? null : (reading.talents[reading.selected] ?? null),
      };
    }
    case "treasureChest": {
      const reading = readTreasureChest(frame, library);
      return {
        screen,
        selectedId: reading.selected === null ? null : (reading.offers[reading.selected]?.id ?? null),
        // A card is selected even when which artifact it is wasn't recognized.
        hasSelection: reading.selected !== null,
      };
    }
    case "ownedMagic":
      return {
        screen,
        entries: readOwnedMagic(frame, library).flatMap((entry) =>
          entry.level > 0 ? ownedRef(entry.match).map((ref) => ({ ...ref, level: entry.level, special: entry.special })) : []
        ),
      };
    case "ownedArtifact":
      return { screen, ids: readOwnedArtifacts(frame, library).flatMap((match) => (match ? [match.id] : [])) };
    default:
      return { screen };
  }
}

type Pending =
  | { kind: "offer"; options: OwnedRef[] }
  | { kind: "attribute"; magicId: string | null; groupLevel: number | null; talent: string | null }
  | { kind: "chest"; selectedId: string | null };

/** One reading of an offer is contained in another: the same offer, read more or less completely. */
const within = (a: OwnedRef[], b: OwnedRef[]) => a.every((o) => b.some((n) => n.kind === o.kind && n.id === o.id));

/** What a choice screen amounted to, once it is over. */
function outcome(pending: Pending | null): CaptureEvent[] {
  if (pending?.kind === "offer" && pending.options.length > 0) return [{ type: "pickNeeded", options: pending.options }];
  if (pending?.kind === "attribute" && pending.magicId && pending.groupLevel && pending.talent) {
    return [{ type: "talentLearned", magicId: pending.magicId, groupLevel: pending.groupLevel, talent: pending.talent }];
  }
  if (pending?.kind === "chest" && pending.selectedId) return [{ type: "artifactObtained", id: pending.selectedId }];
  return [];
}

/** How many readings (four a second) "Enter Area" still counts for once it leaves the screen: the area takes a while to load. */
const AREA_GRACE = 60;
/** How many readings without the run coming back, after the death prompt, before the run is called over. */
const DEATH_GRACE = 12;

export class CaptureSession {
  /** Readings left during which the run appearing means "Enter Area was just pressed". */
  private areaGrace = 0;
  /** Readings since the death prompt that showed neither it nor the run; -1 when there was no prompt. */
  private sinceDeath = -1;
  private endReported = false;
  /** The choice screen the player is in the middle of, until the run resumes (or the next choice starts). */
  private pending: Pending | null = null;
  /** The last owned-list reading, and whether it was already reported — a list is trusted once two frames in a row agree. */
  private lastList = "";
  private listReported = false;

  push(observation: Observation): CaptureEvent[] {
    const lifecycle = this.lifecycle(observation);
    // A new run starts clean: no choice of the last one is still open.
    if (lifecycle.some((event) => event.type === "runStarted")) this.pending = null;
    return [...lifecycle, ...this.choices(observation)];
  }

  /** Where one run ends and the next begins. */
  private lifecycle(observation: Observation): CaptureEvent[] {
    switch (observation.screen) {
      case "enterArea":
        this.areaGrace = AREA_GRACE;
        return [];
      case "lifeOrDeath":
        this.sinceDeath = 0;
        return [];
      case "gameplay": {
        const events: CaptureEvent[] = this.areaGrace > 0 ? [{ type: "runStarted" }] : this.endReported ? [{ type: "runResumed" }] : [];
        this.areaGrace = 0;
        this.sinceDeath = -1;
        this.endReported = false;
        return events;
      }
      default:
        if (this.areaGrace > 0) this.areaGrace--;
        if (this.sinceDeath >= 0 && !this.endReported && ++this.sinceDeath >= DEATH_GRACE) {
          this.endReported = true;
          return [{ type: "runEnded" }];
        }
        return [];
    }
  }

  /** What the player picked on the choice screens, and what the game's own lists show. */
  private choices(observation: Observation): CaptureEvent[] {
    if (observation.screen !== "ownedMagic" && observation.screen !== "ownedArtifact") {
      this.lastList = "";
      this.listReported = false;
    }

    switch (observation.screen) {
      case "selectMagic": {
        const open = this.pending?.kind === "offer" ? this.pending : null;
        if (open && (within(observation.options, open.options) || within(open.options, observation.options))) {
          // Still the same offer: keep its fullest reading.
          if (observation.options.length > open.options.length) this.pending = { kind: "offer", options: observation.options };
          return [];
        }
        // A new level-up — possibly right behind another choice, with no frame of the run in between.
        const events = outcome(this.pending);
        this.pending = { kind: "offer", options: observation.options };
        return events;
      }

      case "selectAttribute": {
        const previous = this.pending?.kind === "attribute" ? this.pending : null;
        // Reached by tapping a Select Magic row: that offer turns out to be this talent pick, not an unknown one.
        const events = previous || this.pending?.kind === "offer" ? [] : outcome(this.pending);
        this.pending = {
          kind: "attribute",
          magicId: observation.magicId ?? previous?.magicId ?? null,
          groupLevel: observation.groupLevel ?? previous?.groupLevel ?? null,
          // "Learn" closes the screen on whatever was selected last; a selection can change but not be undone.
          talent: observation.talent ?? previous?.talent ?? null,
        };
        return events;
      }

      case "treasureChest": {
        const previous = this.pending?.kind === "chest" ? this.pending : null;
        const events = previous ? [] : outcome(this.pending);
        this.pending = { kind: "chest", selectedId: observation.selectedId ?? previous?.selectedId ?? null };
        return events;
      }

      case "gameplay": {
        const events = outcome(this.pending);
        this.pending = null;
        return events;
      }

      case "ownedMagic":
      case "ownedArtifact": {
        const reading = JSON.stringify(observation);
        if (reading !== this.lastList) {
          this.lastList = reading;
          this.listReported = false;
          return [];
        }
        if (this.listReported) return [];
        this.listReported = true;
        return observation.screen === "ownedMagic" ? [{ type: "magicsSynced", entries: observation.entries }] : [{ type: "artifactsSynced", ids: observation.ids }];
      }

      default:
        // Pause, Synergy, a transition frame: nothing happened, and a choice in progress stays in progress.
        return [];
    }
  }
}
