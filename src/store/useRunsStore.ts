import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentRunState } from "../types/game";
import { freshRun, profileOf, useRunStore, type RunProfile } from "./useRunStore";

/**
 * Every run the player has had, so one never overwrites another. The game itself only ever has
 * **one run in progress** (it can be saved and continued, never run alongside another), so here
 * too at most one record is not `ended` — the rest are history, kept to look back at past builds.
 *
 * `useRunStore` stays what every screen and formula reads: it holds the *loaded* run — normally
 * the one in progress, or an old one the player opened from the Runs screen. This store mirrors
 * it into its record on every change, and swaps another record's run in on `loadRun`.
 */
export interface RunRecord {
  id: string;
  startedAt: number;
  /** The last time anything in it changed. */
  updatedAt: number;
  ended: boolean;
  run: CurrentRunState;
}

interface RunsStore {
  /** Newest first. */
  records: RunRecord[];
  /** The record `useRunStore`'s run belongs to. */
  loadedId: string | null;
  /** The account-wide part (research, class levels, unlocked subjects) as of the latest run in progress. */
  profile: RunProfile | null;
}

export const useRunsStore = create<RunsStore>()(
  persist((): RunsStore => ({ records: [], loadedId: null, profile: null }), { name: "magic-survival-runs" }),
);

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function newRecord(run: CurrentRunState): RunRecord {
  const now = Date.now();
  return { id: newId(), startedAt: now, updatedAt: now, ended: false, run };
}

/** Nothing has happened in it yet: no point keeping it as history, and it can be reused as the next new run. */
function isUntouched(run: CurrentRunState): boolean {
  return run.currentLevel <= 1 && run.acquiredMagicIds.length === 0 && run.equipped.length === 0 && Object.keys(run.magicLevels).length === 0;
}

export function getActiveRun(): RunRecord | undefined {
  return useRunsStore.getState().records.find((record) => !record.ended);
}

/** Shows `id`'s run: it becomes what `useRunStore` holds. */
export function loadRun(id: string) {
  const record = useRunsStore.getState().records.find((r) => r.id === id);
  if (!record) return;
  useRunsStore.setState({ loadedId: id });
  useRunStore.getState().loadRun(record.run);
}

/**
 * Starts a run from the profile: the one in progress (if any) becomes history, and the new one is loaded.
 * A run in progress nothing has happened in yet is simply reused — starting twice in a row leaves one run, not two.
 */
export function startNewRun(): string {
  const { records, profile } = useRunsStore.getState();
  const active = records.find((record) => !record.ended);
  if (active && isUntouched(active.run)) {
    loadRun(active.id);
    return active.id;
  }
  const record = newRecord(freshRun(profile ?? profileOf(useRunStore.getState().run)));
  useRunsStore.setState({ records: [record, ...records.map((r) => (r.ended ? r : { ...r, ended: true }))], loadedId: record.id });
  useRunStore.getState().loadRun(record.run);
  return record.id;
}

/** The run in progress is over (the character died, or the player quit): it stays, as history. */
export function endActiveRun() {
  useRunsStore.setState(({ records }) => ({ records: records.map((r) => (r.ended ? r : { ...r, ended: true })) }));
}

/**
 * Makes sure there is a run in progress and that it is the loaded one — what live sync calls before recording
 * anything, so what happens in the game never lands on an old run the player happens to be looking at. With none
 * in progress the most recent one is reopened: the game went on (a revive, a saved run continued) after it looked over.
 */
export function ensureActiveRunLoaded() {
  const { records, loadedId } = useRunsStore.getState();
  let active = records.find((record) => !record.ended);
  if (!active) {
    if (records.length === 0) {
      startNewRun();
      return;
    }
    active = { ...records[0], ended: false };
    useRunsStore.setState({ records: [active, ...records.slice(1)] });
  }
  if (loadedId !== active.id) loadRun(active.id);
}

/** Deletes a run for good. Deleting the loaded one loads the run in progress (or the newest left, or a new one). */
export function deleteRun(id: string) {
  const { records, loadedId } = useRunsStore.getState();
  const remaining = records.filter((r) => r.id !== id);
  useRunsStore.setState({ records: remaining });
  if (id !== loadedId) return;
  const next = remaining.find((r) => !r.ended) ?? remaining[0];
  if (next) loadRun(next.id);
  else startNewRun();
}

// --- Keeping the two stores in step ---

// First launch with this store (or an older save): the run the app already had becomes the first record.
{
  const { records, loadedId } = useRunsStore.getState();
  const current = useRunStore.getState().run;
  if (!records.some((r) => r.id === loadedId)) {
    const record = newRecord(current);
    useRunsStore.setState({ records: [record, ...records], loadedId: record.id, profile: profileOf(current) });
  } else {
    // `useRunStore` saves on every change; if the two ever disagree after a reload, it is the newer one.
    useRunsStore.setState({ records: records.map((r) => (r.id === loadedId ? { ...r, run: current } : r)) });
  }
}

useRunStore.subscribe(({ run }) => {
  const { records, loadedId, profile } = useRunsStore.getState();
  const loaded = records.find((r) => r.id === loadedId);
  // Same object = a run that was just loaded, not one that changed.
  if (!loaded || loaded.run === run) return;
  useRunsStore.setState({
    records: records.map((r) => (r.id === loadedId ? { ...r, run, updatedAt: Date.now() } : r)),
    // Research or a class level edited while looking at an old run is that old run's record, not the account's.
    profile: loaded.ended ? profile : profileOf(run),
  });
});
