import { REF_WIDTH, type Frame } from "./frame";
import { SELECT_MAGIC } from "./geometry";
import type { ScreenRect } from "./keepOut";
import type { Library, Match } from "./library";
import {
  classifyScreen,
  readClassLevel,
  readClassSelect,
  readOwnedArtifacts,
  readOwnedMagic,
  readSelectAttribute,
  readSelectMagic,
  readResearch,
  readTestSubject,
  readTreasureChest,
  readUnlockedSubjects,
  type Screen,
} from "./recognize";

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
  | { screen: "treasureChest"; selectedId: string | null; hasSelection: boolean; offers: (string | null)[] }
  | { screen: "ownedMagic"; entries: OwnedLevel[]; className: string | null }
  | { screen: "ownedArtifact"; ids: string[] }
  /** The Class menu, on the class marked "Selected" (null when its name wasn't read with confidence), and that class's level. */
  | { screen: "classSelect"; className: string | null; level: number | null }
  /** The Test Subject menu, on the subject marked "Applying", and every subject it draws as unlocked. */
  | { screen: "testSubject"; subject: string | null; unlocked: string[] }
  /** The Research menu: each bought node's level. */
  | { screen: "research"; levels: Record<string, number> };

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
  | { type: "magicsSynced"; entries: OwnedLevel[]; className: string | null }
  | { type: "artifactsSynced"; ids: string[] }
  /** The game's Class menu shows this class as the one selected, at this level: what the next run will be played with. */
  | { type: "classChosen"; className: string; level: number | null }
  /** The game's Test Subject menu shows this subject as the one applied. */
  | { type: "subjectChosen"; subject: string }
  /** ...and these as the unlocked ones (Wizard, always unlocked, isn't listed). */
  | { type: "subjectsUnlocked"; subjects: string[] }
  /** The game's Research menu: what is bought. */
  | { type: "researchRead"; levels: Record<string, number> };

/** A recognized icon as a magic/passive reference (a class icon or an unrecognized one is dropped). */
function ownedRef(match: Match | null): OwnedRef[] {
  return match && (match.kind === "magic" || match.kind === "passive") ? [{ kind: match.kind, id: match.id }] : [];
}

/** A screen rectangle in this frame's pixels. */
function toFrame(rect: ScreenRect | null | undefined, frame: Frame) {
  return rect ? { x: Math.floor(rect.x * frame.width), y: Math.floor(rect.y * frame.height), w: Math.ceil(rect.w * frame.width), h: Math.ceil(rect.h * frame.height) } : null;
}

/**
 * Reads one frame. Anything not recognized with confidence is left out rather than guessed.
 * `bubble`: where the companion's own bubble is on the screen, so it isn't read as part of what it sits on.
 */
export function observe(frame: Frame, library: Library, bubble?: ScreenRect | null): Observation {
  const screen: Screen = classifyScreen(frame);
  switch (screen) {
    case "selectMagic": {
      const reading = readSelectMagic(frame, library, toFrame(bubble, frame));
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
        offers: reading.offers.map((offer) => offer?.id ?? null),
      };
    }
    case "ownedMagic": {
      const cards = readOwnedMagic(frame, library);
      return {
        screen,
        entries: cards.flatMap((entry) => (entry.level > 0 ? ownedRef(entry.match).map((ref) => ({ ...ref, level: entry.level, special: entry.special })) : [])),
        // The first tile is the Class the run is being played with.
        className: cards.find((entry) => entry.match?.kind === "class")?.match?.id ?? null,
      };
    }
    case "ownedArtifact":
      return { screen, ids: readOwnedArtifacts(frame, library).flatMap((match) => (match ? [match.id] : [])) };
    case "classSelect":
      return { screen, className: readClassSelect(frame), level: readClassLevel(frame) };
    case "testSubject":
      return { screen, subject: readTestSubject(frame), unlocked: readUnlockedSubjects(frame, toFrame(bubble, frame)) };
    case "research":
      return { screen, levels: readResearch(frame) };
    default:
      return { screen };
  }
}

type Pending =
  | { kind: "offer"; options: OwnedRef[] }
  | { kind: "attribute"; magicId: string | null; groupLevel: number | null; talent: string | null }
  | { kind: "chest"; selectedId: string | null; offers: string };

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

/** How long "Enter Area" still counts for once it leaves the screen: the area takes a while to load. */
const AREA_GRACE_MS = 15000;
/** How long without the run coming back, after the death prompt, before the run is called over. */
const DEATH_GRACE_MS = 3000;

export class CaptureSession {
  /** Until when the run appearing means "Enter Area was just pressed". */
  private areaUntil = 0;
  /** When the death prompt was last on screen; null when there was none. */
  private deathAt: number | null = null;
  private endReported = false;
  /** The last reading of a setup menu: one is trusted once two in a row agree (the first may catch it fading in). */
  private lastSetup = "";
  /** What was last reported from each setup menu, so a fact is reported when it changes, not on every reading. */
  private reported: Record<string, string> = {};
  /** The choice screen the player is in the middle of, until the run resumes (or the next choice starts). */
  private pending: Pending | null = null;
  /** The last owned-list reading, and whether it was already reported — a list is trusted once two frames in a row agree. */
  private lastList = "";
  private listReported = false;

  /** `now`: when this reading was taken (the readings come at an uneven pace: fast around a change, slow when idle). */
  push(observation: Observation, now = Date.now()): CaptureEvent[] {
    const lifecycle = this.lifecycle(observation, now);
    // A new run starts clean: no choice of the last one is still open.
    if (lifecycle.some((event) => event.type === "runStarted")) this.pending = null;
    return [...lifecycle, ...this.setup(observation), ...this.choices(observation)];
  }

  /** What the run will be played with, as the menus before it show it. */
  private setup(observation: Observation): CaptureEvent[] {
    if (observation.screen !== "classSelect" && observation.screen !== "testSubject" && observation.screen !== "research") {
      this.lastSetup = "";
      return [];
    }
    const reading = JSON.stringify(observation);
    if (reading !== this.lastSetup) {
      this.lastSetup = reading;
      return [];
    }
    const events: CaptureEvent[] = [];
    const report = (key: string, value: unknown, event: CaptureEvent) => {
      const written = JSON.stringify(value);
      if (this.reported[key] === written) return;
      this.reported[key] = written;
      events.push(event);
    };
    if (observation.screen === "classSelect" && observation.className) {
      report("class", [observation.className, observation.level], { type: "classChosen", className: observation.className, level: observation.level });
    }
    if (observation.screen === "testSubject" && observation.subject) {
      report("subject", observation.subject, { type: "subjectChosen", subject: observation.subject });
      report("unlocked", observation.unlocked, { type: "subjectsUnlocked", subjects: observation.unlocked });
    }
    if (observation.screen === "research") report("research", observation.levels, { type: "researchRead", levels: observation.levels });
    return events;
  }

  /** Where one run ends and the next begins. */
  private lifecycle(observation: Observation, now: number): CaptureEvent[] {
    switch (observation.screen) {
      case "enterArea":
        this.areaUntil = now + AREA_GRACE_MS;
        return [];
      case "lifeOrDeath":
        this.deathAt = now;
        return [];
      case "gameplay": {
        const events: CaptureEvent[] = now <= this.areaUntil ? [{ type: "runStarted" }] : this.endReported ? [{ type: "runResumed" }] : [];
        this.areaUntil = 0;
        this.deathAt = null;
        this.endReported = false;
        return events;
      }
      default:
        if (this.deathAt !== null && !this.endReported && now - this.deathAt >= DEATH_GRACE_MS) {
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
        // An Obelisk's "Reroll" deals new cards on the same screen: a card selected before it is no longer on offer.
        const offers = JSON.stringify(observation.offers);
        const remembered = previous && previous.offers === offers ? previous.selectedId : null;
        this.pending = { kind: "chest", selectedId: observation.selectedId ?? remembered, offers };
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
        return observation.screen === "ownedMagic" ? [{ type: "magicsSynced", entries: observation.entries, className: observation.className }] : [{ type: "artifactsSynced", ids: observation.ids }];
      }

      default:
        // Pause, Synergy, a transition frame: nothing happened, and a choice in progress stays in progress.
        return [];
    }
  }
}
